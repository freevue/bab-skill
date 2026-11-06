import assert from 'node:assert/strict'
import { test } from 'node:test'
import { guardPullRequest } from '../plugins/bab/ci/pr-guard.mjs'
import { pickNext } from '../plugins/bab/skills/sync/scripts/queue-next.mjs'

const labels = (...names) => names.map((name) => ({ name }))
const issue = (number, page, ...names) => ({
  number,
  title: `작업 ${number}`,
  body: `# Wiki\n\nwiki/unit/${page}.md`,
  labels: labels(...names),
})

test('차단된 작업이 상한을 차지하지 않되 겹치는 wiki는 계속 보호한다', () => {
  const first = issue(2, 'shared', 'status:decided', 'P0')
  const second = issue(3, 'other', 'status:decided', 'P1')
  const blocked = issue(1, 'shared', 'status:in-progress', 'blocked')
  const selected = pickNext({ decided: [first, second], inProgress: [blocked] })
  assert.equal(selected.next?.number, 3)
  assert.equal(selected.skipped[0]?.number, 2)

  const active = issue(4, 'active', 'status:in-progress')
  assert.equal(pickNext({ decided: [first, second], inProgress: [active, blocked] }).next, null)
})

test('HTML 주석과 코드 예시에만 적은 이슈 연결은 인정하지 않는다', () => {
  const body = [
    '<!-- 예시: Refs #999999 -->',
    '<!-- 예시:', 'Closes #99', '-->',
    '```md', 'Closes #42', '````',
    '~~~md', 'Closes #34', '~~~',
    '``Closes #23``',
  ].join('\n')
  const queried = []
  const violations = guardPullRequest({ labels: [], body }, (number) => queried.push(number))
  assert.deepEqual(queried, [])
  assert.deepEqual(violations.map(({ rule }) => rule), ['이슈 연결'])
})

test('일반 참조는 실제 이슈여야 하며 닫힌 이슈도 연결할 수 있다', () => {
  const loadIssue = (number) => {
    if (number === 99) throw new Error('이슈 없음')
    return { number, state: 'CLOSED', labels: [] }
  }
  assert.deepEqual(guardPullRequest({ labels: [], body: 'Refs #7' }, loadIssue), [])
  const violations = guardPullRequest({ labels: [], body: 'Refs #7, Refs #99' }, loadIssue)
  assert.deepEqual(violations.map(({ rule }) => rule), ['이슈 연결'])
  assert.match(violations[0].message, /#99/)
})

test('종료 참조에는 확정 상태를 요구하고 no-spec은 이슈 없는 PR을 허용한다', () => {
  const loadIssue = (number) => ({ number, state: 'OPEN', labels: labels('status:proposed') })
  assert.deepEqual(
    guardPullRequest({ labels: [], body: 'Closes #7' }, loadIssue).map(({ rule }) => rule),
    ['확정 게이트']
  )
  assert.deepEqual(guardPullRequest({ labels: labels('no-spec'), body: '' }, loadIssue), [])
})
