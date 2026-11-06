#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const PRIORITY_LABELS = ['P0', 'P1', 'P2', 'P3']
const STATUS_PREFIX = 'status:'
const PRIORITY_HEADING = /^#{1,3}\s*중요도\s*$/m
const NEXT_HEADING = /^#{1,3}\s/m

/**
 * 이슈 본문의 `중요도` 섹션(h1~h3)에서 P0~P3 값을 읽습니다. 안내용 HTML 주석은 무시합니다. 없으면 undefined입니다.
 */
export function parsePriority(body) {
  const section = (body ?? '').split(PRIORITY_HEADING)[1]
  if (!section) return undefined
  const content = section.split(NEXT_HEADING)[0].replace(/<!--[\s\S]*?-->/g, '')
  const match = content.match(/\b(P[0-3])\b/)
  return match ? match[1] : undefined
}

/**
 * 이슈 이벤트에 맞춰 붙일 라벨과 뗄 라벨을 계산합니다.
 */
export function planLabelChanges({ action, body, labels }) {
  if (action === 'closed') {
    return { add: [], remove: labels.filter((label) => label.startsWith(STATUS_PREFIX)) }
  }
  const priority = parsePriority(body)
  if (!priority) return { add: [], remove: [] }
  return {
    add: labels.includes(priority) ? [] : [priority],
    remove: labels.filter((label) => PRIORITY_LABELS.includes(label) && label !== priority),
  }
}

const editLabels = (repository, issueNumber, { add, remove }) => {
  const args = [
    'issue',
    'edit',
    String(issueNumber),
    '-R',
    repository,
    ...add.flatMap((label) => ['--add-label', label]),
    ...remove.flatMap((label) => ['--remove-label', label]),
  ]
  execFileSync('gh', args, { stdio: ['ignore', 'pipe', 'pipe'] })
}

const formatSummary = (issueNumber, { add, remove }) => {
  if (add.length + remove.length === 0) {
    return `## bab issue sync\n\n#${issueNumber}: 바꿀 라벨이 없습니다.\n`
  }
  const describe = (labels) => labels.join(', ') || '-'
  return [
    '## bab issue sync',
    '',
    '| 이슈 | 추가 | 제거 |',
    '| --- | --- | --- |',
    `| #${issueNumber} | ${describe(add)} | ${describe(remove)} |`,
    '',
  ].join('\n')
}

const writeSummary = (text) => {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text)
  process.stdout.write(text)
}

const run = () => {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
  if (!event.issue || event.issue.pull_request) {
    process.stdout.write('이슈 이벤트가 아니므로 건너뜁니다.\n')
    return 0
  }
  const changes = planLabelChanges({
    action: event.action,
    body: event.issue.body,
    labels: event.issue.labels.map((label) => label.name),
  })
  if (changes.add.length + changes.remove.length > 0) {
    editLabels(process.env.GITHUB_REPOSITORY, event.issue.number, changes)
  }
  writeSummary(formatSummary(event.issue.number, changes))
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) process.exitCode = run()
