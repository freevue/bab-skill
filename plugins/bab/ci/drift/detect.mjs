import { extractDeclarations, readSignatureBlock } from './source.mjs'

const item = (target, kind, message) => ({ target, kind, message })

/**
 * frontmatter에서 문자열 값과 `[a, b]` 형태의 배열 값을 읽습니다.
 */
export function readFrontmatter(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---/)
  if (!block) return {}
  const entries = block[1].split('\n').map((line) => line.match(/^(\w+):\s*(.*)$/))
  return Object.fromEntries(
    entries.filter(Boolean).map(([, key, raw]) => {
      const list = raw.match(/^\[(.*)\]$/)
      if (!list) return [key, raw.trim()]
      return [
        key,
        list[1]
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      ]
    })
  )
}

/**
 * 유닛 페이지 하나를 코드와 비교합니다. 시그니처 불일치와 코드에 없는 선언을 찾습니다.
 */
export const checkUnit = (readSource) => (page) => {
  const { name, code = [] } = page.frontmatter
  const target = `wiki/${page.name}`
  const block = readSignatureBlock(page.text)
  const expected = block && extractDeclarations(block, { exportedOnly: false }).get(name)
  if (!expected)
    return [item(target, '시그니처 없음', `\`## 시그니처\`에서 \`${name}\` 선언을 읽지 못했습니다`)]
  const sources = code.map((path) => ({ path, text: readSource(path) }))
  const missingFiles = sources.filter((source) => source.text === undefined)
  if (missingFiles.length > 0) {
    return missingFiles.map(({ path }) =>
      item(target, '코드에 없음', `\`${path}\` 파일이 없습니다`)
    )
  }
  const actual = sources
    .map((source) => extractDeclarations(source.text).get(name))
    .find((declaration) => declaration !== undefined)
  if (actual === undefined) {
    return [item(target, '코드에 없음', `\`${code.join(', ')}\`에 export \`${name}\`이 없습니다`)]
  }
  if (actual === expected) return []
  return [item(target, '시그니처 불일치', `wiki \`${expected}\` / 코드 \`${actual}\``)]
}

/**
 * wiki가 참조하는 코드 파일에서 유닛 페이지가 없는 export 함수를 찾습니다.
 */
export function checkUndocumentedExports(pages, readSource) {
  const documentedNames = new Set(
    pages.filter((page) => page.type === 'unit').map((page) => page.frontmatter.name)
  )
  const codeFiles = [...new Set(pages.flatMap((page) => page.frontmatter.code ?? []))]
  return codeFiles.flatMap((path) => {
    const text = readSource(path)
    if (text === undefined) return []
    return [...extractDeclarations(text).keys()]
      .filter((name) => !documentedNames.has(name))
      .map((name) => item(path, '페이지 없는 export', `\`${name}\`의 유닛 페이지가 없습니다`))
  })
}

/**
 * 모든 드리프트 검사를 실행해 항목 목록을 돌려줍니다.
 */
export function detectDrift({ pages, readSource, structureIssues }) {
  const structure = structureIssues.map(({ page, message }) =>
    item(`wiki/${page}`, 'wiki 구조', message)
  )
  const units = pages.filter((page) => page.type === 'unit').flatMap(checkUnit(readSource))
  return [...structure, ...units, ...checkUndocumentedExports(pages, readSource)]
}
