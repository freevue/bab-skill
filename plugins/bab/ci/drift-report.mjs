#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { CREATE_LIMIT, planActions } from './drift/plan.mjs'
import { protectedTargets, readReport } from './drift/report.mjs'

const USAGE = 'node drift-report.mjs <report.json>'
const DRIFT_LABELS = ['status:proposed', 'P2', 'drift']

const gh = (args, input) =>
  execFileSync('gh', args, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] })

const RESOLVED_COMMENT = '드리프트 감시: 이 항목의 wiki와 코드가 다시 일치합니다.'

/** 이슈 동기화 계획을 적용하는 함수를 반환합니다. @see wiki/unit/drift/applyAction.md */
export const applyAction = (repository) => (action) => {
  const repo = ['-R', repository]
  if (action.type === 'create') {
    const labels = DRIFT_LABELS.flatMap((label) => ['--label', label])
    const url = gh(
      [
        'issue',
        'create',
        ...repo,
        '--title',
        `[드리프트]: ${action.target}`,
        ...labels,
        '--body-file',
        '-',
      ],
      action.body
    )
    return { ...action, number: Number(url.trim().split('/').pop()) }
  }
  if (action.type === 'update')
    gh(['issue', 'edit', String(action.number), ...repo, '--body-file', '-'], action.body)
  if (action.type === 'close') {
    gh([
      'issue',
      'close',
      String(action.number),
      ...repo,
      '--reason',
      'completed',
      '--comment',
      RESOLVED_COMMENT,
    ])
    const remove = action.statusLabels.flatMap((label) => ['--remove-label', label])
    gh(['issue', 'edit', String(action.number), ...repo, ...remove])
  }
  if (action.type === 'mark') {
    gh(['issue', 'edit', String(action.number), ...repo, '--body-file', '-'], action.body)
    gh(['issue', 'comment', String(action.number), ...repo, '--body', RESOLVED_COMMENT])
  }
  return action
}

const ACTION_NAMES = {
  create: '생성',
  update: '갱신',
  keep: '변경 없음',
  close: '해소 · 종료',
  mark: '해소 표시',
  skip: `건너뜀 (한 번에 ${CREATE_LIMIT}개 제한)`,
}

const formatSummary = (results) => {
  if (results.length === 0) return '## bab drift report\n\n드리프트 이슈가 없습니다.\n'
  const rows = results.map(
    ({ type, target, number }) =>
      `| \`${target}\` | ${number ? `#${number}` : '-'} | ${ACTION_NAMES[type]} |`
  )
  return [
    '## bab drift report',
    '',
    '| 대상 | 이슈 | 처리 |',
    '| --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
}

const writeSummary = (summary) => {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
  process.stdout.write(summary)
}

const run = (reportPath) => {
  const report = readReport(reportPath)
  const { hasIndex, items, pageCount, referenceCount, status, unverified, checkedTargets } = report
  if (!hasIndex || (status === 'no-target' && !referenceCount)) {
    const reason = status === 'no-target' ? '검사 대상 명세 페이지가 없습니다' : items[0]?.message ?? 'wiki 인덱스를 확인하지 못했습니다'
    writeSummary(`## bab drift report\n\n${reason}. 이슈 동기화를 건너뜁니다.\n`)
    return items.length > 0 ? 1 : 0
  }
  const repository = process.env.GITHUB_REPOSITORY
  const listArgs = [
    'issue',
    'list',
    '-R',
    repository,
    '--label',
    'drift',
    '--state',
    'open',
    '--limit',
    '200',
    '--json',
    'number,body,labels',
  ]
  const openIssues = JSON.parse(gh(listArgs))
  const relevantIssues = pageCount === 0
    ? openIssues.filter(({ body }) => /<!-- bab-drift: wiki\/reference\/[^>]+ -->/.test(body ?? ''))
    : openIssues
  const scope = { checkedTargets, protectedTargets: [...protectedTargets(unverified)] }
  const results = planActions(items, relevantIssues, scope).map(applyAction(repository))
  const pending = unverified.length > 0 ? `\n미검증 ${report.unverifiedPageCount}페이지와 검사 근거 없는 기존 이슈는 보존했습니다. 전체 형상 검증은 미완료입니다.\n` : ''
  writeSummary(`${formatSummary(results)}${pending}`)
  return unverified.length > 0 ? 4 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    if (process.argv.length !== 3) throw new Error(USAGE)
    process.exitCode = run(process.argv[2])
  } catch (error) {
    process.stderr.write(`이슈 동기화 입력·실행 오류: ${error.message}\n`)
    process.exitCode = 2
  }
}
