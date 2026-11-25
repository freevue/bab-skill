import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fixture, issue } from './helpers/milestone-fixture.mjs'

const largePages = () => {
  const entries = Array.from({ length: 150 }, (unused, index) => ({
    ...issue(index + 1, 3, 'P0'), body: `# Wiki\nwiki/unit/page-${index + 1}.md\n${'설명'.repeat(1500)}`,
    milestone: { number: 3, description: '목표'.repeat(800) },
  }))
  entries[0] = { ...entries[0], milestone: { number: 2 }, pull_request: { url: 'https://example.com/pull/1' } }
  entries[149] = { ...entries[149], milestone: { number: 2 }, labels: [{ name: 'P2' }] }
  assert.ok(Buffer.byteLength(entries.map(({ body }) => body).join('')) > 1024 * 1024)
  return [entries.slice(0, 100), entries.slice(100)]
}

for (const current of [undefined, 2]) {
  test(`FT-milestones-12 전체 응답 1 MiB 초과, ${current === 2 ? '활성' : '비활성'} CLI`, (context) => {
    const { run } = fixture(context, current, { decided: largePages() })
    const result = run()
    assert.equal(result.status, 0, result.stderr)
    assert.equal(JSON.parse(result.stdout).next.number, current === 2 ? 150 : 2)
  })
}

test('FT-milestones-12 단일 이슈 본문 1 MiB 초과도 누락 없이 선택한다', (context) => {
  const candidate = { ...issue(1, 2), body: `# Wiki\nwiki/unit/large.md\n${'설명'.repeat(200000)}` }
  const { run } = fixture(context, 2, { decided: [[candidate]] })
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).next.number, 1)
})

test('FT-milestones-13 큰 진행 응답에서도 다른 묶음의 전체 상한을 지킨다', (context) => {
  const active = { ...issue(900, 3), body: `# Wiki\nwiki/unit/busy.md\n${'진행'.repeat(200000)}` }
  const { run } = fixture(context, 2, { decided: largePages(), inProgress: [[active]] })
  const result = run()
  assert.equal(result.status, 3, result.stderr)
  assert.equal(JSON.parse(result.stdout).next, null)
  assert.match(JSON.parse(result.stdout).waiting, /진행 중/)
})

test('FT-milestones-13 다른 묶음의 blocked 진행 경로도 계속 보호한다', (context) => {
  const decided = largePages()
  decided[1].push(issue(151, 2, 'P3'))
  const blocked = { ...issue(900, 3), body: '# Wiki\nwiki/unit/page-150.md', labels: [{ name: 'blocked' }] }
  const { run } = fixture(context, 2, { decided, inProgress: [[blocked]] })
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).next.number, 151)
  assert.equal(JSON.parse(result.stdout).skipped[0].number, 150)
})

for (const changes of [
  { failure: { label: 'status:decided', page: 1 } },
  { failure: { label: 'status:in-progress', page: 1 } },
  { invalidJsonLabel: 'status:decided' },
]) {
  test(`FT-milestones-14 부분 응답 뒤 오류는 선택 JSON을 반환하지 않는다 ${JSON.stringify(changes)}`, (context) => {
    const { run } = fixture(context, 2, changes)
    const result = run()
    assert.equal(result.status, 2)
    assert.equal(result.stdout, '')
    assert.ok(result.stderr)
  })
}

test('UT-listIssues-01~03 UTF-8 청크·본문·마지막 줄과 필요한 필드를 보존한다', (context) => {
  const candidate = { ...issue(1, 2), body: '# Wiki\nwiki/unit/새싹.md\n본문\n다음 줄',
    milestone: { number: 2, description: '반복 설명' }, ignored: '버릴 필드' }
  const pull = { ...issue(2, 2), pull_request: { url: 'https://example.com/pull/2' } }
  const { root, env } = fixture(context, 2, { decided: [[candidate, pull]], chunkBytes: 7, finalNewline: false })
  const moduleUrl = new URL('../plugins/bab/skills/sync/scripts/list-issues.mjs', import.meta.url).href
  const source = `import assert from 'node:assert/strict';
    import { listIssues } from ${JSON.stringify(moduleUrl)};
    const result = await listIssues('status:decided', 'example/app');
    assert.deepEqual(result, ${JSON.stringify([{ number: 1, title: candidate.title, body: candidate.body,
      labels: candidate.labels, milestone: { number: 2 } }])});`
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: root, env, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
})

test('UT-listIssues-05 gh가 실행되지 않으면 예외로 끝난다', (context) => {
  const { root, env } = fixture(context)
  const moduleUrl = new URL('../plugins/bab/skills/sync/scripts/list-issues.mjs', import.meta.url).href
  const source = `import assert from 'node:assert/strict';
    import { listIssues } from ${JSON.stringify(moduleUrl)};
    await assert.rejects(listIssues('status:decided', 'example/app'), { code: 'ENOENT' });`
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source],
    { cwd: root, env: { ...env, PATH: root }, encoding: 'utf8', timeout: 5000 })
  assert.equal(result.status, 0, result.stderr)
})
