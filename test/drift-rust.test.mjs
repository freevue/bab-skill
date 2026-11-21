import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fixture } from './helpers/drift-fixture.mjs'

const rust = { extension: 'rs', tag: 'rust', signature: 'pub fn sample(value: String) -> String', source: 'pub fn sample(value: String) -> String { value }', parameters: [['value', 'String']], returnType: 'String' }
const body = (result) => JSON.parse(result.stdout)

for (const tag of ['rust', ' RS ', '']) {
  test(`FT-drift-language-19 UT-readRust-01 UT-syntaxFor-01: Rust 함수와 언어 별칭 ${tag}`, (context) => {
    const sample = fixture(context)
    sample.add({ ...rust, tag })
    const result = sample.check()
    assert.equal(result.status, 0, result.stdout || result.stderr)
    sample.write('src/sample.rs', 'pub fn sample(value: u64) -> String { value.to_string() }')
    const changed = sample.check()
    assert.equal(changed.status, 1)
    assert.ok(body(changed).items.some((item) => item.kind === '시그니처 불일치'))
  })
}

const shapes = [
  { signature: "pub async fn sample<'a, Value: Clone>(mut value: &'a Value) -> &'a Value where Value: Sync", parameters: [['value', "&'a Value"]], returnType: "&'a Value" },
  { signature: 'pub(crate) const unsafe extern "C" fn sample(value: u64) -> u64', parameters: [['value', 'u64']], returnType: 'u64' },
  { signature: 'pub fn sample<Value>(value: fn(Value, Value) -> Value) -> Option<Value>', parameters: [['value', 'fn(Value, Value) -> Value']], returnType: 'Option<Value>' },
  { signature: 'pub fn sample(value: &[u8; 32])', parameters: [['value', '&[u8; 32]']], returnType: '()' },
  { signature: 'pub fn sample()', parameters: [], returnType: '()' },
]
for (const shape of shapes) {
  test(`FT-drift-language-20: 제네릭·수명·한정자·반환 생략 ${shape.signature}`, (context) => {
    const sample = fixture(context)
    sample.add({ ...rust, ...shape, source: `${shape.signature} { unimplemented!() }` })
    const result = sample.check()
    assert.equal(result.status, 0, result.stdout || result.stderr)
  })
}

test('FT-drift-language-21 UT-tokenizeRust-01 UT-tokenizeRust-02: 주석·raw string·문자·내부 선언을 제외한다', (context) => {
  const sample = fixture(context)
  const source = `/* outer /* pub fn ghost() {} */ pub struct Fake {} */
const TEXT: &str = r###"pub fn ghost() {} /* \"#"###;
${rust.signature} {
  let marker = '\\''; let lifetime = "pub fn fake() {}";
  fn nested() {} value
}`
  sample.add({ ...rust, source })
  const result = sample.check()
  assert.equal(result.status, 0, result.stdout || result.stderr)
})

for (const declaration of ['pub struct Record { pub key: String, }', "pub struct Record<'a> { pub key: &'a str, }", 'pub struct Record;']) {
  test(`FT-drift-language-22: Rust 구조체와 필드 ${declaration}`, (context) => {
    const sample = fixture(context)
    sample.add({ name: 'Record', type: 'type', extension: 'rs', tag: 'rs', signature: declaration, source: declaration,
      fields: declaration.includes('{') ? [['key', declaration.includes("'a") ? "&'a str" : 'String']] : [] })
    const result = sample.check()
    assert.equal(result.status, 0, result.stdout || result.stderr)
    sample.write('src/Record.rs', declaration.replace('key:', 'other:').replace('Record;', 'Record { pub key: String }'))
    assert.equal(sample.check().status, 1)
  })
}

for (const [label, edits, kind] of [
  ['매개변수 표', { parameters: [['value', 'u64']] }, '매개변수 타입 불일치'],
  ['반환 표', { returnType: 'u64' }, '반환 타입 불일치'],
  ['실제 함수 없음', { source: 'pub fn other(value: String) -> String { value }' }, '코드에 없음'],
  ['공개 선언 페이지 없음', { source: `${rust.source} pub fn extra() {}` }, '페이지 없는 export'],
]) {
  test(`FT-drift-language-23: Rust ${label} 위반`, (context) => {
    const sample = fixture(context)
    sample.add({ ...rust, ...edits })
    const result = sample.check()
    assert.equal(result.status, 1, result.stdout)
    assert.ok(body(result).items.some((item) => item.kind === kind))
  })
}

for (const source of ['pub struct Tuple(pub String);', 'impl Record { pub fn sample() {} }', '#[cfg(test)] pub fn sample() {}',
  'pub fn sample((value, other): (String, String)) {}', 'pub enum Record { Value }', 'pub mod nested { pub fn sample() {} }',
  'macro_rules! sample { () => {} }', '/* unclosed', 'pub fn sample() {', `${rust.source} ${rust.source}`]) {
  test(`FT-drift-language-24 UT-readRust-02 UT-syntaxFor-02: 지원 밖 문법은 미검증 ${source}`, (context) => {
    const sample = fixture(context)
    sample.add({ ...rust, source })
    const result = sample.check()
    assert.equal(result.status, 4, result.stdout || result.stderr)
    assert.deepEqual(body(result).items, [])
    assert.ok(body(result).unverified.some((item) => item.reason === 'unsupported-syntax'))
    assert.equal(sample.compare(result, result).status, 4)
  })
}

test('FT-drift-language-25: 다른 페이지의 TypeScript와 Rust를 함께 검사한다', (context) => {
  const sample = fixture(context)
  sample.add({ name: 'normal' })
  sample.add(rust)
  assert.equal(sample.check().status, 0)
})

test('FT-drift-language-26: Rust 직접 호출의 기능 구성 누락을 검출한다', (context) => {
  const sample = fixture(context)
  sample.add(rust)
  const unit = readFileSync(join(sample.directory, 'wiki/unit/sample.md'), 'utf8')
  sample.write('wiki/unit/sample.md', unit.replace('## 사용처\n해당 없음', '## 사용처\n[기능](../feature/app.md)'))
  sample.write('src/app.rs', 'use crate::sample as call; fn app() { call(String::new()); }')
  const feature = '---\nname: app\ntype: feature\ncode: [src/app.rs]\n---\n## 구성 유닛\n[함수](../unit/sample.md)\n## 흐름\n1. 호출합니다.\n## 관련 정책\n해당 없음\n## TC\n| ID | 조건 |\n| --- | --- |\n| FT-app-01 | 호출 |'
  sample.write('wiki/feature/app.md', feature)
  sample.write('wiki/index.md', '## 유닛\n[함수](unit/sample.md)\n## 기능\n[기능](feature/app.md)')
  const initial = sample.check()
  assert.equal(initial.status, 0, initial.stdout || initial.stderr)
  sample.write('src/app.rs', 'fn app() {}')
  const result = sample.check()
  assert.equal(result.status, 1)
  assert.ok(body(result).items.some((item) => item.kind === '구성 유닛 미사용'))
})

test('FT-drift-language-27: 공백·주석·끝 쉼표를 정규화한다', (context) => {
  const sample = fixture(context)
  sample.add({ ...rust, source: 'pub fn sample( /* 입력 */ value : String, ) -> String { value }' })
  const result = sample.check()
  assert.equal(result.status, 0, result.stdout)
})

test('FT-drift-language-28: Rust 구조체 필드 표를 대조한다', (context) => {
  const sample = fixture(context)
  sample.add({ name: 'Record', type: 'type', extension: 'rs', tag: 'rust', signature: 'pub struct Record { pub key: String }', source: 'pub struct Record { pub key: String }', fields: [['key', 'u64']] })
  const result = sample.check()
  assert.equal(result.status, 1)
  assert.ok(body(result).items.some((item) => item.kind === '필드 타입 불일치'))
})

for (const source of ['fn app(sample: fn()) { sample(); }', 'fn app() { let call = sample; call(); }',
  'use crate::sample as call; fn app() { let call = || {}; call(); }', 'fn app() { (sample)(); }',
  'fn app() { value.sample(); }', 'fn app() { sample!(); }']) {
  test(`FT-drift-language-29: Rust 간접 호출·메서드·매크로는 미검증 ${source}`, (context) => {
    const sample = fixture(context)
    sample.write('src/app.rs', source)
    sample.write('wiki/feature/app.md', '---\nname: app\ntype: feature\ncode: [src/app.rs]\n---\n## 구성 유닛\n[스킬](../../src/app.rs)\n## 흐름\n1. 호출합니다.\n## 관련 정책\n해당 없음\n## TC\n| ID | 조건 |\n| --- | --- |\n| FT-app-01 | 호출 |')
    sample.write('wiki/index.md', '## 기능\n[기능](feature/app.md)')
    const result = sample.check()
    assert.equal(result.status, 4, result.stdout)
    assert.deepEqual(body(result).items, [])
  })
}

test('FT-drift-language-30: Rust 배열의 세미콜론과 쉼표를 구분한다', (context) => {
  const sample = fixture(context)
  sample.add({ ...rust, signature: 'pub fn sample(value: &[u8; 32])', source: 'pub fn sample(value: &[u8; 32]) {}', parameters: [['value', '&[u8, 32]']], returnType: '()' })
  const result = sample.check()
  assert.equal(result.status, 1, result.stdout)
  assert.ok(body(result).items.some((item) => item.kind === '매개변수 타입 불일치'))
})
