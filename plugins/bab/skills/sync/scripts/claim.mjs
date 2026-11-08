#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const REF = 'refs/heads/bab-sync-claim'
const ZERO = '0'.repeat(40)
const QUERY = 'query($owner:String!,$name:String!){repository(owner:$owner,name:$name){id defaultBranchRef{target{oid ... on Commit{tree{oid}}}} ref(qualifiedName:"refs/heads/bab-sync-claim"){target{oid ... on Commit{message}}}}}'
const UPDATE = 'mutation($input:UpdateRefsInput!){updateRefs(input:$input){clientMutationId}}'

const gh = (args, input) => {
  const output = execFileSync('gh', args, {
    encoding: 'utf8',
    input: input && JSON.stringify(input),
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const result = JSON.parse(output)
  if (result.errors?.length) throw new Error(result.errors.map((error) => error.message).join('; '))
  return result
}

const repository = (repo, request = gh) => {
  const [owner, name, extra] = repo.split('/')
  if (!owner || !name || extra) throw new Error('GH_REPO는 OWNER/REPO 형식이어야 합니다')
  const result = request(['api', 'graphql', '--input', '-'], { query: QUERY, variables: { owner, name } })
  if (!result.data?.repository) throw new Error('저장소를 찾지 못했습니다')
  return result.data.repository
}

/** 저장소 전체에서 한 sync만 진행하도록 원격 ref를 선점합니다. */
export function acquire(repo, issue, request = gh) {
  const state = repository(repo, request)
  if (state.ref) return { acquired: false, holder: state.ref.target }
  const base = state.defaultBranchRef?.target
  if (!base?.oid || !base.tree?.oid) throw new Error('기본 브랜치의 커밋과 tree를 읽지 못했습니다')
  const message = `bab sync ${issue} ${new Date().toISOString()} ${randomUUID()}`
  const commit = request(['api', `repos/${repo}/git/commits`, '--input', '-'], {
    message, tree: base.tree.oid, parents: [base.oid],
  })
  try {
    request(['api', 'graphql', '--input', '-'], {
      query: UPDATE,
      variables: { input: {
        repositoryId: state.id,
        refUpdates: [{ name: REF, beforeOid: ZERO, afterOid: commit.sha }],
      } },
    })
  } catch (error) {
    const latest = repository(repo, request)
    if (latest.ref) return { acquired: false, holder: latest.ref.target }
    throw error
  }
  return { acquired: true, oid: commit.sha, message }
}

/** 획득한 SHA가 현재 잠금과 같을 때만 잠금을 해제합니다. */
export function release(repo, oid, request = gh) {
  if (!/^[a-f0-9]{40}$/.test(oid)) throw new Error('선점 SHA 40자리를 지정하세요')
  const state = repository(repo, request)
  if (state.ref?.target?.oid !== oid) throw new Error('현재 선점 SHA가 달라 해제하지 않았습니다')
  request(['api', 'graphql', '--input', '-'], {
    query: UPDATE,
    variables: { input: {
      repositoryId: state.id,
      refUpdates: [{ name: REF, beforeOid: oid, afterOid: ZERO }],
    } },
  })
  return { released: true, oid }
}

const run = (args) => {
  const repo = process.env.GH_REPO
  if (!repo) throw new Error('GH_REPO=OWNER/REPO를 지정하세요')
  const [action, value] = args
  if (action === 'status' && !value) return { status: repository(repo).ref?.target ?? null }
  if (action === 'acquire' && /^(next|#[1-9]\d*)$/.test(value ?? '')) return acquire(repo, value)
  if (action === 'release' && value) return release(repo, value)
  throw new Error('사용법: claim.mjs status | acquire next|#N | release <선점 SHA>')
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    const result = run(process.argv.slice(2))
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    if (result.acquired === false) process.exitCode = 3
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
