#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { normalizeText } from '../skills/audit/scripts/frontmatter.mjs'
import { checkWiki, readPage, walkMarkdown } from '../skills/audit/scripts/wiki-check.mjs'
import { detectDrift } from './drift/detect.mjs'
import { makeReport } from './drift/report.mjs'

const USAGE = 'node drift-check.mjs <저장소 루트> [--json]'

const isInside = (root, path) => {
  const localPath = relative(root, path)
  return !isAbsolute(localPath) && localPath !== '..' && !localPath.startsWith(`..${sep}`)
}

/** 루트 내부의 일반 소스 파일만 읽는 함수를 반환합니다. @see wiki/unit/drift/sourceReader.md */
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

/** wiki의 실제 위반과 미검증을 집계합니다. @see wiki/unit/drift/collectDrift.md */
export function collectDrift(repoRoot) {
  const wikiRoot = join(repoRoot, 'wiki')
  const directory = lstatSync(wikiRoot, { throwIfNoEntry: false })
  if (!directory) return makeReport({ hasIndex: false })
  const index = directory.isDirectory() && lstatSync(join(wikiRoot, 'index.md'), { throwIfNoEntry: false })
  if (!index || !index.isFile()) {
    return makeReport({
      hasIndex: false,
      pageCount: 0,
      referenceCount: 0,
      items: [{ target: 'wiki/index.md', kind: 'wiki 구조', message: '일반 파일인 index.md가 없습니다' }],
    })
  }
  const pages = [...walkMarkdown(wikiRoot)].map(readPage(wikiRoot))
  const pageCount = pages.filter((page) => ['policy', 'feature', 'unit', 'type'].includes(page.type)).length
  const referenceCount = pages.filter((page) => page.type === 'reference').length
  const findings = detectDrift({
    pages,
    readSource: sourceReader(repoRoot),
    structureIssues: checkWiki(wikiRoot),
  })
  return makeReport({
    hasIndex: true,
    pageCount,
    referenceCount,
    ...findings,
  })
}

const formatTable = ({ items, pageCount, referenceCount, status, unverified, checkedPageCount, unverifiedPageCount }) => {
  if (status === 'no-target') return `## bab drift check\n\n검사 대상 없음: 명세 페이지 0건. 참고 문서 ${referenceCount}건 구조 검사. 테스트 미실행.\n`
  if (items.length === 0 && unverified.length === 0) return `## bab drift check\n\n명세 페이지 ${pageCount}건, 참고 문서 ${referenceCount}건 검사. 불일치 없음. 테스트 미실행, 동작 의미 미검증.\n`
  const rows = items.map(({ target, kind, message }) => `| \`${target}\` | ${kind} | ${message} |`)
  const header = ['## bab drift check', '', '| 대상 | 종류 | 내용 |', '| --- | --- | --- |']
  const pending = unverified.map(({ target, reason, message }) => `| \`${target}\` | 미검증: ${reason} | ${message} |`)
  return [...header, ...rows, ...pending, '', `명세 ${pageCount}건, 검사 완료 ${checkedPageCount}건, 미검증 ${unverifiedPageCount}건, 참고 ${referenceCount}건. 실제 위반 ${items.length}건. 테스트 미실행, 동작 의미 미검증.`, ''].join('\n')
}

const run = (argv) => {
  const [repoArg] = argv.filter((arg) => !arg.startsWith('--'))
  if (!repoArg || argv.filter((arg) => !arg.startsWith('--')).length !== 1
    || argv.some((arg) => arg.startsWith('--') && arg !== '--json') || !existsSync(join(repoArg, '.git'))) {
    process.stderr.write(`git 저장소 루트를 지정하세요.\n사용법: ${USAGE}\n`)
    return 2
  }
  const report = collectDrift(resolve(repoArg))
  const output = argv.includes('--json')
    ? `${JSON.stringify(report, null, 2)}\n`
    : formatTable(report)
  process.stdout.write(output)
  return { pass: 0, fail: 1, 'no-target': 3, incomplete: 4 }[report.status]
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = run(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`검사 입력·실행 오류: ${error.message}\n`)
    process.exitCode = 2
  }
}
