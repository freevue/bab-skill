import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fixture, report, root } from './helpers/drift-fixture.mjs'

const workflow = readFileSync(join(root, '.github/workflows/bab-guard.yml'), 'utf8')
const step = workflow.split('      - name: 형상 일치\n')[1].split('\n  issue:')[0]
const commands = step.split('        run: |\n')[1].split('\n').map((line) => line.replace(/^          /, '')).join('\n')

test('FT-drift-language-15: 실제 workflow 셸은 비어 있지 않은 JSON이어도 코드 2를 즉시 중단한다', (context) => {
  const sample = fixture(context)
  const json = JSON.stringify(report({ hasIndex: false, pageCount: 0, checkedPageCount: 0, status: 'no-target', checkedTargets: [] }))
  const shim = `node() {\ncase "$1" in\n*drift-check.mjs) printf '%s' '${json}'; return 2 ;;\n*) printf '비교기를 호출했습니다' >&2; return 0 ;;\nesac\n}\n`
  const result = spawnSync('/bin/bash', ['-e', '-c', `${shim}\n${commands}`], {
    encoding: 'utf8', cwd: sample.directory, env: { ...process.env, RUNNER_TEMP: sample.directory },
  })
  assert.equal(result.status, 2, result.stderr)
  assert.doesNotMatch(result.stderr, /비교기를 호출/)
})

test('FT-drift-language-16: 실제 workflow 셸은 미지원 head를 성공으로 바꾸지 않는다', (context) => {
  const sample = fixture(context)
  sample.add({ extension: 'rs', tag: 'rust', signature: 'pub fn sample(value: String) -> String', source: 'pub fn sample(value: String) -> String { value }' })
  mkdirSync(join(sample.directory, '.bab'))
  cpSync(join(root, 'plugins'), join(sample.directory, '.bab/plugins'), { recursive: true })
  symlinkSync(sample.directory, join(sample.directory, '.bab-base'))
  const result = spawnSync('/bin/bash', ['-e', '-c', commands], {
    encoding: 'utf8', cwd: sample.directory, env: { ...process.env, RUNNER_TEMP: sample.directory },
  })
  assert.equal(result.status, 4, result.stderr || result.stdout)
  assert.match(result.stdout, /미검증/)
})
