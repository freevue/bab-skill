import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { diffProse } from '../plugins/bab/ci/prose-diff.mjs'

const script = fileURLToPath(new URL('../plugins/bab/ci/prose-diff.mjs', import.meta.url))
const longParagraph = Array.from({ length: 7 }, (_, index) => `${index + 1}번째 문장입니다.`).join(' ')

const fixture = (context) => {
  const root = mkdtempSync(join(tmpdir(), 'bab-prose-diff-'))
  context.after(() => rmSync(root, { recursive: true, force: true }))
  const baseRoot = join(root, 'base')
  const headRoot = join(root, 'head')
  mkdirSync(baseRoot)
  mkdirSync(headRoot)
  const put = (targetRoot, path, content) => {
    const target = join(targetRoot, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
    return target
  }
  return { root, baseRoot, headRoot, put }
}

test('UT-diffProse-01: 기준에 있던 긴 문단은 새 위반으로 보고하지 않는다', (context) => {
  const { baseRoot, headRoot, put } = fixture(context)
  put(baseRoot, 'wiki/policy/rules.md', longParagraph)
  put(headRoot, 'wiki/policy/rules.md', longParagraph)
  assert.deepEqual(diffProse(baseRoot, headRoot), { checkedFiles: 0, introduced: [] })
})

test('UT-diffProse-02: 줄만 이동한 위반은 제외하고 새 표현만 보고한다', (context) => {
  const { baseRoot, headRoot, put } = fixture(context)
  put(baseRoot, 'wiki/rules.md', longParagraph)
  put(headRoot, 'wiki/rules.md', `# 제목\n\n${longParagraph}`)
  put(headRoot, 'docs/guide.ko.md', '# 안내\n\n단순히 실행합니다.')
  assert.deepEqual(diffProse(baseRoot, headRoot), {
    checkedFiles: 2,
    introduced: [{ path: 'docs/guide.ko.md', number: 3, rule: '수식어', detail: '단순히' }],
  })
})

test('UT-diffProse-03: 같은 위반을 한 번 더 쓰면 한 건을 보고한다', (context) => {
  const { baseRoot, headRoot, put } = fixture(context)
  put(baseRoot, 'README.ko.md', '단순히 실행합니다.')
  put(headRoot, 'README.ko.md', '단순히 실행합니다.\n\n단순히 실행합니다.')
  assert.deepEqual(diffProse(baseRoot, headRoot).introduced, [
    { path: 'README.ko.md', number: 3, rule: '수식어', detail: '단순히' },
  ])
})

test('UT-diffProse-04: 코드·표·제목의 문단과 삭제·심볼릭 링크를 제외한다', (context) => {
  const { root, baseRoot, headRoot, put } = fixture(context)
  put(baseRoot, 'wiki/deleted.md', '단순히 실행합니다.')
  put(headRoot, 'wiki/new.md', [
    `# ${longParagraph}`, '| 항목 | 문장 |', '| --- | --- |', `| 값 | ${longParagraph} |`,
    '```text', '단순히 실행합니다.', '```',
  ].join('\n'))
  const outside = put(root, 'outside.md', '단순히 실행합니다.')
  symlinkSync(outside, join(headRoot, 'wiki/linked.md'))
  assert.deepEqual(diffProse(baseRoot, headRoot), { checkedFiles: 1, introduced: [] })
})

test('UT-diffProse-05: 잘못된 입력은 오류로 중단한다', (context) => {
  const { baseRoot, headRoot, put } = fixture(context)
  const file = put(headRoot, 'README.ko.md', '본문입니다.')
  assert.throws(() => diffProse(join(baseRoot, 'missing'), headRoot))
  assert.throws(() => diffProse(baseRoot, file))
})

test('UT-diffProse-06: 내용이 같은 문서는 대조 건수에서 뺀다', (context) => {
  const { baseRoot, headRoot, put } = fixture(context)
  put(baseRoot, 'wiki/old.md', longParagraph)
  put(headRoot, 'wiki/old.md', longParagraph)
  put(headRoot, 'wiki/new.md', '본문입니다.')
  assert.deepEqual(diffProse(baseRoot, headRoot), { checkedFiles: 1, introduced: [] })
})

test('FT-document-report-02/05: 새 위반은 요약에 적고 입력 오류만 실패한다', (context) => {
  const { root, baseRoot, headRoot, put } = fixture(context)
  put(headRoot, 'wiki/rules.md', '단순히 실행합니다.')
  const summaryPath = join(root, 'summary.md')
  const output = execFileSync(process.execPath, [script, baseRoot, headRoot], {
    encoding: 'utf8', env: { ...process.env, GITHUB_STEP_SUMMARY: summaryPath },
  })
  assert.match(output, /새 위반 1건/)
  assert.match(readFileSync(summaryPath, 'utf8'), /wiki\/rules\.md.*1.*수식어.*단순히/)
  const failure = spawnSync(process.execPath, [script, join(root, 'missing'), headRoot], { encoding: 'utf8' })
  assert.equal(failure.status, 2)
  assert.match(failure.stderr, /입력·실행 오류/)
})
