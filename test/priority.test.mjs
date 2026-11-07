import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parsePriority, planLabelChanges } from '../plugins/bab/ci/issue-sync.mjs'

const priorityCases = [
  { id: 'UT-parsePriority-01', inputs: ['# Priority\nP1 (이번 주기)'], expected: 'P1' },
  { id: 'UT-parsePriority-02', inputs: ['### 중요도\nP3'], expected: 'P3' },
  { id: 'UT-parsePriority-03', inputs: ['## pRiOrItY\nP2'], expected: 'P2' },
  { id: 'UT-parsePriority-04', inputs: ['#Priority\nP0'], expected: 'P0' },
  { id: 'UT-parsePriority-05', inputs: ['# Priority\nP3 P0'], expected: 'P3' },
  { id: 'UT-parsePriority-06', inputs: ['# Priority\n<!-- P0 --> P2'], expected: 'P2' },
  { id: 'UT-parsePriority-07', inputs: ['# Priority\n본문\n# What\nP2'], expected: undefined },
  { id: 'UT-parsePriority-08', inputs: ['# Priority\nP2\n# Priority\nP0'], expected: 'P2' },
  { id: 'UT-parsePriority-09', inputs: ['#### Priority\nP1'], expected: undefined },
  { id: 'UT-parsePriority-10', inputs: [' # Priority\nP1'], expected: undefined },
  { id: 'UT-parsePriority-11', inputs: ['# Priority\np1 P4 P2x XP0 _P3 P10'], expected: undefined },
  { id: 'UT-parsePriority-12', inputs: ['# Priority\n한P1글'], expected: 'P1' },
  { id: 'UT-parsePriority-13', inputs: ['', null, undefined], expected: undefined },
  { id: 'UT-parsePriority-14', inputs: ['# Priority\r\nP0\r\n# What\r\nP2'], expected: 'P0' },
  { id: 'UT-parsePriority-15', inputs: ['# Priority\n#### 메모\nP2'], expected: 'P2' },
  { id: 'UT-parsePriority-16', inputs: ['# Priority\n<!-- 미완료 P3'], expected: 'P3' },
  { id: 'UT-parsePriority-17', inputs: ['```md\n# Priority\nP2\n```'], expected: 'P2' },
  { id: 'UT-parsePriority-18', inputs: ['# Priority\n<!--\n# What\n-->\nP2'], expected: undefined },
  { id: 'UT-parsePriority-19', inputs: ['# Priority\nP<!-- 설명 -->1'], expected: 'P1' },
  { id: 'UT-parsePriority-20', inputs: ['# Priority\u00a0\nP0'], expected: 'P0' },
  { id: 'UT-parsePriority-21', inputs: ['# Priority\u0085\nP0'], expected: undefined },
  { id: 'UT-parsePriority-22', inputs: [1, false], error: TypeError },
  { id: 'UT-parsePriority-23', inputs: [
    '# Priority\n없음\n#Priority\nP0', '# Priority\n없음\n###중요도\nP0',
  ], expected: undefined },
]

for (const { id, inputs, expected, error } of priorityCases) {
  test(id, () => {
    for (const input of inputs) {
      if (error) assert.throws(() => parsePriority(input), error)
      else assert.equal(parsePriority(input), expected)
    }
  })
}

test('UT-planLabelChanges-01: 닫힌 이슈의 상태 라벨만 제거한다', () => {
  const labels = ['status:decided', 'P1', 'status:in-progress', 'drift']
  assert.deepEqual(planLabelChanges({ action: 'closed', labels }), {
    add: [], remove: ['status:decided', 'status:in-progress'],
  })
})

test('UT-planLabelChanges-02: 본문에 맞춰 중요도를 바꾼다', () => {
  assert.deepEqual(planLabelChanges({
    action: 'edited', body: '# Priority\nP1', labels: ['P2', 'drift'],
  }), { add: ['P1'], remove: ['P2'] })
})

test('UT-planLabelChanges-03: 입력 순서와 중복을 유지하며 입력을 바꾸지 않는다', () => {
  const labels = Object.freeze(['P1', 'P3', 'P3'])
  assert.deepEqual(planLabelChanges({ action: 'edited', body: '# Priority\nP1', labels }), {
    add: [], remove: ['P3', 'P3'],
  })
  assert.deepEqual(labels, ['P1', 'P3', 'P3'])
})

test('UT-planLabelChanges-04: 재오픈 상태 전이는 이 함수가 담당하지 않는다', () => {
  assert.deepEqual(planLabelChanges({ action: 'reopened', body: '', labels: ['P2'] }), {
    add: [], remove: [],
  })
})
