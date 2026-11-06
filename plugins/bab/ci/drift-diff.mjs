#!/usr/bin/env node
import { appendFileSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const USAGE = 'node drift-diff.mjs <base.json> <head.json>'
const FIX_HINT = 'wiki를 고치거나, 코드를 wiki에 맞추세요'

const itemKey = ({ target, kind, message }) => `${target}\u0000${kind}\u0000${message}`

/**
 * base와 head의 드리프트 항목을 비교해 새로 생긴 것, 해소된 것, 그대로인 것으로 나눕니다.
 */
export function diffDrift(baseItems, headItems) {
  const baseKeys = new Set(baseItems.map(itemKey))
  const headKeys = new Set(headItems.map(itemKey))
  return {
    introduced: headItems.filter((item) => !baseKeys.has(itemKey(item))),
    resolved: baseItems.filter((item) => !headKeys.has(itemKey(item))),
    unchanged: headItems.filter((item) => baseKeys.has(itemKey(item))),
  }
}

const tableRows = (items) =>
  items.map(({ target, kind, message }) => `| \`${target}\` | ${kind} | ${message} |`)

/**
 * 비교 결과를 Actions 요약용 Markdown으로 만듭니다.
 */
export function formatDiff({ introduced, resolved, unchanged }) {
  const lines = ['## bab 형상 일치', '']
  if (introduced.length === 0) lines.push('이 PR이 만든 wiki–코드 불일치가 없습니다.', '')
  else {
    lines.push(`이 PR이 만든 불일치 ${introduced.length}건. ${FIX_HINT}.`, '')
    lines.push('| 대상 | 종류 | 내용 |', '| --- | --- | --- |', ...tableRows(introduced), '')
  }
  if (resolved.length > 0) {
    lines.push(`이 PR이 해소한 불일치 ${resolved.length}건`, '')
    lines.push('| 대상 | 종류 | 내용 |', '| --- | --- | --- |', ...tableRows(resolved), '')
  }
  if (unchanged.length > 0) {
    lines.push(`기존 불일치 ${unchanged.length}건은 이 PR과 무관하므로 실패로 보지 않습니다.`, '')
  }
  return lines.join('\n')
}

const readItems = (path) => JSON.parse(readFileSync(path, 'utf8')).items

const run = ([basePath, headPath]) => {
  if (!basePath || !headPath) {
    process.stderr.write(`사용법: ${USAGE}\n`)
    return 2
  }
  const result = diffDrift(readItems(basePath), readItems(headPath))
  const summary = formatDiff(result)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
  process.stdout.write(summary)
  return result.introduced.length === 0 ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run(process.argv.slice(2))
}
