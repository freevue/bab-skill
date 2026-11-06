import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { sourceReader } from '../plugins/bab/ci/drift-check.mjs'
import { extractUsedNames } from '../plugins/bab/ci/drift/relations.mjs'
import { extractDeclarations } from '../plugins/bab/ci/drift/source.mjs'
import { extractTypeDeclarations } from '../plugins/bab/ci/drift/types.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const ci = join(root, 'plugins/bab/ci')
const run = (script, ...args) =>
  spawnSync(process.execPath, [join(ci, script), ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: '', GITHUB_STEP_SUMMARY: '' },
  })

function createFixture(context) {
  const fixture = mkdtempSync(join(root, '.bab-test-'))
  context.after(() => rmSync(fixture, { recursive: true, force: true }))
  const repo = join(fixture, 'repo')
  mkdirSync(join(repo, '.git'), { recursive: true })
  return { fixture, repo }
}

const unitPage = [
  '---',
  'name: sample',
  'type: unit',
  'code: src/sample.ts',
  '---',
  '## 시그니처',
  '```ts',
  'export function sample(value: string): string',
  '```',
  '| 매개변수 | 타입 | 의미 |',
  '| --- | --- | --- |',
  '| value | string | 입력 |',
  '',
  '| 반환 | 의미 |',
  '| --- | --- |',
  '| string | 결과 |',
  '## 내부 로직',
  '1. 입력을 반환합니다.',
  '## 사용법',
  '```ts',
  'sample("값")',
  '```',
  '## 사용처',
  '해당 없음',
  '## TC',
  '| ID | 입력 | 기대 결과 |',
  '| --- | --- | --- |',
  '| UT-sample-01 | 값 | 값 |',
].join('\n')

function writeWiki(repo, code) {
  mkdirSync(join(repo, 'wiki', 'unit'), { recursive: true })
  mkdirSync(join(repo, 'src'), { recursive: true })
  writeFileSync(join(repo, 'wiki', 'index.md'), '[표본](unit/sample.md)\n')
  writeFileSync(join(repo, 'wiki', 'unit', 'sample.md'), unitPage)
  writeFileSync(join(repo, 'src', 'sample.ts'), code)
}

test('인덱스만 삭제해도 구조 위반을 보고하고 감시가 이슈를 건드리지 않는다', (context) => {
  const { fixture, repo } = createFixture(context)
  writeWiki(repo, 'export function sample(value: string): string { return value }')
  rmSync(join(repo, 'wiki', 'index.md'))

  const report = run('drift-check.mjs', repo, '--json')
  assert.equal(report.status, 1, report.stderr)
  assert.ok(JSON.parse(report.stdout).items.some(({ target }) => target === 'wiki/index.md'))
  const reportPath = join(fixture, 'report.json')
  writeFileSync(reportPath, report.stdout)
  const sync = run('drift-report.mjs', reportPath)
  assert.equal(sync.status, 1, sync.stderr)
  assert.match(sync.stdout, /이슈 동기화를 건너뜁니다/)
  assert.doesNotMatch(sync.stderr, /ENOENT/)
})

test('wiki 전체 삭제는 PR을 실패시키며 기존 불일치의 해소로 보지 않는다', (context) => {
  const { fixture, repo } = createFixture(context)
  writeWiki(repo, 'export function sample(value: number): string { return String(value) }')
  const base = run('drift-check.mjs', repo, '--json')
  assert.equal(base.status, 1, base.stderr)
  assert.deepEqual(JSON.parse(base.stdout).items.map(({ kind }) => kind), ['시그니처 불일치'])
  rmSync(join(repo, 'wiki'), { recursive: true })
  const head = run('drift-check.mjs', repo, '--json')
  assert.equal(head.status, 0, head.stderr)

  const basePath = join(fixture, 'base.json')
  const headPath = join(fixture, 'head.json')
  writeFileSync(basePath, base.stdout)
  writeFileSync(headPath, head.stdout)
  const diff = run('drift-diff.mjs', basePath, headPath)
  assert.equal(diff.status, 1, diff.stderr)
  assert.match(diff.stdout, /wiki\/index\.md/)
  assert.doesNotMatch(diff.stdout, /해소한 불일치/)

  assert.equal(run('drift-diff.mjs', headPath, headPath).status, 0)
  const sync = run('drift-report.mjs', headPath)
  assert.equal(sync.status, 0, sync.stderr)
  assert.match(sync.stdout, /이슈 동기화를 건너뜁니다/)
})

test('소스는 루트 안의 일반 파일만 읽는다', (context) => {
  const { fixture, repo } = createFixture(context)
  const external = join(fixture, 'external.ts')
  writeFileSync(external, '검사 루트 외부 파일')
  writeFileSync(join(repo, 'sample.ts'), '검사 루트 내부 파일')
  symlinkSync(external, join(repo, 'link.ts'))
  const read = sourceReader(repo)
  assert.equal(read('sample.ts'), '검사 루트 내부 파일')
  assert.deepEqual(
    ['../external.ts', external, 'link.ts', '.git'].map(read),
    [undefined, undefined, undefined, undefined]
  )
})

test('wiki 인덱스가 심볼릭 링크이면 사용하지 않는다', (context) => {
  const { fixture, repo } = createFixture(context)
  mkdirSync(join(repo, 'wiki'))
  const external = join(fixture, 'external.md')
  writeFileSync(external, '# 외부 인덱스')
  symlinkSync(external, join(repo, 'wiki', 'index.md'))
  const report = run('drift-check.mjs', repo, '--json')
  assert.equal(report.status, 1, report.stderr)
  assert.ok(JSON.parse(report.stdout).items.some(({ target }) => target === 'wiki/index.md'))
})

test('인덱스가 가리키는 wiki 페이지를 링크로 바꾸면 위반을 보고한다', (context) => {
  const { fixture, repo } = createFixture(context)
  writeWiki(repo, 'export function sample(value: string): string { return value }')
  const page = join(repo, 'wiki', 'unit', 'sample.md')
  const external = join(fixture, 'external.md')
  writeFileSync(external, unitPage)
  rmSync(page)
  symlinkSync(external, page)
  const report = run('drift-check.mjs', repo, '--json')
  assert.equal(report.status, 1, report.stderr)
  const [item] = JSON.parse(report.stdout).items
  assert.equal(item.target, 'wiki/unit/sample.md')
  assert.match(item.message, /심볼릭 링크/)
})

test('주석에만 있는 선언은 실제 구현으로 인정하지 않는다', (context) => {
  const { repo } = createFixture(context)
  writeWiki(repo, '// export function sample(value: string): string { return value }')
  const report = run('drift-check.mjs', repo, '--json')
  assert.equal(report.status, 1, report.stderr)
  assert.deepEqual(JSON.parse(report.stdout).items.map(({ kind }) => kind), ['코드에 없음'])
})

test('문자열에만 있는 함수 선언은 형상 검사를 통과하지 못한다', (context) => {
  const { repo } = createFixture(context)
  writeWiki(repo, 'const example = "export function sample(value: string): string {"')
  const report = run('drift-check.mjs', repo, '--json')
  assert.equal(report.status, 1, report.stderr)
  assert.deepEqual(JSON.parse(report.stdout).items.map(({ kind }) => kind), ['코드에 없음'])
})

test('인용 문자열과 중첩 템플릿 속 함수·타입 선언은 무시하고 실제 선언은 읽는다', () => {
  const source = [
    `const example = 'export type Sample = number; export function connect() {}'`,
    'const template = `첫 줄 ${`중첩: export type Nested = number`}',
    'export interface Ghost {}',
    'export function phantom() {}`',
    'const fence = /`/',
    'export function connect(value = "=> ]"): "{" { return "{" }',
    'export type Sample = "[;" | "}"',
  ].join('\n')
  for (const exportedOnly of [true, false]) {
    assert.deepEqual([...extractDeclarations(source, { exportedOnly })], [
      ['connect', 'function connect(value="=>]"):"{"'],
    ])
    assert.deepEqual([...extractTypeDeclarations(source, { exportedOnly })], [
      ['Sample', 'type Sample="[,"|"}"'],
    ])
  }
})

test('프로토타입 속성 이름을 wiki 분류로 쓰면 구조 위반을 반환한다', (context) => {
  const { repo } = createFixture(context)
  writeWiki(repo, 'export function sample(value: string): string { return value }')
  writeFileSync(join(repo, 'wiki', 'unit', 'sample.md'), unitPage.replace('type: unit', 'type: constructor'))
  const report = run('drift-check.mjs', repo, '--json')
  assert.equal(report.status, 1, report.stderr)
  assert.deepEqual(JSON.parse(report.stdout).items.map(({ kind }) => kind), ['wiki 구조'])
})

test('블록 주석은 제외하고 실제 선언의 문자열과 사용 이름은 유지한다', () => {
  const source = [
    '/* export type Ghost = string; export function ghost() {} */',
    'export const connect = (url = "https://example.test") => url',
    'export type Endpoint = "https://example.test"',
    '// ghost()',
    'connect()',
  ].join('\n')
  assert.deepEqual([...extractDeclarations(source)], [
    ['connect', 'const connect=(url="https://example.test")'],
  ])
  assert.deepEqual([...extractTypeDeclarations(source)], [
    ['Endpoint', 'type Endpoint="https://example.test"'],
  ])
  assert.deepEqual([...extractUsedNames(source)], ['connect'])
})
