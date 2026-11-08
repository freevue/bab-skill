import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { buildBody, planActions } from '../plugins/bab/ci/drift/plan.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const target = 'wiki/unit/sample.md'
const previous = [{ target, kind: '시그니처 불일치', message: '이전 검사 결과' }]
const current = [{ target, kind: '코드에 없음', message: '새 검사 결과' }]
const issue = (body, ...labels) => ({ number: 7, body, labels: labels.map((name) => ({ name })) })

test('확정 이슈의 결정과 우선순위를 유지하고 검사 결과만 갱신한다', () => {
  const decided = issue(
    buildBody(target, previous)
      .replace('- [ ] wiki를 바꿈', '- [x] wiki를 바꿈')
      .replace('P2 (다음 주기)', 'P1 (이번 주기)'),
    'status:decided'
  )
  assert.equal(planActions(previous, [decided])[0].type, 'keep')
  const [action] = planActions(current, [decided])
  assert.equal(action.type, 'update')
  assert.match(action.body, /- \[x\] wiki를 바꿈/)
  assert.match(action.body, /P1 \(이번 주기\)/)
  assert.match(action.body, /새 검사 결과/)
  assert.doesNotMatch(action.body, /이전 검사 결과/)
  assert.equal(planActions(current, [{ ...decided, body: action.body }])[0].type, 'keep')
})

test('구버전 이슈를 처음 갱신해도 사람이 작성한 본문을 보존한다', () => {
  const body = [
    `<!-- bab-drift: ${target} -->`,
    '# 무엇을',
    '| 종류 | 내용 |',
    '| --- | --- |',
    '| 검사 | 사람이 보완한 설명 |',
    '# 어떻게',
    '- [x] 코드를 wiki에 맞춤',
  ].join('\n')
  const [action] = planActions(current, [issue(body, 'status:in-progress')])
  assert.ok(action.body.includes(body))
  assert.match(action.body, /새 검사 결과/)
  assert.equal(planActions(current, [issue(action.body, 'status:in-progress')])[0].type, 'keep')
})

test('자동 종료 작업이 후속 이슈 이벤트 없이 상태 라벨도 제거한다', (context) => {
  const fixture = mkdtempSync(join(root, '.bab-test-'))
  context.after(() => rmSync(fixture, { recursive: true, force: true }))
  const reportPath = join(fixture, 'report.json')
  const log = join(fixture, 'gh.log')
  writeFileSync(reportPath, JSON.stringify({ hasIndex: true, items: [] }))
  writeFileSync(
    join(fixture, 'gh'),
    [
      '#!/bin/sh',
      'printf "%s\\n" "$*" >> "$BAB_TEST_GH_LOG"',
      'if [ "$2" = list ]; then printf "%s\\n" "$BAB_TEST_OPEN_ISSUES"; fi',
    ].join('\n'),
    { mode: 0o700 }
  )
  const result = spawnSync(
    process.execPath,
    [join(root, 'plugins/bab/ci/drift-report.mjs'), reportPath],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: fixture,
        GITHUB_REPOSITORY: 'fixture/bab',
        GITHUB_STEP_SUMMARY: '',
        BAB_TEST_GH_LOG: log,
        BAB_TEST_OPEN_ISSUES: JSON.stringify([
          issue(buildBody(target, previous), 'status:proposed', 'P2', 'drift'),
        ]),
      },
    }
  )
  assert.equal(result.status, 0, result.stderr)
  const commands = readFileSync(log, 'utf8').trim().split('\n')
  assert.match(commands[1], /^issue close 7 .*--reason completed/)
  assert.match(commands[2] ?? '', /^issue edit 7 .*--remove-label status:proposed$/)
})

test('참고 문서만 남아도 해결된 참고 이슈를 닫고 명세 이슈는 보존한다', (context) => {
  const fixture = mkdtempSync(join(root, '.bab-test-'))
  context.after(() => rmSync(fixture, { recursive: true, force: true }))
  const reportPath = join(fixture, 'report.json')
  const log = join(fixture, 'gh.log')
  writeFileSync(reportPath, JSON.stringify({
    hasIndex: true, pageCount: 0, referenceCount: 1, status: 'no-target', items: [],
  }))
  writeFileSync(join(fixture, 'gh'), [
    '#!/bin/sh',
    'printf "%s\\n" "$*" >> "$BAB_TEST_GH_LOG"',
    'if [ "$2" = list ]; then printf "%s\\n" "$BAB_TEST_OPEN_ISSUES"; fi',
  ].join('\n'), { mode: 0o700 })
  const referenceTarget = 'wiki/reference/research.md'
  const openIssues = [
    issue(buildBody(referenceTarget, [{ target: referenceTarget, kind: 'wiki 구조', message: '출처 없음' }]), 'status:proposed', 'drift'),
    { ...issue(buildBody(target, previous), 'status:proposed', 'drift'), number: 8 },
  ]
  const result = spawnSync(process.execPath, [join(root, 'plugins/bab/ci/drift-report.mjs'), reportPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: fixture,
      GITHUB_REPOSITORY: 'fixture/bab',
      GITHUB_STEP_SUMMARY: '',
      BAB_TEST_GH_LOG: log,
      BAB_TEST_OPEN_ISSUES: JSON.stringify(openIssues),
    },
  })
  assert.equal(result.status, 0, result.stderr)
  const commands = readFileSync(log, 'utf8').trim().split('\n')
  assert.match(commands[1], /^issue close 7 .*--reason completed/)
  assert.ok(commands.every((command) => !/\b8\b/.test(command)))
})
