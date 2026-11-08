#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { normalizeText } from '../skills/audit/scripts/frontmatter.mjs'
import { checkWiki, readPage, walkMarkdown } from '../skills/audit/scripts/wiki-check.mjs'
import { detectDrift } from './drift/detect.mjs'

const USAGE = 'node drift-check.mjs <저장소 루트> [--json]'

const isInside = (root, path) => {
  const localPath = relative(root, path)
  return !isAbsolute(localPath) && localPath !== '..' && !localPath.startsWith(`..${sep}`)
}

/**
 * 실제 위치가 저장소 안인 일반 파일만 읽습니다.
 */
export const sourceReader = (repoRoot) => {
  const root = realpathSync(repoRoot)
  return (path) => {
    if (isAbsolute(path)) return undefined
    const fullPath = resolve(root, path)
    if (!isInside(root, fullPath) || !existsSync(fullPath)) return undefined
    const actualPath = realpathSync(fullPath)
    if (!isInside(root, actualPath) || !statSync(actualPath).isFile()) return undefined
    return normalizeText(readFileSync(actualPath, 'utf8'))
  }
}

/**
 * 드리프트 항목과 wiki 인덱스를 검사할 수 있었는지를 함께 보고합니다.
 */
export function collectDrift(repoRoot) {
  const wikiRoot = join(repoRoot, 'wiki')
  const directory = lstatSync(wikiRoot, { throwIfNoEntry: false })
  if (!directory) return { hasIndex: false, pageCount: 0, status: 'no-target', items: [] }
  const index = directory.isDirectory() && lstatSync(join(wikiRoot, 'index.md'), { throwIfNoEntry: false })
  if (!index || !index.isFile()) {
    return {
      hasIndex: false,
      pageCount: 0,
      status: 'fail',
      items: [{ target: 'wiki/index.md', kind: 'wiki 구조', message: '일반 파일인 index.md가 없습니다' }],
    }
  }
  const pages = [...walkMarkdown(wikiRoot)].map(readPage(wikiRoot))
  const pageCount = pages.filter((page) => !['index.md', 'log.md'].includes(page.name)).length
  const items = detectDrift({
    pages,
    readSource: sourceReader(repoRoot),
    structureIssues: checkWiki(wikiRoot),
  })
  return {
    hasIndex: true,
    pageCount,
    status: items.length > 0 ? 'fail' : pageCount === 0 ? 'no-target' : 'pass',
    items,
  }
}

const formatTable = ({ items, pageCount, status }) => {
  if (status === 'no-target') return '## bab drift check\n\n검사 대상 없음: 명세 페이지 0건. 테스트 미실행.\n'
  if (items.length === 0) return `## bab drift check\n\n명세 페이지 ${pageCount}건 검사. 불일치 없음. 테스트 미실행, 동작 의미 미검증.\n`
  const rows = items.map(({ target, kind, message }) => `| \`${target}\` | ${kind} | ${message} |`)
  const header = ['## bab drift check', '', '| 대상 | 종류 | 내용 |', '| --- | --- | --- |']
  return [...header, ...rows, '', `명세 페이지 ${pageCount}건 검사. 불일치 ${items.length}건. 테스트 미실행, 동작 의미 미검증.`, ''].join('\n')
}

const run = (argv) => {
  const [repoArg] = argv.filter((arg) => !arg.startsWith('--'))
  if (!repoArg || !existsSync(join(repoArg, '.git'))) {
    process.stderr.write(`git 저장소 루트를 지정하세요.\n사용법: ${USAGE}\n`)
    return 2
  }
  const report = collectDrift(resolve(repoArg))
  const output = argv.includes('--json')
    ? `${JSON.stringify(report, null, 2)}\n`
    : formatTable(report)
  process.stdout.write(output)
  return report.status === 'no-target' ? 3 : report.items.length === 0 ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run(process.argv.slice(2))
}
