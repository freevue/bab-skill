import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const script = join(root, 'plugins/bab/skills/link/scripts/read-links.mjs')
export const revision = 'a'.repeat(40)

export const catalog = () => ({
  version: 1,
  repositories: [{
    repository: 'example/api', responsibility: '계정 API',
    contracts: [{ id: 'profile', summary: '닉네임 변경', path: 'wiki/feature/profile.md', section: '외부 계약' }],
  }],
})

export function linkFixture(context, manifest = catalog()) {
  const directory = mkdtempSync(join(root, '.bab-test-link-'))
  context.after(() => rmSync(directory, { recursive: true, force: true }))
  const repo = join(directory, 'app')
  const bin = join(directory, 'bin')
  const log = join(directory, 'calls.jsonl')
  const responses = join(directory, 'responses.json')
  mkdirSync(join(repo, '.bab'), { recursive: true })
  mkdirSync(bin)
  writeFileSync(join(repo, '.bab/links.json'), JSON.stringify(manifest))
  writeFileSync(responses, '{}')
  const executable = join(bin, 'gh')
  writeFileSync(executable, `#!${process.execPath}
const fs = require('node:fs')
const args = process.argv.slice(2)
fs.appendFileSync(process.env.BAB_LINK_LOG, JSON.stringify(args) + '\\n')
const responses = JSON.parse(fs.readFileSync(process.env.BAB_LINK_RESPONSES, 'utf8'))
if (args.length !== 2 || args[0] !== 'api' || !Object.hasOwn(responses, args[1])) process.exit(1)
process.stdout.write(JSON.stringify(responses[args[1]]))
`)
  chmodSync(executable, 0o755)
  const responseMap = {}
  return {
    repo, directory,
    provide(repository, path, text, metadata = {}) {
      responseMap[`repos/${repository}/commits/HEAD`] = { sha: revision }
      responseMap[`repos/${repository}/contents/${path}?ref=${revision}`] = {
        type: 'file', encoding: 'base64', content: Buffer.from(text).toString('base64'), ...metadata,
      }
      writeFileSync(responses, JSON.stringify(responseMap))
    },
    run(selector) {
      return spawnSync(process.execPath, [script, repo, ...(selector ? [selector] : [])], {
        encoding: 'utf8',
        env: { ...process.env, PATH: `${bin}:${dirname(process.execPath)}`, BAB_LINK_LOG: log, BAB_LINK_RESPONSES: responses },
      })
    },
    calls: () => {
      try { return readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line)) }
      catch (error) { if (error.code === 'ENOENT') return []; throw error }
    },
  }
}
