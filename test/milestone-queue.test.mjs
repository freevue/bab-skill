import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseArgs, pickNext, priorityRank, readWikiPaths } from '../plugins/bab/skills/sync/scripts/queue-next.mjs'

const issue = (number, milestone, priority = 'P1', page = `page-${number}`, extra = []) => ({
  number, title: `작업 ${number}`, milestone: milestone === null ? null : { number: milestone },
  body: `# Wiki\nwiki/unit/${page}.md`, labels: [priority, ...extra].map((name) => ({ name })),
})
const scope = (changes = {}) => ({ enabled: true, current: { number: 2, state: 'open', openIssues: 3, ...changes } })

test('UT-pickNext-01 비활성 큐는 기존 정렬을 유지하고 입력을 바꾸지 않는다', () => {
  const decided = [issue(4, 3, 'P0'), issue(3, 2, 'P2'), issue(2, null, 'P0')]
  const original = structuredClone(decided)
  assert.equal(pickNext({ decided, inProgress: [] }).next.number, 2)
  assert.deepEqual(decided, original)
})

test('UT-pickNext-02 현재 묶음의 P2를 다른 묶음과 미배정 P0보다 먼저 선택한다', () => {
  const decided = [issue(1, 3, 'P0'), issue(2, null, 'P0'), issue(3, 2, 'P2')]
  assert.equal(pickNext({ decided, inProgress: [], milestones: scope() }).next.number, 3)
})

test('UT-pickNext-03 다른 묶음의 진행 작업도 상한과 wiki 경로를 보호한다', () => {
  const decided = [issue(2, 2, 'P0', 'shared'), issue(3, 2, 'P1')]
  const active = issue(1, 3, 'P1', 'shared')
  assert.equal(pickNext({ decided, inProgress: [active], milestones: scope() }).next, null)
  const blocked = { ...active, labels: [...active.labels, { name: 'blocked' }] }
  const result = pickNext({ decided, inProgress: [blocked], milestones: scope() })
  assert.equal(result.next.number, 3)
  assert.equal(result.skipped[0].number, 2)
})

test('UT-pickNext-04 현재 없음·닫힘·열린 항목 없음은 다음 묶음을 고르지 않는다', () => {
  const decided = [issue(1, 3, 'P0')]
  for (const milestones of [{ enabled: true, current: null }, scope({ state: 'closed' }), scope({ openIssues: 0 })]) {
    const result = pickNext({ decided, inProgress: [], milestones })
    assert.equal(result.next, null)
    assert.ok(result.waiting)
  }
})

test('UT-pickNext-05 후보가 없거나 모두 차단되면 현재 묶음에서 대기한다', () => {
  for (const decided of [[issue(1, 3)], [issue(1, 2, 'P0', 'page', ['blocked'])]]) {
    const result = pickNext({ decided, inProgress: [], milestones: scope() })
    assert.equal(result.next, null)
    assert.match(result.waiting, /마일스톤/)
  }
})

test('UT-readWikiPaths-01~02 Wiki 섹션 경계와 옛 제목을 유지한다', () => {
  assert.deepEqual(readWikiPaths('# Wiki\n<!-- wiki/hidden.md -->\nwiki/one.md\n# Acceptance\nwiki/other.md'), ['wiki/one.md'])
  assert.deepEqual(readWikiPaths('### 관련 wiki\nwiki/old.md'), ['wiki/old.md'])
  assert.deepEqual(readWikiPaths(undefined), [])
})

test('UT-priorityRank-01 및 UT-parseArgs-01 기존 순위와 옵션을 유지한다', () => {
  assert.equal(priorityRank({ labels: [{ name: 'P3' }, { name: 'P1' }] }), 1)
  assert.equal(priorityRank({ labels: [] }), 4)
  assert.deepEqual(parseArgs([]), { maxInProgress: 1, json: false })
  assert.deepEqual(parseArgs(['--max-in-progress', '2', '--json']), { maxInProgress: 2, json: true })
  assert.ok(Number.isNaN(parseArgs(['--max-in-progress', 'invalid']).maxInProgress))
})
