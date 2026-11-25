#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { inspectMilestones } from '../../milestone/scripts/read-milestones.mjs'
import { listIssues } from './list-issues.mjs'

const PRIORITY_ORDER = ['P0', 'P1', 'P2', 'P3']
const BLOCKED_LABEL = 'blocked'
const NOTHING_TO_PICK = 3
const USAGE = 'node queue-next.mjs [--max-in-progress N] [--json]'

const labelNames = (issue) => issue.labels.map((label) => label.name)
const isBlocked = (issue) => labelNames(issue).includes(BLOCKED_LABEL)

/** 이슈의 Wiki 경로를 모읍니다. @see wiki/unit/sync/readWikiPaths.md */
export function readWikiPaths(body) {
  const section = (body ?? '').split(/^#{1,3}\s*(?:Wiki|관련 wiki)\s*$/im)[1]
  if (!section) return []
  const content = section.split(/^#{1,3}\s/m)[0].replace(/<!--[\s\S]*?-->/g, '')
  return [...content.matchAll(/wiki\/[^\s\x60)]+/g)].map((match) => match[0])
}

/** 중요도 라벨의 순위를 반환합니다. @see wiki/unit/sync/priorityRank.md */
export function priorityRank(issue) {
  const rank = PRIORITY_ORDER.findIndex((priority) => labelNames(issue).includes(priority))
  return rank === -1 ? PRIORITY_ORDER.length : rank
}

const byPriorityThenAge = (left, right) =>
  priorityRank(left) - priorityRank(right) || left.number - right.number

/** 현재 범위의 다음 이슈를 고릅니다. @see wiki/unit/sync/pickNext.md */
export function pickNext({ decided, inProgress, maxInProgress = 1, milestones = { enabled: false, current: null } }) {
  const { enabled, current } = milestones
  const milestoneWaiting = enabled && (!current ? '현재 마일스톤이 지정되지 않았습니다'
    : current.state !== 'open' ? `현재 마일스톤 #${current.number}이 닫혀 있습니다`
      : current.openIssues === 0 ? `현재 마일스톤 #${current.number}에 열린 항목이 없습니다. 목표와 실제 결과를 검토하세요` : null)
  if (milestoneWaiting) return { next: null, waiting: milestoneWaiting, skipped: [] }
  const active = inProgress.filter((issue) => !isBlocked(issue))
  if (active.length >= maxInProgress) {
    const numbers = active.map((issue) => `#${issue.number}`).join(', ')
    return { next: null, waiting: `진행 중 ${active.length}건 (${numbers})`, skipped: [] }
  }
  const busyPaths = new Set(inProgress.flatMap((issue) => readWikiPaths(issue.body)))
  const reasonToSkip = (issue) => {
    if (isBlocked(issue)) return '`blocked`'
    const overlap = readWikiPaths(issue.body).filter((path) => busyPaths.has(path))
    return overlap.length > 0 ? `진행 중 이슈와 wiki 겹침: ${overlap.join(', ')}` : undefined
  }
  const candidates = enabled ? decided.filter((issue) => issue.milestone?.number === current.number) : decided
  const ordered = [...candidates].sort(byPriorityThenAge)
  const skipped = ordered
    .map((issue) => ({ number: issue.number, reason: reasonToSkip(issue) }))
    .filter((entry) => entry.reason)
  const skippedNumbers = new Set(skipped.map((entry) => entry.number))
  const next = ordered.find((issue) => !skippedNumbers.has(issue.number)) ?? null
  const waiting = !next && enabled ? `현재 마일스톤 #${current.number}에 선택할 확정 이슈가 없습니다` : null
  return { next: next && { number: next.number, title: next.title }, waiting, skipped }
}

/** 큐의 기존 옵션을 읽습니다. @see wiki/unit/sync/parseArgs.md */
export function parseArgs(argv) {
  const limitIndex = argv.indexOf('--max-in-progress')
  const maxInProgress = limitIndex === -1 ? 1 : Number(argv[limitIndex + 1])
  return { maxInProgress, json: argv.includes('--json') }
}

const describeHead = ({ next, waiting }) => {
  if (next) return `다음 이슈: #${next.number} ${next.title}`
  if (waiting) return `대기: ${waiting}`
  return '큐가 비었습니다: 처리할 `status:decided` 이슈가 없습니다'
}

const formatResult = ({ next, waiting, skipped }) => {
  const head = describeHead({ next, waiting })
  const rows = skipped.map(({ number, reason }) => `| #${number} | ${reason} |`)
  const table = rows.length > 0 ? ['', '| 건너뜀 | 이유 |', '| --- | --- |', ...rows] : []
  return [`## bab queue`, '', head, ...table, ''].join('\n')
}

const run = async (argv) => {
  const { maxInProgress, json } = parseArgs(argv)
  if (!Number.isInteger(maxInProgress) || maxInProgress < 1) {
    process.stderr.write(`--max-in-progress는 1 이상의 정수입니다.\n사용법: ${USAGE}\n`)
    return 2
  }
  const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
  const repository = process.env.GH_REPO || execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], { encoding: 'utf8' }).trim()
  if (!/^[a-z0-9][a-z0-9_.-]*\/[a-z0-9][a-z0-9_.-]*$/i.test(repository)) throw new Error('대상 저장소는 owner/repo 형식이어야 합니다')
  const milestones = inspectMilestones(repoRoot, repository)
  const decided = await listIssues('status:decided', repository)
  const inProgress = await listIssues('status:in-progress', repository)
  const result = pickNext({
    decided,
    inProgress,
    maxInProgress,
    milestones,
  })
  process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : formatResult(result))
  return result.next ? 0 : NOTHING_TO_PICK
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try { process.exitCode = await run(process.argv.slice(2)) }
  catch (error) {
    process.stderr.write(`큐 조회 오류: ${error.message}\n`)
    process.exitCode = 2
  }
}
