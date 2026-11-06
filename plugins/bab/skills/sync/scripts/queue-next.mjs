#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const PRIORITY_ORDER = ['P0', 'P1', 'P2', 'P3']
const BLOCKED_LABEL = 'blocked'
const NOTHING_TO_PICK = 3
const USAGE = 'node queue-next.mjs [--max-in-progress N] [--json]'

const labelNames = (issue) => issue.labels.map((label) => label.name)

/**
 * 이슈 본문의 `Wiki`(또는 옛 제목 `관련 wiki`) 섹션(h1~h3)에서 wiki 경로를 모읍니다. 안내용 HTML 주석은 무시합니다.
 */
export function readWikiPaths(body) {
  const section = (body ?? '').split(/^#{1,3}\s*(?:Wiki|관련 wiki)\s*$/im)[1]
  if (!section) return []
  const content = section.split(/^#{1,3}\s/m)[0].replace(/<!--[\s\S]*?-->/g, '')
  return [...content.matchAll(/wiki\/[^\s`)]+/g)].map((match) => match[0])
}

/**
 * 중요도 라벨의 순위를 돌려줍니다. 라벨이 없으면 가장 뒤입니다.
 */
export function priorityRank(issue) {
  const rank = PRIORITY_ORDER.findIndex((priority) => labelNames(issue).includes(priority))
  return rank === -1 ? PRIORITY_ORDER.length : rank
}

const byPriorityThenAge = (left, right) =>
  priorityRank(left) - priorityRank(right) || left.number - right.number

/**
 * 확정 이슈와 진행 중 이슈로 다음에 처리할 이슈를 고릅니다.
 */
export function pickNext({ decided, inProgress, maxInProgress = 1 }) {
  if (inProgress.length >= maxInProgress) {
    const numbers = inProgress.map((issue) => `#${issue.number}`).join(', ')
    return { next: null, waiting: `진행 중 ${inProgress.length}건 (${numbers})`, skipped: [] }
  }
  const busyPaths = new Set(inProgress.flatMap((issue) => readWikiPaths(issue.body)))
  const reasonToSkip = (issue) => {
    if (labelNames(issue).includes(BLOCKED_LABEL)) return '`blocked`'
    const overlap = readWikiPaths(issue.body).filter((path) => busyPaths.has(path))
    return overlap.length > 0 ? `진행 중 이슈와 wiki 겹침: ${overlap.join(', ')}` : undefined
  }
  const ordered = [...decided].sort(byPriorityThenAge)
  const skipped = ordered
    .map((issue) => ({ number: issue.number, reason: reasonToSkip(issue) }))
    .filter((entry) => entry.reason)
  const skippedNumbers = new Set(skipped.map((entry) => entry.number))
  const next = ordered.find((issue) => !skippedNumbers.has(issue.number)) ?? null
  return { next: next && { number: next.number, title: next.title }, waiting: null, skipped }
}

const listIssues = (label) =>
  JSON.parse(
    execFileSync(
      'gh',
      [
        'issue',
        'list',
        '--label',
        label,
        '--state',
        'open',
        '--limit',
        '200',
        '--json',
        'number,title,labels,body',
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    )
  )

/**
 * 명령행 인자에서 동시 진행 상한과 출력 형식을 읽습니다.
 */
export function parseArgs(argv) {
  const limitIndex = argv.indexOf('--max-in-progress')
  const maxInProgress = limitIndex === -1 ? 1 : Number(argv[limitIndex + 1])
  return { maxInProgress, json: argv.includes('--json') }
}

const describeHead = ({ next, waiting }) => {
  if (next) return `다음 이슈: #${next.number} ${next.title}`
  if (waiting) return `대기: ${waiting}. PR이 머지되면 다음 이슈를 고릅니다`
  return '큐가 비었습니다: 처리할 `status:decided` 이슈가 없습니다'
}

const formatResult = ({ next, waiting, skipped }) => {
  const head = describeHead({ next, waiting })
  const rows = skipped.map(({ number, reason }) => `| #${number} | ${reason} |`)
  const table = rows.length > 0 ? ['', '| 건너뜀 | 이유 |', '| --- | --- |', ...rows] : []
  return [`## bab queue`, '', head, ...table, ''].join('\n')
}

const run = (argv) => {
  const { maxInProgress, json } = parseArgs(argv)
  if (!Number.isInteger(maxInProgress) || maxInProgress < 1) {
    process.stderr.write(`--max-in-progress는 1 이상의 정수입니다.\n사용법: ${USAGE}\n`)
    return 2
  }
  const result = pickNext({
    decided: listIssues('status:decided'),
    inProgress: listIssues('status:in-progress'),
    maxInProgress,
  })
  process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : formatResult(result))
  return result.next ? 0 : NOTHING_TO_PICK
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run(process.argv.slice(2))
}
