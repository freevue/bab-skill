#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkWiki, readPage, walkMarkdown } from '../skills/audit/scripts/wiki-check.mjs'
import { detectDrift, readFrontmatter } from './drift/detect.mjs'

const TEST_FILE_PATTERN = /(?:\.(?:test|spec)\.[cm]?[jt]sx?$)|(?:^|\/)(?:__tests__|tests)\//
const USAGE = 'node drift-check.mjs <저장소 루트> [--json]'

/**
 * 저장소 기준 상대 경로의 파일을 읽습니다. 없으면 undefined입니다.
 */
export const sourceReader = (repoRoot) => (path) => {
  const fullPath = join(repoRoot, path)
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : undefined
}

/**
 * git이 추적하는 테스트 파일의 경로와 내용을 읽습니다.
 */
export function listTestFiles(repoRoot) {
  const tracked = execFileSync('git', ['-C', repoRoot, 'ls-files'], { encoding: 'utf8' })
  return tracked
    .split('\n')
    .filter((path) => TEST_FILE_PATTERN.test(path))
    .map((path) => ({ path, text: readFileSync(join(repoRoot, path), 'utf8') }))
}

/**
 * 저장소 하나의 드리프트 항목을 모읍니다. wiki가 없으면 빈 목록입니다.
 */
export function collectDrift(repoRoot) {
  const wikiRoot = join(repoRoot, 'wiki')
  if (!existsSync(join(wikiRoot, 'index.md'))) return []
  const pages = [...walkMarkdown(wikiRoot)]
    .map(readPage(wikiRoot))
    .map((page) => ({ ...page, frontmatter: readFrontmatter(page.text) }))
  return detectDrift({
    pages,
    readSource: sourceReader(repoRoot),
    testFiles: listTestFiles(repoRoot),
    structureIssues: checkWiki(wikiRoot),
  })
}

const formatTable = (items) => {
  if (items.length === 0) return '## bab drift check\n\n드리프트가 없습니다.\n'
  const rows = items.map(({ target, kind, message }) => `| \`${target}\` | ${kind} | ${message} |`)
  const header = ['## bab drift check', '', '| 대상 | 종류 | 내용 |', '| --- | --- | --- |']
  return [...header, ...rows, '', `총 ${items.length}건`, ''].join('\n')
}

const run = (argv) => {
  const [repoArg] = argv.filter((arg) => !arg.startsWith('--'))
  if (!repoArg || !existsSync(join(repoArg, '.git'))) {
    process.stderr.write(`git 저장소 루트를 지정하세요.\n사용법: ${USAGE}\n`)
    return 2
  }
  const items = collectDrift(resolve(repoArg))
  const output = argv.includes('--json')
    ? `${JSON.stringify({ items }, null, 2)}\n`
    : formatTable(items)
  process.stdout.write(output)
  return items.length === 0 ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run(process.argv.slice(2))
}
