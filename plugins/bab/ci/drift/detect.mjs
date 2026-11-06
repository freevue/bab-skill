import { toList } from '../../skills/audit/scripts/frontmatter.mjs'
import { checkCompleteness } from './completeness.mjs'
import { checkFeatureComposition, checkUsageConsistency } from './relations.mjs'
import { extractDeclarations, readSignatureBlock } from './source.mjs'
import { extractTypeDeclarations, readDefinitionBlock } from './types.mjs'

const item = (target, kind, message) => ({ target, kind, message })

const SHAPES = {
  unit: {
    heading: '시그니처',
    readBlock: readSignatureBlock,
    extract: extractDeclarations,
    missing: '시그니처 없음',
    mismatch: '시그니처 불일치',
    pageLabel: '유닛',
  },
  type: {
    heading: '정의',
    readBlock: readDefinitionBlock,
    extract: extractTypeDeclarations,
    missing: '타입 정의 없음',
    mismatch: '타입 정의 불일치',
    pageLabel: '타입',
  },
}

const hasShape = (page) => Object.hasOwn(SHAPES, page.type)

/**
 * 유닛 · 타입 페이지 하나를 코드와 비교합니다. 선언 불일치와 코드에 없는 선언을 찾습니다.
 */
export const checkShape = (readSource) => (page) => {
  const shape = SHAPES[page.type]
  const { name } = page.frontmatter
  const code = toList(page.frontmatter.code)
  const target = `wiki/${page.name}`
  const block = shape.readBlock(page.text)
  const expected = block && shape.extract(block, { exportedOnly: false }).get(name)
  if (!expected) {
    return [
      item(target, shape.missing, `\`## ${shape.heading}\`에서 \`${name}\` 선언을 읽지 못했습니다`),
    ]
  }
  const sources = code.map((path) => ({ path, text: readSource(path) }))
  const missingFiles = sources.filter((source) => source.text === undefined)
  if (missingFiles.length > 0) {
    return missingFiles.map(({ path }) =>
      item(target, '코드에 없음', `\`${path}\` 파일이 없습니다`)
    )
  }
  const actual = sources
    .map((source) => shape.extract(source.text).get(name))
    .find((declaration) => declaration !== undefined)
  if (actual === undefined) {
    return [item(target, '코드에 없음', `\`${code.join(', ')}\`에 export \`${name}\`이 없습니다`)]
  }
  if (actual === expected) return []
  return [item(target, shape.mismatch, `wiki \`${expected}\` / 코드 \`${actual}\``)]
}

/**
 * 유닛 · 타입 페이지가 참조하는 코드 파일에서 페이지가 없는 export를 찾습니다. 기능 code 파일의 export는 기능 자체이므로 보지 않습니다.
 */
export function checkUndocumentedExports(pages, readSource) {
  const documented = (type) =>
    new Set(pages.filter((page) => page.type === type).map((page) => page.frontmatter.name))
  const shapePages = pages.filter(hasShape)
  const codeFiles = [...new Set(shapePages.flatMap((page) => toList(page.frontmatter.code)))]
  return Object.entries(SHAPES).flatMap(([type, shape]) => {
    const names = documented(type)
    return codeFiles.flatMap((path) => {
      const text = readSource(path)
      if (text === undefined) return []
      return [...shape.extract(text).keys()]
        .filter((name) => !names.has(name))
        .map((name) =>
          item(path, '페이지 없는 export', `\`${name}\`의 ${shape.pageLabel} 페이지가 없습니다`)
        )
    })
  })
}

/**
 * 모든 드리프트 검사를 실행해 항목 목록을 돌려줍니다.
 */
export function detectDrift({ pages, readSource, structureIssues }) {
  const structure = structureIssues.map(({ page, message }) =>
    item(`wiki/${page}`, 'wiki 구조', message)
  )
  const shapes = pages.filter(hasShape).flatMap(checkShape(readSource))
  return [
    ...structure,
    ...shapes,
    ...checkUndocumentedExports(pages, readSource),
    ...checkFeatureComposition(pages, readSource),
    ...checkUsageConsistency(pages),
    ...pages.flatMap(checkCompleteness),
  ]
}
