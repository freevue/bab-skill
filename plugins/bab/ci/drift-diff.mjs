#!/usr/bin/env node
import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { protectedTargets, readReport } from './drift/report.mjs'

const USAGE = 'node drift-diff.mjs <base.json> <head.json>'
const FIX_HINT = 'wiki를 고치거나, 코드를 wiki에 맞추세요'

const itemKey = ({ target, kind, message }) => `${target}\u0000${kind}\u0000${message}`

/** 실제 위반을 추가·해소·유지로 나눕니다. @see wiki/unit/drift/diffDrift.md */
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

/** 실제 위반과 미검증 범위의 비교 요약을 만듭니다. @see wiki/unit/drift/formatDiff.md */
export function formatDiff(result) {
  const { introduced, resolved, unchanged, pageCount, referenceCount, status, unverified = [], checkedPageCount, unverifiedPageCount } = result
  const lines = ['## bab 형상 일치', '']
  if (status === 'no-target' && introduced.length === 0) lines.push(`검사 대상 없음: 명세 페이지 0건. 참고 문서 ${referenceCount ?? 0}건 구조 검사. 테스트 미실행.`, '')
  else if (introduced.length === 0 && unverified.length === 0) lines.push(`명세 페이지 ${pageCount}건, 참고 문서 ${referenceCount ?? 0}건 검사. 이 PR이 만든 wiki–코드 불일치가 없습니다. 테스트 미실행, 동작 의미 미검증.`, '')
  else if (introduced.length === 0) lines.push('미검증이 남아 전체 형상 검증을 완료하지 못했습니다.', '')
  else {
    lines.push(`이 PR이 만든 불일치 ${introduced.length}건. ${FIX_HINT}.`, '')
    lines.push('| 대상 | 종류 | 내용 |', '| --- | --- | --- |', ...tableRows(introduced), '')
  }
  if (unverified.length > 0) {
    lines.push(`명세 ${pageCount}건, 검사 완료 ${checkedPageCount}건, 미검증 ${unverifiedPageCount}건.`, '')
    lines.push('| 대상 | 미검증 사유 | 근거 |', '| --- | --- | --- |',
      ...unverified.map(({ target, reason, message }) => `| \`${target}\` | ${reason} | ${message} |`), '',
      '테스트 미실행, 동작 의미 미검증.', '')
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

const compareReports = (base, head) => {
  if (base.hasIndex && !head.hasIndex) {
    return {
      ...head,
      introduced: [{ target: 'wiki/index.md', kind: 'wiki 구조', message: '기존 wiki 인덱스가 사라졌습니다' }],
      resolved: [],
      unchanged: [],
    }
  }
  if ((base.pageCount ?? 0) > 0 && head.pageCount === 0) {
    return {
      ...head,
      introduced: [{ target: 'wiki/index.md', kind: 'wiki 구조', message: '기존 명세 페이지가 모두 사라졌습니다' }],
      resolved: [],
      unchanged: [],
    }
  }
  const diff = diffDrift(base.items, head.items)
  const blocked = protectedTargets(head.unverified)
  const checked = new Set(head.checkedTargets)
  return { ...head, ...diff, resolved: diff.resolved.filter(({ target }) => !blocked.has(target) && checked.has(target)) }
}

const run = (args) => {
  const [basePath, headPath] = args
  if (args.length !== 2) {
    process.stderr.write(`사용법: ${USAGE}\n`)
    return 2
  }
  const result = compareReports(readReport(basePath), readReport(headPath))
  const summary = formatDiff(result)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
  process.stdout.write(summary)
  return result.introduced.length > 0 ? 1 : result.unverified?.length > 0 ? 4 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = run(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`보고서 입력·실행 오류: ${error.message}\n`)
    process.exitCode = 2
  }
}
