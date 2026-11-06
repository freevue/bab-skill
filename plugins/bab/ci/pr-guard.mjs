#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const CLOSING_PATTERN = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi
const REFERENCE_PATTERN = /\brefs?\s+#(\d+)\b/gi
const CODE_FENCE = /^ {0,3}(?<fence>(?<mark>`|~)\k<mark>{2,})[^\r\n]*\r?\n[\s\S]*?(?:^ {0,3}\k<fence>\k<mark>*[ \t]*(?:\r?\n|$)|(?![\s\S]))/
const HTML_COMMENT = /<!--[\s\S]*?(?:-->|(?![\s\S]))/
const INLINE_CODE = /(?<!`)(?<ticks>`+)(?!`)[\s\S]*?(?<!`)\k<ticks>(?!`)/
const NON_PROSE = new RegExp([CODE_FENCE, HTML_COMMENT, INLINE_CODE].map(({ source }) => source).join('|'), 'gm')
const GATE_LABELS = ['status:decided', 'status:in-progress']
const SKIP_LABEL = 'no-spec'

const violation = (rule, message, fix) => ({ rule, message, fix })

const collectNumbers = (text, pattern) => [
  ...new Set([...text.matchAll(pattern)].map((match) => Number(match[1]))),
]

/**
 * PR 본문의 이슈 참조를 닫는 참조(closing)와 일반 참조(references)로 나눕니다.
 */
export function parseIssueRefs(body) {
  const text = (body ?? '').replace(NON_PROSE, ' ')
  return {
    closing: collectNumbers(text, CLOSING_PATTERN),
    references: collectNumbers(text, REFERENCE_PATTERN),
  }
}

/**
 * PR이 이슈에 연결되어 있는지 검사합니다. no-spec 라벨이 있으면 통과합니다.
 */
function checkLinkRule({ closing, references, labels }) {
  if (labels.includes(SKIP_LABEL)) return []
  if (closing.length + references.length > 0) return []
  return [
    violation(
      '이슈 연결',
      '본문에 `Closes #N` 또는 `Refs #N`이 없습니다',
      '관련 이슈를 본문에 적거나, 이슈 없는 작은 수정이면 `no-spec` 라벨을 붙이세요'
    ),
  ]
}

/**
 * 닫을 이슈가 열려 있고 확정(decided) 또는 진행(in-progress) 상태인지 검사합니다.
 */
export function checkGateRule(issue) {
  const labels = issue.labels.map((label) => label.name)
  if (issue.state !== 'OPEN') {
    return [
      violation('확정 게이트', `#${issue.number}이 열려 있지 않습니다`, '열린 이슈를 연결하세요'),
    ]
  }
  if (labels.some((label) => GATE_LABELS.includes(label))) return []
  return [
    violation(
      '확정 게이트',
      `#${issue.number}이 확정되지 않았습니다 (현재 라벨: ${labels.join(', ') || '없음'})`,
      '사람이나 에이전트가 이슈를 확정한 뒤 다시 실행하세요. 부분 구현이면 `Refs #N`을 쓰세요'
    ),
  ]
}

const viewIssue = (repository) => (issueNumber) =>
  JSON.parse(
    execFileSync(
      'gh',
      ['issue', 'view', String(issueNumber), '-R', repository, '--json', 'number,state,labels'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    )
  )

/**
 * 참조한 이슈를 조회하고 필요하면 확정 상태를 검사합니다.
 */
const checkIssue = (loadIssue, rule, validate) => (issueNumber) => {
  try {
    const issue = loadIssue(issueNumber)
    if (issue?.number === issueNumber) return validate(issue)
  } catch {
    return [violation(rule, `#${issueNumber}을 조회할 수 없습니다`, '이슈 번호와 조회 권한을 확인하세요')]
  }
  return [violation(rule, `#${issueNumber}을 찾을 수 없습니다`, '이슈 번호를 확인하세요')]
}

export const checkClosingIssue = (loadIssue) => checkIssue(loadIssue, '확정 게이트', checkGateRule)

/**
 * PR 이벤트 하나에 대한 모든 위반을 모읍니다.
 */
export function guardPullRequest(pullRequest, loadIssue) {
  const labels = pullRequest.labels.map((label) => label.name)
  const { closing, references } = parseIssueRefs(pullRequest.body)
  return [
    ...checkLinkRule({ closing, references, labels }),
    ...closing.flatMap(checkClosingIssue(loadIssue)),
    ...references
      .filter((number) => !closing.includes(number))
      .flatMap(checkIssue(loadIssue, '이슈 연결', () => [])),
  ]
}

const formatSummary = (violations) => {
  if (violations.length === 0) return '## bab PR guard\n\n모든 검사를 통과했습니다.\n'
  const rows = violations.map(({ rule, message, fix }) => `| ${rule} | ${message} | ${fix} |`)
  const header = ['## bab PR guard', '', '| 규칙 | 문제 | 고치는 법 |', '| --- | --- | --- |']
  return [...header, ...rows, ''].join('\n')
}

const writeSummary = (text) => {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text)
  process.stdout.write(text)
}

const run = () => {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
  if (!event.pull_request) {
    process.stdout.write('PR 이벤트가 아니므로 건너뜁니다.\n')
    return 0
  }
  const violations = guardPullRequest(event.pull_request, viewIssue(process.env.GITHUB_REPOSITORY))
  writeSummary(formatSummary(violations))
  return violations.length === 0 ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) process.exitCode = run()
