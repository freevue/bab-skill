import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = fileURLToPath(new URL('../../', import.meta.url))

export const run = (script, ...args) => spawnSync(process.execPath, [join(root, 'plugins/bab/ci', script), ...args], {
  encoding: 'utf8', env: { ...process.env, PATH: '', GITHUB_STEP_SUMMARY: '' },
})

export function fixture(context) {
  const directory = mkdtempSync(join(root, '.bab-test-'))
  context.after(() => rmSync(directory, { recursive: true, force: true }))
  mkdirSync(join(directory, '.git'))
  const write = (path, text) => {
    mkdirSync(dirname(join(directory, path)), { recursive: true })
    writeFileSync(join(directory, path), text)
  }
  const pages = []
  const add = ({ name = 'sample', extension = 'ts', tag = 'ts', source, signature, code, type = 'unit' } = {}) => {
    const paths = code ?? [`src/${name}.${extension}`]
    const declaration = signature ?? `export function ${name}(value: string): string`
    const heading = type === 'type' ? '정의' : '시그니처'
    const content = [
      '---', `name: ${name}`, `type: ${type}`, `code: [${paths.join(', ')}]`, '---',
      `## ${heading}`, `\x60\x60\x60${tag}`, declaration, '\x60\x60\x60',
      '| 매개변수 | 타입 | 의미 |', '| --- | --- | --- |', '| value | string | 입력 |',
      '| 반환 | 의미 |', '| --- | --- |', '| string | 결과 |',
      '## 필드', '| 필드 | 타입 | 의미 |', '| --- | --- | --- |', '| key | String | 키 |',
      '## 내부 로직', '1. 입력을 반환합니다.', '## 사용법', '\x60\x60\x60', `${name}()`, '\x60\x60\x60',
      '## 사용처', '해당 없음', '## TC', '| ID | 입력 | 기대 결과 |', '| --- | --- | --- |',
      `| UT-fixture-${name}-01 | 입력 | 결과 |`,
    ].join('\n')
    write(`wiki/${type}/${name}.md`, content)
    if (source !== null) {
      for (const path of paths) write(path, source ?? `${declaration} { return value }`)
    }
    pages.push({ name, type })
    const groups = ['unit', 'type'].map((kind) => `## ${kind === 'unit' ? '유닛' : '타입'}\n${pages.filter((page) => page.type === kind).map((page) => `[${page.name}](${kind}/${page.name}.md)`).join('\n')}`)
    write('wiki/index.md', groups.join('\n\n'))
  }
  const check = () => run('drift-check.mjs', directory, '--json')
  const compare = (base, head) => {
    write('base.json', base.stdout)
    write('head.json', head.stdout)
    return run('drift-diff.mjs', join(directory, 'base.json'), join(directory, 'head.json'))
  }
  return { directory, write, add, check, compare }
}

export const report = (overrides = {}) => ({
  hasIndex: true, pageCount: 1, referenceCount: 0, checkedPageCount: 1,
  unverifiedPageCount: 0, status: 'pass', items: [], unverified: [],
  checkedTargets: ['wiki/unit/sample.md', 'src/sample.ts'], ...overrides,
})
