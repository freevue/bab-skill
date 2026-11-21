import assert from 'node:assert/strict'
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fixture, run } from './helpers/drift-fixture.mjs'

const rust = { extension: 'rs', tag: 'rust', signature: 'pub fn sample(value: String) -> String', source: 'pub fn sample(value: String) -> String { value }', parameters: [['value', 'String']], returnType: 'String' }

test('FT-drift-language-01 UT-inspectLanguage-01 UT-collectDrift-01: Rust 선언과 표를 실제 대조한다', (context) => {
  const sample = fixture(context)
  sample.add(rust)
  sample.add({ name: 'Record', type: 'type', extension: 'rs', tag: 'rust', signature: 'pub struct Record { pub key: String }', source: 'pub struct Record { pub key: String }' })
  const result = sample.check()
  assert.equal(result.status, 0, result.stderr || result.stdout)
  const body = JSON.parse(result.stdout)
  assert.deepEqual(body.items, [])
  assert.equal(body.status, 'pass')
  assert.equal(body.pageCount, 2)
  assert.equal(body.checkedPageCount, 2)
  assert.equal(body.unverifiedPageCount, 0)
  assert.deepEqual(body.unverified, [])
  assert.equal(sample.compare(result, result).status, 0)
})

for (const [extension, tag] of [['ts', ''], ['mts', ' TS '], ['cts', 'typescript'], ['tsx', 'TSX'], ['js', ''], ['mjs', 'JS'], ['cjs', 'javascript'], ['jsx', 'jsx']]) {
  test(`FT-drift-language-02: ${extension}와 언어 표기 ${JSON.stringify(tag)}`, (context) => {
    const sample = fixture(context)
    const signature = extension.includes('t') ? undefined : 'export function sample(value)'
    sample.add({ extension, tag, signature })
    const result = sample.check()
    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.equal(JSON.parse(result.stdout).checkedPageCount, 1)
  })
}

test('FT-drift-language-03 UT-inspectLanguage-02: 언어 표기 충돌을 실제 위반으로 보고한다', (context) => {
  const sample = fixture(context)
  sample.add({ ...rust, tag: 'typescript' })
  const result = sample.check()
  assert.equal(result.status, 1)
  const body = JSON.parse(result.stdout)
  assert.ok(body.items.some((entry) => entry.kind === '언어 표기 불일치'))
  assert.ok(body.unverified.some((entry) => entry.reason === 'language-conflict'))
  assert.ok(body.items.every((entry) => !/시그니처 없음|타입 정의 없음/.test(entry.kind)))
})

for (const options of [{ extension: 'data', tag: 'ts' }, { code: ['src/sample'], tag: 'ts' }, { tag: 'unknown' }]) {
  test(`FT-drift-language-04: 판정 불가와 미지원 ${JSON.stringify(options)}`, (context) => {
    const sample = fixture(context)
    sample.add(options)
    const result = sample.check()
    assert.equal(result.status, 4, result.stdout)
    assert.ok(JSON.parse(result.stdout).unverified.length > 0)
  })
}

test('FT-drift-language-05: 같은 페이지에서 지원 경로만 골라 통과시키지 않는다', (context) => {
  const sample = fixture(context)
  sample.add({ code: ['src/sample.ts', 'src/sample.rs'] })
  const result = sample.check()
  assert.equal(result.status, 4)
  assert.ok(JSON.parse(result.stdout).unverified.some((entry) => entry.reason === 'mixed-language'))
})

test('FT-drift-language-06 FT-drift-language-07 FT-drift-language-08 UT-makeReport-01 UT-makeReport-02: 실제 위반과 미검증의 우선순위', (context) => {
  const sample = fixture(context)
  sample.add({ name: 'normal' })
  const clean = sample.check()
  sample.add({ ...rust, source: `${rust.source} pub enum Extra { Value }` })
  const mixed = sample.check()
  assert.equal(mixed.status, 4)
  assert.equal(JSON.parse(mixed.stdout).checkedPageCount, 1)
  assert.equal(sample.compare(clean, mixed).status, 4)
  sample.write('src/normal.ts', 'export function normal(value: number): string { return String(value) }')
  const broken = sample.check()
  assert.equal(broken.status, 1)
  assert.equal(JSON.parse(broken.stdout).unverifiedPageCount, 1)
  assert.equal(sample.compare(clean, broken).status, 1)
  assert.equal(sample.compare(broken, broken).status, 4)
})

test('FT-drift-language-09 UT-detectDrift-02 UT-checkCompleteness-02: 미지원 파일과 문서 누락을 숨기지 않는다', (context) => {
  const sample = fixture(context)
  sample.add({ ...rust, source: null })
  let result = sample.check()
  assert.equal(result.status, 1)
  assert.ok(JSON.parse(result.stdout).items.some((entry) => entry.kind === '코드에 없음'))
  sample.write('src/sample.rs', rust.source)
  const path = join(sample.directory, 'wiki/unit/sample.md')
  sample.write('wiki/unit/sample.md', readFileSync(path, 'utf8').replace('1. 입력을 반환합니다.', '').replace('| UT-fixture-sample-01 | 입력 | 결과 |', ''))
  result = sample.check()
  assert.equal(result.status, 1)
  assert.ok(JSON.parse(result.stdout).items.some((entry) => entry.kind === '내부 로직 없음'))
  assert.ok(JSON.parse(result.stdout).items.some((entry) => entry.kind === 'TC 없음'))
})

test('FT-drift-language-10 UT-checkCompleteness-01: Rust 텍스트의 JS처럼 보이는 선언을 읽지 않는다', (context) => {
  const sample = fixture(context)
  sample.add({ ...rust, signature: 'export function sample(ghost: number): void', source: 'export function phantom() {}' })
  const result = sample.check()
  assert.equal(result.status, 4, result.stdout)
  assert.deepEqual(JSON.parse(result.stdout).items, [])
})

test('FT-drift-language-11 FT-drift-language-17 UT-collectDrift-02: 입력 오류와 대상 없음·전체 삭제를 구분한다', (context) => {
  assert.equal(run('drift-check.mjs', '--unknown').status, 2)
  assert.equal(run('drift-diff.mjs', '/없는파일', '/없는파일').status, 2)
  const sample = fixture(context)
  sample.add()
  const base = sample.check()
  rmSync(join(sample.directory, 'wiki'), { recursive: true })
  const head = sample.check()
  assert.equal(head.status, 3)
  assert.equal(sample.compare(base, head).status, 1)
  assert.equal(sample.compare(head, head).status, 0)
})
