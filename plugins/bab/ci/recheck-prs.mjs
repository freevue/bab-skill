#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { formatSummary, guardPullRequest, parseIssueRefs, viewIssue } from './pr-guard.mjs'

const CHECK_CONTEXT = 'bab / issue gate'
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' })

function selectPulls(eventName, event) {
  if (eventName === 'schedule' || eventName === 'workflow_dispatch') return () => true
  if (eventName === 'pull_request_target' && event.pull_request) {
    const pull = event.pull_request
    return ({ number, head }) =>
      number === pull.number || head.sha === pull.head.sha || head.sha === event.before
  }
  if (eventName !== 'issues' || !event.issue || event.issue.pull_request) return
  const statusLabelChanged = ['labeled', 'unlabeled'].includes(event.action) &&
    event.label?.name?.startsWith('status:')
  if (!statusLabelChanged && !['closed', 'reopened'].includes(event.action)) return
  return ({ body }) => {
    const { closing, references } = parseIssueRefs(body)
    return closing.includes(event.issue.number) || references.includes(event.issue.number)
  }
}

function listOpenPulls(repository) {
  return JSON.parse(gh('api', '--paginate', '--slurp', `repos/${repository}/pulls?state=open&per_page=100`))
    .flat()
    .filter(({ state }) => state === 'open')
}

function publish(repository, sha, passed) {
  const { GITHUB_SERVER_URL, GITHUB_RUN_ID } = process.env
  const details = GITHUB_SERVER_URL && GITHUB_RUN_ID
    ? ['-f', `target_url=${GITHUB_SERVER_URL}/${repository}/actions/runs/${GITHUB_RUN_ID}`]
    : []
  gh('api', '--method', 'POST', `repos/${repository}/statuses/${sha}`,
    '-f', `context=${CHECK_CONTEXT}`,
    '-f', `state=${passed ? 'success' : 'failure'}`,
    '-f', `description=${passed ? '이슈 연결과 확정 상태를 확인했습니다.' : '이슈 연결 또는 확정 상태를 확인하세요.'}`,
    ...details)
}

function run() {
  const { GITHUB_EVENT_PATH, GITHUB_EVENT_NAME, GITHUB_REPOSITORY, GITHUB_STEP_SUMMARY } = process.env
  const event = JSON.parse(readFileSync(GITHUB_EVENT_PATH, 'utf8'))
  const select = selectPulls(GITHUB_EVENT_NAME, event)
  if (!select) return

  const pulls = listOpenPulls(GITHUB_REPOSITORY)
  const heads = new Set(pulls.filter(select).map(({ head }) => head.sha))
  const fetchIssue = viewIssue(GITHUB_REPOSITORY)
  const issues = new Map()
  const loadIssue = (number) => {
    if (!issues.has(number)) issues.set(number, fetchIssue(number))
    return issues.get(number)
  }
  let summary = heads.size === 0 ? '다시 검사할 열린 PR이 없습니다.\n' : ''
  // 상태는 커밋 단위입니다. 같은 커밋의 다른 열린 PR이 실패하면 통과로 덮어쓰지 않습니다.
  for (const sha of heads) {
    const checks = pulls.filter(({ head }) => head.sha === sha).map((pull) => ({
      number: pull.number,
      violations: guardPullRequest(pull, loadIssue),
    }))
    summary += checks.map(({ number, violations }) => `# PR #${number}\n\n${formatSummary(violations)}`).join('\n')
    try {
      publish(GITHUB_REPOSITORY, sha, checks.every(({ violations }) => violations.length === 0))
    } catch (error) {
      process.stderr.write(`커밋 ${sha}의 검사 상태를 기록할 수 없습니다: ${error.message}\n`)
      process.exitCode = 1
    }
  }
  if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, summary)
  process.stdout.write(summary)
}

run()
