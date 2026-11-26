#!/usr/bin/env node
import { appendFileSync, lstatSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkProse, proseLines } from '../skills/audit/scripts/prose-check.mjs'

const TARGET_DIRS = ['wiki', 'docs', 'plugins/bab/skills']
const USAGE = 'node prose-diff.mjs <기준 저장소> <PR 저장소>'
const isDirectory = (path) => lstatSync(path, { throwIfNoEntry: false })?.isDirectory() ?? false

const collectMarkdown = (root) => {
  if (!isDirectory(root)) throw new Error(`저장소 디렉터리가 아닙니다: ${root}`)
  const files = new Map()
  const addFile = (path) => files.set(relative(root, path).split(sep).join('/'), path)
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && /^README.*\.md$/.test(entry.name)) addFile(join(root, entry.name))
  }
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.isFile() && entry.name.endsWith('.md')) addFile(path)
    }
  }
  for (const target of TARGET_DIRS) {
    let directory = root
    for (const segment of target.split('/')) {
      directory = directory && isDirectory(join(directory, segment)) ? join(directory, segment) : null
    }
    if (directory) walk(directory)
  }
  return files
}

const violations = (content) => {
  const lines = new Map([...proseLines(content)].map(({ number, text }) => [number, text]))
  return checkProse(content).map((item) => ({
    ...item,
    key: `${item.rule}\u0000${item.detail}\u0000${(lines.get(item.number) ?? '').replace(/\s+/g, ' ').trim()}`,
  }))
}

/** 기준과 PR의 새 문장 위반을 비교합니다. @see wiki/unit/prose/diffProse.md */
export function diffProse(baseRoot, headRoot) {
  const baseFiles = collectMarkdown(baseRoot)
  const headFiles = collectMarkdown(headRoot)
  const introduced = []
  let checkedFiles = 0
  for (const path of [...headFiles.keys()].sort()) {
    const basePath = baseFiles.get(path)
    const baseBuffer = basePath ? readFileSync(basePath) : null
    const headBuffer = readFileSync(headFiles.get(path))
    if (baseBuffer?.equals(headBuffer)) continue
    checkedFiles += 1
    const counts = new Map()
    for (const { key } of baseBuffer === null ? [] : violations(baseBuffer.toString('utf8'))) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    for (const { number, rule, detail, key } of violations(headBuffer.toString('utf8'))) {
      const oldCount = counts.get(key) ?? 0
      if (oldCount > 0) counts.set(key, oldCount - 1)
      else introduced.push({ path, number, rule, detail })
    }
  }
  return { checkedFiles, introduced }
}

const tableText = (value) => String(value).replace(/\|/g, '\\|').replace(/[\r\n`]/g, ' ')
const formatSummary = ({ checkedFiles, introduced }) => {
  const lines = [
    '## bab 문서 품질', '',
    `새 파일 또는 내용이 바뀐 Markdown ${checkedFiles}개를 대조했습니다. 이 PR이 만든 새 위반 ${introduced.length}건. 문장 위반은 보고 전용입니다. 의미와 동작은 별도로 확인합니다.`, '',
  ]
  if (introduced.length > 0) {
    lines.push('| 경로 | 줄 | 규칙 | 상세 |', '| --- | ---: | --- | --- |')
    lines.push(...introduced.map(({ path, number, rule, detail }) =>
      `| \`${tableText(path)}\` | ${number} | ${tableText(rule)} | ${tableText(detail)} |`))
    lines.push('')
  }
  return `${lines.join('\n')}\n`
}

const run = (args) => {
  if (args.length !== 2) {
    process.stderr.write(`사용법: ${USAGE}\n`)
    return 2
  }
  try {
    const summary = formatSummary(diffProse(args[0], args[1]))
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
    process.stdout.write(summary)
    return 0
  } catch (error) {
    process.stderr.write(`문서 입력·실행 오류: ${error.message}\n`)
    return 2
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run(process.argv.slice(2))
}
