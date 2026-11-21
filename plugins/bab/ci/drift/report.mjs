import { readFileSync } from 'node:fs'

const REASONS = new Set(['unsupported-language', 'unsupported-syntax', 'unknown-language', 'mixed-language', 'language-conflict'])
const strings = (value) => Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.length > 0)
const unique = (value) => new Set(value).size === value.length
const integer = (value) => Number.isSafeInteger(value) && value >= 0
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const finding = (value) => record(value) && ['target', 'kind', 'message'].every((key) => typeof value[key] === 'string' && value[key].length > 0)

/** 미검증 wiki와 관련 코드의 보호 대상을 모읍니다. @see wiki/unit/drift/protectedTargets.md */
export function protectedTargets(unverified) {
  return new Set(unverified.flatMap(({ target, code }) => [target, ...code]))
}

/** 실제 위반과 미검증을 나눠 집계합니다. @see wiki/unit/drift/makeReport.md */
export function makeReport(report) {
  const { hasIndex, pageCount = 0, referenceCount = 0, items = [], unverified = [], checkedTargets = [] } = report
  const unverifiedPageCount = new Set(unverified.map(({ target }) => target)).size
  const blocked = protectedTargets(unverified)
  const status = items.length > 0 ? 'fail' : unverified.length > 0 ? 'incomplete' : pageCount === 0 ? 'no-target' : 'pass'
  return {
    hasIndex, pageCount, referenceCount, status, items, unverified,
    checkedPageCount: pageCount - unverifiedPageCount, unverifiedPageCount,
    checkedTargets: [...new Set(checkedTargets)].filter((target) => !blocked.has(target)),
  }
}

/** 보고서 계약을 검사하고 이전 JSON을 거부합니다. @see wiki/unit/drift/readReport.md */
export function readReport(path) {
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'))
    if (!record(value) || typeof value.hasIndex !== 'boolean') throw new Error('보고서 객체가 아닙니다')
    if (!['pageCount', 'referenceCount', 'checkedPageCount', 'unverifiedPageCount'].every((key) => integer(value[key]))) throw new Error('페이지 집계가 올바르지 않습니다')
    if (!Array.isArray(value.items) || !value.items.every(finding)) throw new Error('실제 위반 목록이 올바르지 않습니다')
    if (!Array.isArray(value.unverified) || !value.unverified.every((entry) => record(entry)
      && typeof entry.target === 'string' && entry.target.startsWith('wiki/') && entry.target.endsWith('.md')
      && strings(entry.code) && REASONS.has(entry.reason) && typeof entry.message === 'string' && entry.message.length > 0)) throw new Error('미검증 목록이 올바르지 않습니다')
    if (!strings(value.checkedTargets) || !unique(value.checkedTargets)) throw new Error('검사 근거 경로가 올바르지 않습니다')
    const expected = makeReport(value)
    if (expected.status !== value.status || expected.checkedPageCount !== value.checkedPageCount
      || expected.unverifiedPageCount !== value.unverifiedPageCount
      || expected.checkedTargets.length !== value.checkedTargets.length) throw new Error('상태·집계·보호 대상이 맞지 않습니다')
    if (!value.hasIndex && (value.pageCount > 0 || value.referenceCount > 0)) throw new Error('인덱스 없는 페이지 집계입니다')
    return value
  } catch (error) {
    throw new Error(`보고서를 같은 버전의 검사기로 다시 생성하세요: ${error.message}`)
  }
}
