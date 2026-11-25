import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const queue = fileURLToPath(new URL('../../plugins/bab/skills/sync/scripts/queue-next.mjs', import.meta.url))
export const reader = fileURLToPath(new URL('../../plugins/bab/skills/milestone/scripts/read-milestones.mjs', import.meta.url))
const fakeGh = fileURLToPath(new URL('./milestone-gh.mjs', import.meta.url))
export const issue = (number, milestone, priority = 'P1') => ({
  number, title: `작업 ${number}`, body: `# Wiki\nwiki/unit/page-${number}.md`,
  milestone: { number: milestone }, labels: [{ name: priority }],
})
export const fixture = (context, current, changes = {}) => {
  const root = mkdtempSync(join(tmpdir(), 'bab-milestone-cli-'))
  context.after(() => rmSync(root, { recursive: true, force: true }))
  execFileSync('git', ['init', '--quiet', root])
  mkdirSync(join(root, 'bin'))
  copyFileSync(fakeGh, join(root, 'bin/gh'))
  chmodSync(join(root, 'bin/gh'), 0o755)
  const data = {
    milestone: { number: 2, title: '설정 개편', description: '목표와 완료 기준', state: 'open',
      html_url: 'https://github.com/example/app/milestone/2', open_issues: 3, closed_issues: 0 },
    decided: [[issue(1, 3, 'P0')], [issue(2, 2, 'P2')]], inProgress: [[]], ...changes,
  }
  writeFileSync(join(root, 'data.json'), JSON.stringify(data))
  if (current !== undefined) {
    mkdirSync(join(root, '.bab'))
    writeFileSync(join(root, '.bab/milestones.json'), JSON.stringify({ version: 1, repository: 'example/app', current }))
  }
  const env = { ...process.env, GH_REPO: 'example/app', PATH: `${join(root, 'bin')}${delimiter}${process.env.PATH}`,
    BAB_MILESTONE_FIXTURE: join(root, 'data.json'), BAB_MILESTONE_CALLS: join(root, 'calls.jsonl') }
  const run = (script = queue, args = ['--json']) => spawnSync(process.execPath, [script, ...args], { cwd: root, env, encoding: 'utf8' })
  const calls = () => existsSync(env.BAB_MILESTONE_CALLS)
    ? readFileSync(env.BAB_MILESTONE_CALLS, 'utf8').trim().split('\n').map((line) => JSON.parse(line)) : []
  return { root, run, calls, env }
}
