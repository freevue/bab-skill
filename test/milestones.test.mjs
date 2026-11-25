import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { readMilestoneConfig } from '../plugins/bab/skills/milestone/scripts/read-config.mjs'
import { inspectMilestones } from '../plugins/bab/skills/milestone/scripts/read-milestones.mjs'

const fixture = (context, manifest) => {
  const root = mkdtempSync(join(tmpdir(), 'bab-milestones-'))
  context.after(() => rmSync(root, { recursive: true, force: true }))
  if (manifest !== undefined) {
    mkdirSync(join(root, '.bab'))
    writeFileSync(join(root, '.bab/milestones.json'), JSON.stringify(manifest))
  }
  return root
}
const config = (current = 2) => ({ version: 1, repository: 'example/app', current })
const remote = (changes = {}) => ({
  number: 2, title: '설정 화면 개편', description: '목표와 완료 기준', state: 'open',
  html_url: 'https://github.com/example/app/milestone/2', open_issues: 3, closed_issues: 1,
  ...changes,
})

test('UT-readMilestoneConfig-01 설정 누락은 비활성이며 원격을 호출하지 않는다', (context) => {
  const root = fixture(context)
  const never = () => assert.fail('원격 호출')
  assert.deepEqual(inspectMilestones(root, undefined, never), { enabled: false, current: null })
  mkdirSync(join(root, '.bab'))
  assert.deepEqual(readMilestoneConfig(root), { enabled: false, current: null })
})

test('UT-readMilestoneConfig-02~03 BOM과 추가 필드를 읽고 null을 활성 상태로 유지한다', (context) => {
  const root = fixture(context, config(null))
  writeFileSync(join(root, '.bab/milestones.json'), `\uFEFF${JSON.stringify({ ...config(null), note: '보존' })}`)
  const expected = { enabled: true, repository: 'example/app', current: null }
  assert.deepEqual(readMilestoneConfig(root), expected)
  assert.deepEqual(inspectMilestones(root, 'EXAMPLE/App', () => assert.fail('원격 호출')), expected)
})

test('UT-readMilestoneConfig-04 잘못된 설정을 비활성으로 우회하지 않는다', (context) => {
  const invalid = [null, [], {}, { ...config(), version: 2 }, { ...config(), repository: '../app' },
    { ...config(), current: 0 }, { ...config(), current: -1 }, { ...config(), current: '2' },
    { ...config(), current: 1.5 }, { ...config(), current: Number.MAX_SAFE_INTEGER + 1 }]
  for (const value of invalid) assert.throws(() => readMilestoneConfig(fixture(context, value)))
  const root = fixture(context, config())
  writeFileSync(join(root, '.bab/milestones.json'), '{')
  assert.throws(() => readMilestoneConfig(root))
})

test('UT-readMilestoneConfig-05 폴더와 파일 심볼릭 링크 및 디렉터리를 거부한다', (context) => {
  const outside = fixture(context, config())
  const root = fixture(context)
  symlinkSync(join(outside, '.bab'), join(root, '.bab'))
  assert.throws(() => readMilestoneConfig(root))
  const other = fixture(context)
  mkdirSync(join(other, '.bab'))
  symlinkSync(join(outside, '.bab/milestones.json'), join(other, '.bab/milestones.json'))
  assert.throws(() => readMilestoneConfig(other))
  const directory = fixture(context)
  mkdirSync(join(directory, '.bab/milestones.json'), { recursive: true })
  assert.throws(() => readMilestoneConfig(directory))
})

test('UT-inspectMilestones-02 지정한 목표 한 개만 읽고 종료 상태도 자료로 반환한다', (context) => {
  const root = fixture(context, config())
  const calls = []
  const scope = inspectMilestones(root, 'example/app', (endpoint) => {
    calls.push(endpoint)
    return remote({ description: null, state: 'closed', open_issues: 0, ignored: '제외' })
  })
  assert.deepEqual(calls, ['repos/example/app/milestones/2'])
  assert.deepEqual(scope, { enabled: true, repository: 'example/app', current: {
    number: 2, title: '설정 화면 개편', description: '', state: 'closed',
    url: 'https://github.com/example/app/milestone/2', openIssues: 0, closedIssues: 1,
  } })
})

test('UT-inspectMilestones-03 저장소 불일치와 조회 실패를 숨기지 않는다', (context) => {
  const root = fixture(context, config())
  for (const repository of [undefined, 'other/app', '../app']) {
    assert.throws(() => inspectMilestones(root, repository, () => assert.fail('원격 호출')))
  }
  assert.throws(() => inspectMilestones(root, 'example/app', () => { throw new Error('조회 실패') }), /조회 실패/)
})

test('UT-inspectMilestones-04 잘못된 원격 응답을 목표로 사용하지 않는다', (context) => {
  const root = fixture(context, config())
  const invalid = [null, remote({ number: 3 }), remote({ state: 'unknown' }), remote({ title: '' }),
    remote({ description: 2 }), remote({ html_url: 'javascript:alert(1)' }),
    remote({ open_issues: -1 }), remote({ closed_issues: 0.5 })]
  for (const value of invalid) assert.throws(() => inspectMilestones(root, 'example/app', () => value))
})
