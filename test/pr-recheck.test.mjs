import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { delimiter, dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const script = join(root, 'plugins/bab/ci/recheck-prs.mjs')
const repository = 'owner/repo'
const sha = (character) => character.repeat(40)
const pull = (number, body, head, state = 'open') => ({
  number, body, head: { sha: sha(head) }, state, labels: [],
})

function mockGitHub(context, pulls) {
  const fixture = mkdtempSync(join(root, '.bab-test-'))
  context.after(() => rmSync(fixture, { recursive: true, force: true }))
  const eventPath = join(fixture, 'event.json')
  const apiPath = join(fixture, 'api.json')
  const writes = join(fixture, 'writes.jsonl')
  writeFileSync(join(fixture, 'gh'), `#!/usr/bin/env node
const assert = require('node:assert/strict')
const fs = require('node:fs')
const args = process.argv.slice(2)
const { pulls, labels, state } = JSON.parse(fs.readFileSync(${JSON.stringify(apiPath)}))
if (args.includes('--paginate')) {
  assert.deepEqual(args, ['api', '--paginate', '--slurp', 'repos/owner/repo/pulls?state=open&per_page=100'])
  console.log(JSON.stringify([pulls.slice(0, 2), pulls.slice(2)]))
} else if (args[0] === 'issue') {
  assert.deepEqual(args, ['issue', 'view', '7', '-R', 'owner/repo', '--json', 'number,state,labels'])
  console.log(JSON.stringify({ number: 7, state, labels: labels.map((name) => ({ name })) }))
} else {
  assert.deepEqual(args.slice(0, 3), ['api', '--method', 'POST'])
  assert.match(args[3], /^repos\\/owner\\/repo\\/statuses\\/[a-f0-9]{40}$/)
  fs.appendFileSync(${JSON.stringify(writes)}, JSON.stringify([args[3].split('/').at(-1),
    args.find((arg) => arg.startsWith('state=')).slice(6),
    args.find((arg) => arg.startsWith('context=')).slice(8)]) + '\\n')
}
`, { mode: 0o755 })

  return (eventName, event, { state = 'OPEN', labels = [] } = {}) => {
    writeFileSync(eventPath, JSON.stringify(event))
    writeFileSync(apiPath, JSON.stringify({ pulls, labels, state }))
    writeFileSync(writes, '')
    const result = spawnSync(process.execPath, [script], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: [fixture, dirname(process.execPath)].join(delimiter),
        GITHUB_EVENT_NAME: eventName,
        GITHUB_EVENT_PATH: eventPath,
        GITHUB_REPOSITORY: repository,
        GITHUB_STEP_SUMMARY: '',
      },
    })
    assert.equal(result.status, 0, result.stderr)
    return readFileSync(writes, 'utf8').split('\n').filter(Boolean).map(JSON.parse)
  }
}

test('이슈 상태가 바뀌면 연결된 열린 PR의 같은 커밋에 실패와 복구를 다시 기록한다', (context) => {
  const refresh = mockGitHub(context, [
    pull(10, 'Closes #7', 'a'),
    pull(11, 'Closes #70\n<!-- Closes #7 -->', 'b'),
    pull(12, 'Refs #7', 'c'),
    pull(13, 'Fixes #7', 'd', 'closed'),
    pull(14, 'Resolves #7', 'e'),
  ])
  const issue = { number: 7, labels: [{ name: 'status:decided' }] }
  const expected = (gate) => [
    [sha('a'), gate, 'bab / issue gate'],
    [sha('c'), 'success', 'bab / issue gate'],
    [sha('e'), gate, 'bab / issue gate'],
  ]
  const label = { name: 'status:decided' }
  assert.deepEqual(refresh('issues', { action: 'unlabeled', issue, label }), expected('failure'))
  assert.deepEqual(
    refresh('issues', { action: 'labeled', issue, label }, { labels: ['status:decided'] }),
    expected('success')
  )
  assert.deepEqual(refresh('issues', { action: 'closed', issue }, { state: 'CLOSED' }), expected('failure'))
  assert.deepEqual(
    refresh('issues', { action: 'reopened', issue }, { labels: ['status:in-progress'] }),
    expected('success')
  )
  assert.deepEqual(refresh('issues', { action: 'labeled', issue, label: { name: 'P1' } }), [])
})

test('PR 이벤트와 이슈 재검사는 같은 검사 이름을 쓰고 공유 커밋의 실패를 덮어쓰지 않는다', (context) => {
  const related = pull(10, 'Closes #7', 'a')
  const sibling = pull(11, 'Refs #7', 'a')
  const refresh = mockGitHub(context, [related, sibling])
  const expected = [[sha('a'), 'failure', 'bab / issue gate']]
  assert.deepEqual(refresh('pull_request_target', { action: 'edited', pull_request: sibling }), expected)
  assert.deepEqual(refresh('issues', { action: 'closed', issue: { number: 7 } }), expected)

  const closed = { ...related, state: 'closed' }
  const refreshAfterClose = mockGitHub(context, [closed, sibling])
  assert.deepEqual(refreshAfterClose('pull_request_target', { action: 'closed', pull_request: closed }), [
    [sha('a'), 'success', 'bab / issue gate'],
  ])
})
