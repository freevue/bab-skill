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
