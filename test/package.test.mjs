import assert from 'node:assert/strict'
import { readFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

test('Claude Code와 Codex의 마켓플레이스는 같은 버전의 스킬 묶음을 사용한다', () => {
  const claudeMarket = readJson(join(root, '.claude-plugin/marketplace.json'))
  const codexMarket = readJson(join(root, '.agents/plugins/marketplace.json'))
  const claudePackage = claudeMarket.plugins.find(({ name }) => name === 'bab')
  const codexPackage = codexMarket.plugins.find(({ name }) => name === 'bab')
  assert.equal(claudeMarket.name, codexMarket.name)

  const claudeRoot = realpathSync(join(root, claudePackage.source))
  const codexRoot = realpathSync(join(root, codexPackage.source.path))
  assert.equal(claudeRoot, codexRoot)
  const claude = readJson(join(claudeRoot, '.claude-plugin/plugin.json'))
  const codex = readJson(join(codexRoot, 'plugin.json'))
  assert.deepEqual([claude.name, claude.version], [codex.name, codex.version])
})

test('CI와 안내가 저장소 회귀 테스트만 실행한다', () => {
  const paths = ['.github/workflows/test.yml', 'docs/guide.md', 'docs/guide.ko.md']
  const expected = 'node --test test/*.test.mjs'
  for (const path of paths) {
    const content = readFileSync(join(root, path), 'utf8')
    const commands = content.match(/node --test[^\r\n]*/g) ?? []
    assert.deepEqual(commands, [expected], path)
  }
})

test('플러그인 버전과 저장소·setup workflow의 버전 참조가 같다', () => {
  const plugin = readJson(join(root, 'plugins/bab/plugin.json'))
  const paths = ['.github/workflows/bab.yml', 'plugins/bab/skills/setup/assets/workflows/bab.yml']
  for (const path of paths) {
    const content = readFileSync(join(root, path), 'utf8')
    const workflowRefs = [...content.matchAll(/^[ \t]*uses:[ \t]*freevue\/bab-skill\/\.github\/workflows\/bab-guard\.yml@([^\s]+)[ \t]*$/gm)]
      .map((match) => match[1])
    const babRefs = [...content.matchAll(/^[ \t]*bab-ref:[ \t]*([^\s]+)[ \t]*$/gm)]
      .map((match) => match[1])
    assert.deepEqual(workflowRefs, [`v${plugin.version}`], path)
    assert.deepEqual(babRefs, [`v${plugin.version}`], path)
  }
})
