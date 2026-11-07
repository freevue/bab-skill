import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))

const runEvent = (context, action, body, names) => {
  const fixture = mkdtempSync(join(root, '.bab-test-issue-sync-'))
  context.after(() => rmSync(fixture, { recursive: true, force: true }))
  const eventPath = join(fixture, 'event.json')
  const logPath = join(fixture, 'gh.log')
  writeFileSync(eventPath, JSON.stringify({
    action, issue: { number: 7, body, labels: names.map(name => ({ name })) },
  }))
  writeFileSync(join(fixture, 'gh'), [
    '#!/bin/sh',
    'printf "%s\\n" "$*" >> "$BAB_TEST_GH_LOG"',
  ].join('\n'), { mode: 0o700 })
  const result = spawnSync(process.execPath, [join(root, 'plugins/bab/ci/issue-sync.mjs')], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: fixture,
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_REPOSITORY: 'fixture/bab',
      GITHUB_STEP_SUMMARY: '',
      BAB_TEST_GH_LOG: logPath,
    },
  })
  assert.equal(result.status, 0, result.stderr)
  return existsSync(logPath) ? readFileSync(logPath, 'utf8').trim().split('\n') : []
}

test('FT-issue-label-sync-01: 변경된 중요도를 GitHub 명령에 전달한다', context => {
  assert.deepEqual(runEvent(context, 'edited', '# Priority\nP1', ['P2']), [
    'issue edit 7 -R fixture/bab --add-label P1 --remove-label P2',
  ])
})

test('FT-issue-label-sync-02: 닫힌 이슈의 상태 라벨만 제거한다', context => {
  assert.deepEqual(runEvent(context, 'closed', '# Priority\nP1', ['status:decided', 'P1']), [
    'issue edit 7 -R fixture/bab --remove-label status:decided',
  ])
})

test('FT-issue-label-sync-03: 중요도가 없으면 GitHub를 호출하지 않는다', context => {
  assert.deepEqual(runEvent(context, 'edited', '# What\n설명', ['P2']), [])
})
