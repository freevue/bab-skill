import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fixture, report, root, run } from './helpers/drift-fixture.mjs'

const pending = { target: 'wiki/unit/rust.md', code: ['src/lib.rs'], reason: 'unsupported-syntax', message: '.rs / rust' }

test('FT-drift-language-12 UT-readReport-02: 이전 JSON과 잘못된 계약은 원격 호출 전에 거부한다', (context) => {
  const sample = fixture(context)
  const legacy = report()
  delete legacy.unverified
  const variants = [
    legacy, null, report({ checkedPageCount: -1 }), report({ unverifiedPageCount: 1 }),
    report({ status: 'incomplete' }), report({ checkedTargets: ['중복', '중복'] }),
    report({ unverified: [{ ...pending, reason: 'other' }] }),
  ]
  for (const variant of variants) {
    sample.write('invalid.json', JSON.stringify(variant))
    const path = join(sample.directory, 'invalid.json')
    for (const script of ['drift-diff.mjs', 'drift-report.mjs']) {
      const result = script === 'drift-diff.mjs' ? run(script, path, path) : run(script, path)
      assert.equal(result.status, 2, `${script}: ${result.stderr}`)
      assert.match(result.stderr, /다시 생성|재생성/)
    }
  }
})

test('FT-drift-language-13 FT-drift-language-14 UT-planActions-01 UT-planActions-02 UT-applyAction-01: 미검증·미확인 이슈를 보존하고 확인한 대상만 종료한다', (context) => {
  const sample = fixture(context)
  const log = join(sample.directory, 'gh.log')
  const body = (target) => `<!-- bab-drift: ${target} -->\n사람이 작성한 결정`
  const issues = ['wiki/unit/sample.md', pending.target, pending.code[0], 'wiki/unit/unknown.md'].map((target, index) => ({
    number: index + 1, body: body(target), labels: [{ name: 'status:proposed' }, { name: 'P2' }, { name: 'drift' }],
  }))
  sample.write('report.json', JSON.stringify(report({ pageCount: 2, unverifiedPageCount: 1, unverified: [pending], status: 'incomplete' })))
  writeFileSync(join(sample.directory, 'gh'), [
    '#!/bin/sh', 'printf "%s\\n" "$*" >> "$BAB_TEST_GH_LOG"',
    'if [ "$2" = list ]; then printf "%s\\n" "$BAB_TEST_OPEN_ISSUES"; fi',
  ].join('\n'), { mode: 0o700 })
  const result = spawnSync(process.execPath, [join(root, 'plugins/bab/ci/drift-report.mjs'), join(sample.directory, 'report.json')], {
    encoding: 'utf8', env: { ...process.env, PATH: sample.directory, GITHUB_REPOSITORY: 'fixture/bab',
      GITHUB_STEP_SUMMARY: '', BAB_TEST_GH_LOG: log, BAB_TEST_OPEN_ISSUES: JSON.stringify(issues) },
  })
  assert.equal(result.status, 4, result.stderr)
  const commands = readFileSync(log, 'utf8')
  assert.match(commands, /issue close 1 /)
  assert.match(commands, /issue edit 1 .*--remove-label status:proposed/)
  assert.doesNotMatch(commands, /issue (?:close|edit|comment) [234] /)
  assert.match(result.stdout, /미검증/)
})

test('FT-drift-language-13 UT-applyAction-02: 지원 밖 Rust 문법만 있어도 경고로 새 drift 이슈를 만들지 않는다', (context) => {
  const sample = fixture(context)
  const log = join(sample.directory, 'gh.log')
  sample.write('report.json', JSON.stringify(report({ checkedPageCount: 0, unverifiedPageCount: 1, unverified: [pending], status: 'incomplete', checkedTargets: ['wiki/index.md'] })))
  writeFileSync(join(sample.directory, 'gh'), '#!/bin/sh\nprintf "%s\\n" "$*" >> "$BAB_TEST_GH_LOG"\nprintf "[]"\n', { mode: 0o700 })
  const result = spawnSync(process.execPath, [join(root, 'plugins/bab/ci/drift-report.mjs'), join(sample.directory, 'report.json')], {
    encoding: 'utf8', env: { ...process.env, PATH: sample.directory, GITHUB_REPOSITORY: 'fixture/bab',
      GITHUB_STEP_SUMMARY: '', BAB_TEST_GH_LOG: log },
  })
  assert.equal(result.status, 4, result.stderr)
  assert.ok(existsSync(log))
  assert.doesNotMatch(readFileSync(log, 'utf8'), /issue (?:create|close|edit|comment)/)
})

test('FT-drift-language-08 UT-formatDiff-01: 코드 4에서도 실제 해소를 지어내지 않는다', (context) => {
  const sample = fixture(context)
  const item = { target: pending.target, kind: '시그니처 없음', message: '이전 검사기의 오진' }
  sample.write('base.json', JSON.stringify(report({ items: [item], status: 'fail' })))
  sample.write('head.json', JSON.stringify(report({ checkedPageCount: 0, unverifiedPageCount: 1, unverified: [pending], status: 'incomplete' })))
  const result = run('drift-diff.mjs', join(sample.directory, 'base.json'), join(sample.directory, 'head.json'))
  assert.equal(result.status, 4)
  assert.match(result.stdout, /미검증/)
  assert.doesNotMatch(result.stdout, /해소한 불일치/)
})
