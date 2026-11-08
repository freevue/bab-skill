import assert from 'node:assert/strict'
import { test } from 'node:test'
import { acquire, release } from '../plugins/bab/skills/sync/scripts/claim.mjs'

const sha = (character) => character.repeat(40)

function remote() {
  let holder = null
  let sequence = 0
  const request = (args, body) => {
    if (args[1] !== 'graphql') {
      sequence += 1
      return { sha: sha(String(sequence)) }
    }
    if (body.query.startsWith('query')) {
      return { data: { repository: {
        id: 'repo-id',
        defaultBranchRef: { target: { oid: sha('a'), tree: { oid: sha('b') } } },
        ref: holder && { target: { oid: holder, message: '다른 작업' } },
      } } }
    }
    const update = body.variables.input.refUpdates[0]
    if (update.beforeOid !== (holder ?? sha('0'))) throw new Error('원격 ref가 바뀌었습니다')
    holder = update.afterOid === sha('0') ? null : update.afterOid
    return { data: { updateRefs: { clientMutationId: null } } }
  }
  return { request, holder: () => holder }
}

test('저장소 선점은 두 번째 작업을 막고 소유 SHA로만 해제한다', () => {
  const state = remote()
  const first = acquire('owner/repo', '#12', state.request)
  assert.equal(first.acquired, true)
  assert.equal(state.holder(), first.oid)
  assert.equal(acquire('owner/repo', '#13', state.request).acquired, false)
  assert.throws(() => release('owner/repo', sha('c'), state.request), /현재 선점 SHA가 달라/)
  assert.equal(release('owner/repo', first.oid, state.request).released, true)
  const second = acquire('owner/repo', '#13', state.request)
  assert.notEqual(second.oid, first.oid)
  assert.throws(() => release('owner/repo', first.oid, state.request), /현재 선점 SHA가 달라/)
  assert.equal(state.holder(), second.oid)
})

test('동시에 선점하면 원격 비교 후 하나만 성공한다', () => {
  const state = remote()
  const request = (args, body) => {
    if (args[1] !== 'graphql' && !state.holder()) {
      state.request(['api', 'graphql'], {
        query: 'mutation',
        variables: { input: { refUpdates: [{ beforeOid: sha('0'), afterOid: sha('9') }] } },
      })
    }
    return state.request(args, body)
  }
  const result = acquire('owner/repo', 'next', request)
  assert.equal(result.acquired, false)
  assert.equal(result.holder.oid, sha('9'))
})
