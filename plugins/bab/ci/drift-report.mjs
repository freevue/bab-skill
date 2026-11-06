#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { CREATE_LIMIT, planActions } from './drift/plan.mjs'

const DRIFT_LABELS = ['status:proposed', 'P2', 'drift']

const gh = (args, input) =>
  execFileSync('gh', args, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] })

const RESOLVED_COMMENT = '드리프트 감시: 이 항목의 wiki와 코드가 다시 일치합니다.'

/**
 * 계산한 할 일을 gh로 실행하고, 이슈 번호를 채운 결과를 돌려줍니다.
 */
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
  const { hasIndex, items } = JSON.parse(readFileSync(reportPath, 'utf8'))
  if (!hasIndex) {
    const reason = items.length > 0 ? items[0].message : 'wiki 인덱스를 확인하지 못했습니다'
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
  const results = planActions(items, openIssues).map(applyAction(repository))
  writeSummary(formatSummary(results))
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href)
  process.exitCode = run(process.argv[2])
