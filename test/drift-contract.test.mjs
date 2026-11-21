import assert from 'node:assert/strict'
import { chmodSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { compareRows, findPlaceholders } from '../plugins/bab/ci/drift/completeness.mjs'
import { checkUndocumentedExports } from '../plugins/bab/ci/drift/detect.mjs'
import { buildBody } from '../plugins/bab/ci/drift/plan.mjs'
import { protectedTargets, readReport } from '../plugins/bab/ci/drift/report.mjs'
import { diffDrift, formatDiff } from '../plugins/bab/ci/drift-diff.mjs'
import { fixture, report } from './helpers/drift-fixture.mjs'

test('UT-protectedTargets-01 UT-protectedTargets-02: 중복 보호 대상과 빈 범위를 보존한다', () => {
  const entries = [{ target: 'wiki/unit/rust.md', code: ['src/lib.rs', 'src/lib.rs'] }]
  const original = structuredClone(entries)
  assert.deepEqual([...protectedTargets(entries)], ['wiki/unit/rust.md', 'src/lib.rs'])
  assert.deepEqual([...protectedTargets([])], [])
  assert.deepEqual(entries, original)
})

test('UT-readReport-01: 유효한 새 보고서를 소비한다', (context) => {
  const sample = fixture(context)
  const expected = report()
  sample.write('valid.json', JSON.stringify(expected))
  assert.deepEqual(readReport(join(sample.directory, 'valid.json')), expected)
})

test('UT-compareRows-01 UT-compareRows-02: 문서 표의 실제 누락·초과·타입 오류를 구분한다', () => {
  const entries = [{ name: 'value', type: 'string' }]
  assert.deepEqual(compareRows(entries, { rows: [['value', 'string', '입력']] }, { kind: '매개변수' }), [])
  const rows = [['other', 'string', '추가 입력']]
  assert.deepEqual(compareRows(entries, { rows }, { kind: '매개변수' }).map(([kind]) => kind), ['매개변수 누락', '매개변수 초과'])
  assert.deepEqual(compareRows(entries, { rows: [['value', 'number', '입력']] }, { kind: '매개변수' }).map(([kind]) => kind), ['매개변수 타입 불일치'])
})

test('UT-findPlaceholders-01 UT-findPlaceholders-02: 코드와 실제 자리표시를 구분한다', () => {
  assert.deepEqual(findPlaceholders('```js\nconst value = {}\n```\n`{예시}`'), [])
  assert.equal(findPlaceholders('본문에 {매개변수}가 남았습니다')[0][0], '자리표시 남음')
})

test('UT-checkUndocumentedExports-01 UT-checkUndocumentedExports-02: 문서화된 export와 누락을 구분한다', () => {
  const page = { type: 'unit', frontmatter: { name: 'sample', code: ['src/sample.ts'] } }
  const read = () => 'export function sample() {}\nexport function other() {}'
  const missing = checkUndocumentedExports([page], read)
  assert.equal(missing.length, 1)
  assert.match(missing[0].message, /other/)
  assert.deepEqual(checkUndocumentedExports([page, { ...page, frontmatter: { ...page.frontmatter, name: 'other' } }], read), [])
  assert.deepEqual(checkUndocumentedExports([page], read, []), [])
})

test('UT-diffDrift-01 UT-diffDrift-02: 실제 위반의 유지·추가·해소를 나눈다', () => {
  const before = { target: 'wiki/a.md', kind: '검사', message: '이전' }
  const after = { ...before, message: '이후' }
  assert.deepEqual(diffDrift([before], [before]), { introduced: [], resolved: [], unchanged: [before] })
  assert.deepEqual(diffDrift([before], [after]), { introduced: [after], resolved: [before], unchanged: [] })
})

test('UT-formatDiff-02: 검사 대상 없음을 전체 일치로 보고하지 않는다', () => {
  const summary = formatDiff({ introduced: [], resolved: [], unchanged: [], ...report({ pageCount: 0, checkedPageCount: 0, status: 'no-target' }) })
  assert.match(summary, /검사 대상 없음/)
  assert.doesNotMatch(summary, /불일치가 없습니다/)
})

test('UT-buildBody-01 UT-buildBody-02: 실제 대상과 wiki 연결을 기록한다', () => {
  assert.match(buildBody('wiki/unit/sample.md', []), /<!-- bab-drift: wiki\/unit\/sample.md -->/)
  assert.match(buildBody('src/sample.ts', []), /# Wiki\n\nwiki\/index.md/)
})

test('FT-drift-language-10: Rust 기능의 코드 사용 관계를 JS 문법으로 오인하지 않는다', (context) => {
  const sample = fixture(context)
  sample.add({ extension: 'rs', tag: 'rust', signature: 'pub fn sample(value: String) -> String', source: 'pub struct Record { pub key: String }' })
  const unitPath = join(sample.directory, 'wiki/unit/sample.md')
  sample.write('wiki/unit/sample.md', readFileSync(unitPath, 'utf8').replace('## 사용처\n해당 없음', '## 사용처\n[기능](../feature/app.md)'))
  sample.write('wiki/feature/app.md', [
    '---', 'name: app', 'type: feature', 'code: src/sample.rs', '---', '## 구성 유닛',
    '[sample](../unit/sample.md)', '## 흐름', '입력을 처리합니다.', '## 관련 정책', '해당 없음',
    '## TC', '| ID | 입력 | 기대 결과 |', '| --- | --- | --- |', '| FT-fixture-app-01 | 입력 | 결과 |',
  ].join('\n'))
  sample.write('wiki/index.md', '## 유닛\n[sample](unit/sample.md)\n## 기능\n[app](feature/app.md)')
  const result = sample.check()
  assert.equal(result.status, 4, result.stderr || result.stdout)
  assert.deepEqual(JSON.parse(result.stdout).items, [])
  assert.equal(JSON.parse(result.stdout).unverifiedPageCount, 2)
})

test('FT-drift-language-11: 실제 소스 읽기 오류를 파일 누락과 구분한다', { skip: process.getuid?.() === 0 }, (context) => {
  const sample = fixture(context)
  sample.add()
  const path = join(sample.directory, 'src/sample.ts')
  chmodSync(path, 0)
  try {
    const result = sample.check()
    assert.equal(result.status, 2)
    assert.match(result.stderr, /EACCES|permission/i)
  } finally {
    chmodSync(path, 0o600)
  }
})
