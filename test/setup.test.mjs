import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const setup = join(root, 'plugins/bab/skills/setup/scripts/setup.mjs')
const version = JSON.parse(readFileSync(join(root, 'plugins/bab/plugin.json'), 'utf8')).version
const run = (repo, ...args) =>
  spawnSync(process.execPath, [setup, repo, '--skip-labels', ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: '' },
  })

function createFixture(context) {
  const fixture = mkdtempSync(join(root, '.bab-test-'))
  context.after(() => rmSync(fixture, { recursive: true, force: true }))
  const repo = join(fixture, 'repo')
  mkdirSync(join(repo, '.git'), { recursive: true })
  return { fixture, repo }
}

test('Codex 셋업은 CLAUDE.md를 보존하고 AGENTS.md에 한 번만 추가한다', (context) => {
  const { repo } = createFixture(context)
  const claude = join(repo, 'CLAUDE.md')
  const agents = join(repo, 'AGENTS.md')
  writeFileSync(claude, 'Claude 지침\n')
  writeFileSync(agents, '공용 지침\n')

  const dry = run(repo, '--instructions', 'AGENTS.md', '--dry-run')
  assert.equal(dry.status, 0, dry.stderr)
  assert.match(dry.stdout, /AGENTS\.md \| 섹션 추가 예정/)
  assert.equal(readFileSync(agents, 'utf8'), '공용 지침\n')
  assert.equal(run(repo, '--instructions', 'AGENTS.md').status, 0)
  const installed = readFileSync(agents, 'utf8')
  assert.match(installed, /^공용 지침\n\n## bab \(SDD\/AIDD\)/)
  assert.ok(readdirSync(join(repo, 'wiki')).includes('reference'))
  assert.equal(run(repo, '--instructions', 'AGENTS.md').status, 0)
  assert.equal(readFileSync(agents, 'utf8'), installed)
  assert.equal(readFileSync(claude, 'utf8'), 'Claude 지침\n')
})

test('지침 파일을 생략한 기존 셋업은 CLAUDE.md에 설치한다', (context) => {
  const { repo } = createFixture(context)
  const result = run(repo)
  assert.equal(result.status, 0, result.stderr)
  assert.match(readFileSync(join(repo, 'CLAUDE.md'), 'utf8'), /^## bab \(SDD\/AIDD\)/)
})

test('기존 셋업에서 AGENTS.md만 있으면 같은 파일에 추가한다', (context) => {
  const { repo } = createFixture(context)
  const agents = join(repo, 'AGENTS.md')
  writeFileSync(agents, '공용 지침\n')
  const result = run(repo)
  assert.equal(result.status, 0, result.stderr)
  assert.match(readFileSync(agents, 'utf8'), /^공용 지침\n\n## bab \(SDD\/AIDD\)/)
  assert.ok(!readdirSync(repo).includes('CLAUDE.md'))
})

test('지침 파일 인자가 잘못되면 설치 전에 거부한다', (context) => {
  const { repo } = createFixture(context)
  for (const args of [['--instructions', '../AGENTS.md'], ['--instructions'], ['--typo']]) {
    const result = run(repo, ...args)
    assert.equal(result.status, 2, result.stderr)
    assert.deepEqual(readdirSync(repo), ['.git'])
  }
})

test('지침 파일 심볼릭 링크가 있으면 저장소 밖 파일과 설치 대상에 쓰지 않는다', (context) => {
  const { fixture, repo } = createFixture(context)
  const external = join(fixture, 'CLAUDE.md')
  writeFileSync(external, '공용 지침\n')
  symlinkSync(external, join(repo, 'CLAUDE.md'))

  const result = run(repo)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stdout, /CLAUDE\.md.*실패/)
  assert.equal(readFileSync(external, 'utf8'), '공용 지침\n')
  assert.deepEqual(readdirSync(repo).sort(), ['.git', 'CLAUDE.md'])
})

test('설치 대상의 상위 폴더도 심볼릭 링크를 따라가지 않는다', (context) => {
  const { fixture, repo } = createFixture(context)
  const external = join(fixture, 'external')
  mkdirSync(external)
  symlinkSync(external, join(repo, 'wiki'), 'dir')

  const result = run(repo, '--instructions', 'AGENTS.md')
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stdout, /wiki.*실패/)
  assert.deepEqual(readdirSync(external), [])
  assert.deepEqual(readdirSync(repo).sort(), ['.git', 'wiki'])
})

test('기존 지침과 CI 버전 차이를 표시하고 원본을 보존한다', (context) => {
  const { repo } = createFixture(context)
  const agents = join(repo, 'AGENTS.md')
  const workflow = join(repo, '.github/workflows/bab.yml')
  mkdirSync(join(repo, '.github/workflows'), { recursive: true })
  writeFileSync(agents, '## bab (SDD/AIDD)\n\n옛 지침\n')
  writeFileSync(workflow, 'uses: freevue/bab-skill/.github/workflows/bab-guard.yml@v0.7.8\nbab-ref: v0.7.8\n')
  const result = run(repo, '--instructions', 'AGENTS.md', '--dry-run')
  assert.equal(result.status, 0, result.stderr)
  assert.ok(result.stdout.includes(`bab 플러그인 | v${version}`))
  assert.match(result.stdout, /AGENTS\.md \| 차이 있음 \(유지\)/)
  assert.ok(result.stdout.includes(`CI 호출 버전 | 차이 있음 (유지): uses v0.7.8, bab-ref v0.7.8 → v${version}`))
  assert.equal(readFileSync(agents, 'utf8'), '## bab (SDD/AIDD)\n\n옛 지침\n')
  assert.match(readFileSync(workflow, 'utf8'), /@v0\.7\.8/)
})
