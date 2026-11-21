import { toList } from '../../skills/audit/scripts/frontmatter.mjs'
import { checkCompleteness } from './completeness.mjs'
import { checkFeatureComposition, checkUsageConsistency } from './relations.mjs'
import { extractDeclarations, readSignatureBlock } from './source.mjs'
import { extractTypeDeclarations, readDefinitionBlock } from './types.mjs'
import { inspectLanguage } from './language.mjs'
import { protectedTargets } from './report.mjs'

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

/** 지원 언어의 명세와 코드 선언을 대조하는 함수를 반환합니다. @see wiki/unit/drift/checkShape.md */
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

/** 지원 코드에서 문서 없는 export를 찾습니다. @see wiki/unit/drift/checkUndocumentedExports.md */
export function checkUndocumentedExports(pages, readSource, codePages = pages) {
  const documented = (type) =>
    new Set(pages.filter((page) => page.type === type).map((page) => page.frontmatter.name))
  const shapePages = codePages.filter(hasShape)
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

/** 언어·파일·문서·코드를 검사하고 실제 근거를 모읍니다. @see wiki/unit/drift/detectDrift.md */
export function detectDrift({ pages, readSource, structureIssues }) {
  const cache = new Map()
  const read = (path) => {
    if (!cache.has(path)) cache.set(path, readSource(path))
    return cache.get(path)
  }
  const inspections = new Map(pages.map((page) => [page.name, inspectLanguage(page)]))
  const unverified = [...inspections.values()].flatMap((inspection) => inspection.unverified)
  const codePages = pages.filter((page) => inspections.get(page.name).canParse)
  const hasCode = (page) => ['unit', 'type', 'feature'].includes(page.type)
  const absent = pages.filter(hasCode).flatMap((page) => toList(page.frontmatter.code)
    .filter((path) => read(path) === undefined)
    .map((path) => item(`wiki/${page.name}`, '코드에 없음', `\`${path}\` 파일이 없습니다`)))
  const present = codePages.filter((page) => !hasCode(page) || toList(page.frontmatter.code).every((path) => read(path) !== undefined))
  const structure = structureIssues.map(({ page, message }) =>
    item(`wiki/${page}`, 'wiki 구조', message)
  )
  const shapes = present.filter(hasShape).flatMap(checkShape(read))
  const items = [
    ...structure,
    ...absent,
    ...[...inspections.values()].flatMap((inspection) => inspection.items),
    ...shapes,
    ...checkUndocumentedExports(pages, read, present),
    ...checkFeatureComposition(pages.filter((page) => page.type !== 'feature' || present.includes(page)), read),
    ...checkUsageConsistency(pages),
    ...pages.flatMap((page) => checkCompleteness(page, inspections.get(page.name).canParse)),
  ]
  const blocked = protectedTargets(unverified)
  const checkedTargets = [...pages.map((page) => `wiki/${page.name}`),
    ...present.filter(hasCode).flatMap((page) => toList(page.frontmatter.code)), ...items.map(({ target }) => target)]
    .filter((target) => !blocked.has(target))
  return { items, unverified, checkedTargets: [...new Set(checkedTargets)] }
}
