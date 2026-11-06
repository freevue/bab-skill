#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { normalizeText } from './frontmatter.mjs'

const MAX_WORDS = 25
const HEDGES = [
  '수도 있',
  '것 같습니다',
  '것 같은',
  '일 것입니다',
  '것이 좋습니다',
  '아마 ',
  '어쩌면',
]
const FILLERS = [
  '단순히',
  '효과적으로',
  '강력한',
  '매우',
  '다양한',
  '핵심적인',
  '손쉽게',
  '원활하게',
]
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u
const DASH_PATTERN = /[—–]/
const USAGE = 'node prose-check.mjs <파일...>'

/**
 * 한 줄에서 검사 대상이 아닌 부분(인라인 코드, 링크 주소, HTML 주석)을 지웁니다.
 */
export function stripCode(line) {
  return line
    .replace(/`[^`]*`/g, '``')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/<!--.*?-->/g, '')
}

/**
 * 문서에서 코드 블록과 frontmatter를 뺀 줄을 줄 번호와 함께 내보냅니다.
 */
export function* proseLines(text) {
  const lines = normalizeText(text).split('\n')
  const frontmatterEnd = lines[0] === '---' ? lines.indexOf('---', 1) : -1
  const fenceFlags = lines.reduce(
    (flags, line) => {
      const isFence = /^\s*(```|~~~)/.test(line)
      const inside = flags.inside !== isFence
      return { inside, list: [...flags.list, flags.inside || isFence] }
    },
    { inside: false, list: [] }
  ).list
  for (const [index, line] of lines.entries()) {
    if (index <= frontmatterEnd || fenceFlags[index]) continue
    yield { number: index + 1, text: stripCode(line) }
  }
}

const splitSentences = (text) =>
  text
    .split('|')
    .map((cell) => cell.replace(/^\s*(?:[-*>]|\d+\.|>\s*\[!\w+\])\s*/, '').trim())
    .flatMap((cell) => cell.split(/(?<=[.!?])\s+/))
    .filter((sentence) => sentence && !/^:?-{3,}:?$/.test(sentence))

/**
 * 한 줄을 규칙별로 검사해 위반 목록을 돌려줍니다.
 */
export function checkLine(text) {
  const found = []
  if (DASH_PATTERN.test(text.replace(/\d[—–]\d/g, ''))) found.push(['대시', '문장을 잇는 대시'])
  if (text.replace(/\|/g, '').includes(';')) found.push(['세미콜론', '문장을 잇는 세미콜론'])
  if (text.includes('**')) found.push(['굵게', '강조용 굵게'])
  if (EMOJI_PATTERN.test(text)) found.push(['이모지', '이모지'])
  HEDGES.filter((word) => text.includes(word)).forEach((word) => found.push(['모호', word]))
  FILLERS.filter((word) => text.includes(word)).forEach((word) => found.push(['수식어', word]))
  splitSentences(text)
    .filter((sentence) => sentence.split(/\s+/).length > MAX_WORDS)
    .forEach((sentence) => found.push(['긴 문장', `${sentence.split(/\s+/).length}어절`]))
  return found
}

/**
 * 파일 하나를 검사해 `{ number, rule, detail }` 목록을 돌려줍니다.
 */
export function checkProse(text) {
  return [...proseLines(text)].flatMap(({ number, text: line }) =>
    checkLine(line).map(([rule, detail]) => ({ number, rule, detail }))
  )
}

const run = (paths) => {
  if (paths.length === 0 || paths.some((path) => !existsSync(path))) {
    process.stderr.write(`파일을 지정하세요.\n사용법: ${USAGE}\n`)
    return 2
  }
  const rows = paths.flatMap((path) =>
    checkProse(readFileSync(path, 'utf8')).map(
      ({ number, rule, detail }) => `${path}:${number}\t${rule}\t${detail}\n`
    )
  )
  process.stdout.write(rows.length > 0 ? rows.join('') : '위반 없음\n')
  return rows.length > 0 ? 1 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run(process.argv.slice(2))
}
