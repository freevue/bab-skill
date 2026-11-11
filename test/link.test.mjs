import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { catalog, linkFixture, revision } from '../test-support/link-fixture.mjs'

test('UT-inspectLinks-01: 로컬 정본은 원격 호출 없이 계약 목록만 반환한다', (context) => {
  const fixture = linkFixture(context)
  const result = fixture.run()
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).repositories, catalog().repositories)
  assert.deepEqual(fixture.calls(), [])
})

test('UT-inspectLinks-02: 정본 참조는 커밋으로 고정한 목록만 읽는다', (context) => {
  const fixture = linkFixture(context, { version: 1, source: 'example/config' })
  fixture.provide('example/config', '.bab/links.json', JSON.stringify(catalog()))
  const result = fixture.run()
  assert.equal(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout)
  assert.deepEqual(output.repositories, catalog().repositories)
  assert.equal(output.source.ref, revision)
  assert.deepEqual(fixture.calls(), [
    ['api', 'repos/example/config/commits/HEAD'],
    ['api', `repos/example/config/contents/.bab/links.json?ref=${revision}`],
  ])
})

test('UT-inspectLinks-03: 선택한 계약 섹션과 출처만 반환한다', (context) => {
  const fixture = linkFixture(context)
  const document = '# 프로필\r\n\r\n## 내부 구현\r\nprivate-before\r\n\r\n## 외부 계약\r\nPATCH /profile\r\n\r\n~~~text\r\n## 가짜 경계\r\n~~~\r\n\r\n### 오류\r\n409: 중복 닉네임\r\n\r\n## 다음 작업\r\nprivate-after\r\n'
  fixture.provide('example/api', 'wiki/feature/profile.md', document)
  const result = fixture.run('example/api:profile')
  assert.equal(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout)
  assert.equal(output.repository, 'example/api')
  assert.equal(output.contract, 'profile')
  assert.equal(output.ref, revision)
  assert.equal(output.path, 'wiki/feature/profile.md')
  assert.match(output.body, /PATCH \/profile/)
  assert.match(output.body, /409: 중복 닉네임/)
  assert.match(output.body, /## 가짜 경계/)
  assert.doesNotMatch(result.stdout, /private-before|private-after/)
  assert.equal(fixture.calls().length, 2)
})

test('UT-inspectLinks-04: 잘못된 연결 규약과 미등록 선택은 원격 읽기 전에 거부한다', (context) => {
  const invalid = [
    { version: 2, repositories: catalog().repositories },
    { version: 1, repositories: [] },
    { version: 1, repositories: catalog().repositories, source: 'example/config' },
    { version: 1, source: '../config' },
    { version: 1, source: ['example/config'] },
    { version: 1, repositories: [...catalog().repositories, { ...catalog().repositories[0], repository: 'EXAMPLE/API' }] },
  ]
  for (const path of ['../secret.md', 'wiki/../secret.md', '/wiki/feature.md', 'wiki/a%2fb.md', 'wiki/a.md?raw=1', 'wiki\\a.md', 'wiki//a.md']) {
    const manifest = catalog()
    manifest.repositories[0].contracts[0].path = path
    invalid.push(manifest)
  }
  const duplicate = catalog()
  duplicate.repositories[0].contracts.push({ ...duplicate.repositories[0].contracts[0] })
  invalid.push(duplicate)
  const missingId = catalog()
  delete missingId.repositories[0].contracts[0].id
  invalid.push(missingId)
  for (const manifest of invalid) {
    const fixture = linkFixture(context, manifest)
    const original = readFileSync(join(fixture.repo, '.bab/links.json'), 'utf8')
    const result = fixture.run()
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.deepEqual(fixture.calls(), [])
    assert.equal(readFileSync(join(fixture.repo, '.bab/links.json'), 'utf8'), original)
  }
  for (const selector of ['example/api:missing', 'example/other:profile', 'bad-selector', 'example/api:profile:extra']) {
    const fixture = linkFixture(context)
    const result = fixture.run(selector)
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.deepEqual(fixture.calls(), [])
  }
})

test('UT-inspectLinks-05: 정본 참조의 재귀 연결을 따라가지 않는다', (context) => {
  const fixture = linkFixture(context, { version: 1, source: 'example/config' })
  fixture.provide('example/config', '.bab/links.json', JSON.stringify({ version: 1, source: 'example/next' }))
  const result = fixture.run()
  assert.equal(result.status, 1)
  assert.equal(result.stdout, '')
  assert.equal(fixture.calls().length, 2)
})

test('UT-inspectLinks-06: 누락·중복·빈 섹션에서 전체 문서를 반환하지 않는다', (context) => {
  for (const document of [
    '# 문서\n## 내부 구현\nprivate\n',
    '## 외부 계약\nfirst\n## 외부 계약\nsecond\n',
    '## 외부 계약\n\n## 다음\nprivate\n',
    '```markdown\n## 외부 계약\nfake\n```\n',
  ]) {
    const fixture = linkFixture(context)
    fixture.provide('example/api', 'wiki/feature/profile.md', document)
    const result = fixture.run('example/api:profile')
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
  }
})

test('UT-inspectLinks-07: 연결 파일과 상위 폴더의 심볼릭 링크를 거부한다', (context) => {
  for (const target of ['file', 'directory']) {
    const fixture = linkFixture(context)
    const external = join(fixture.directory, 'external')
    mkdirSync(external)
    const externalFile = join(external, 'links.json')
    writeFileSync(externalFile, JSON.stringify(catalog()))
    if (target === 'file') {
      rmSync(join(fixture.repo, '.bab/links.json'))
      symlinkSync(externalFile, join(fixture.repo, '.bab/links.json'))
    } else {
      rmSync(join(fixture.repo, '.bab'), { recursive: true })
      symlinkSync(external, join(fixture.repo, '.bab'))
    }
    const result = fixture.run()
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.deepEqual(fixture.calls(), [])
    assert.deepEqual(JSON.parse(readFileSync(externalFile, 'utf8')), catalog())
  }
})

test('UT-inspectLinks-08: 원격 실패와 일반 파일이 아닌 응답을 오류로 보고한다', (context) => {
  const failed = linkFixture(context)
  assert.equal(failed.run('example/api:profile').status, 1)
  for (const metadata of [{ type: 'dir' }, { encoding: 'none' }, { type: 'symlink' }]) {
    const fixture = linkFixture(context)
    fixture.provide('example/api', 'wiki/feature/profile.md', '## 외부 계약\nbody', metadata)
    const result = fixture.run('example/api:profile')
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
  }
})
