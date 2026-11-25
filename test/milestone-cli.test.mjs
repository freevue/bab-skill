import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fixture, issue, reader } from './helpers/milestone-fixture.mjs'

test('FT-milestones-02 CLI 비활성은 기존 전역 선택을 유지하고 마일스톤을 조회하지 않는다', (context) => {
  const { run, calls } = fixture(context)
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).next.number, 1)
  assert.equal(calls().some((args) => args.some((argument) => argument.includes('/milestones/'))), false)
})

test('FT-milestones-03 CLI는 전체 페이지의 현재 묶음 후보를 선택하고 PR을 제외한다', (context) => {
  const pull = { ...issue(1, 2, 'P0'), pull_request: { url: 'https://example.com/pull/1' } }
  const { run } = fixture(context, 2, { decided: [[pull, issue(2, 3, 'P0')], [issue(3, 2, 'P2')]] })
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).next.number, 3)
})

test('FT-milestones-05 CLI는 미지정·닫힘·열린 항목 없음에서 대기 코드 3을 반환한다', (context) => {
  const cases = [fixture(context, null), fixture(context, 2), fixture(context, 2)]
  const closed = JSON.parse(readFileSync(join(cases[1].root, 'data.json'), 'utf8'))
  const empty = JSON.parse(readFileSync(join(cases[2].root, 'data.json'), 'utf8'))
  writeFileSync(join(cases[1].root, 'data.json'), JSON.stringify({ ...closed, milestone: { ...closed.milestone, state: 'closed' } }))
  writeFileSync(join(cases[2].root, 'data.json'), JSON.stringify({ ...empty, milestone: { ...empty.milestone, open_issues: 0 } }))
  for (const { run } of cases) {
    const result = run()
    assert.equal(result.status, 3, result.stderr)
    assert.equal(JSON.parse(result.stdout).next, null)
    assert.ok(JSON.parse(result.stdout).waiting)
  }
})

test('FT-milestones-06 CLI는 다른 묶음에 작업이 있어도 현재 후보가 없으면 대기한다', (context) => {
  const { run } = fixture(context, 2, { decided: [[issue(1, 3, 'P0')]] })
  const result = run()
  assert.equal(result.status, 3, result.stderr)
  assert.match(JSON.parse(result.stdout).waiting, /현재 마일스톤/)
})

test('FT-milestones-07 잘못된 설정과 원격 실패는 코드 2이며 선택 JSON을 출력하지 않는다', (context) => {
  const invalid = fixture(context, 0)
  const remoteError = fixture(context, 2, { milestoneError: true })
  for (const { run } of [invalid, remoteError]) {
    const result = run()
    assert.equal(result.status, 2)
    assert.equal(result.stdout, '')
    assert.ok(result.stderr)
  }
  assert.equal(invalid.calls().length, 0)
})

test('UT-inspectMilestones-02 읽기 CLI는 현재 목표를 JSON으로 반환한다', (context) => {
  const { root, run, calls } = fixture(context, 2)
  const result = run(reader, [root])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).current.description, '목표와 완료 기준')
  assert.equal(calls().length, 1)
})
