import { BRACES, scanDepth } from './scan.mjs'

const IDENTIFIER = '[A-Za-z_$][\\w$]*'
const CONTINUES_TYPE = /^[|&]/

const typePattern = (exportedOnly) => {
  const prefix = exportedOnly ? 'export\\s+' : '(?:export\\s+)?'
  return new RegExp(
    `${prefix}(?:declare\\s+)?(type|interface|enum|const\\s+enum)\\s+(${IDENTIFIER})`,
    'g'
  )
}

const closingBraceEnd = (text, start) => {
  const open = text.indexOf('{', start)
  if (open === -1) return text.length
  for (const { index, depth } of scanDepth(text, open, BRACES)) {
    if (depth === 0) return index + 1
  }
  return text.length
}

const aliasEnd = (text, start) => {
  const equals = text.indexOf('=', start)
  if (equals === -1) return text.length
  for (const { index, char, depth, isArrow } of scanDepth(text, equals + 1)) {
    if (isArrow || depth !== 0) continue
    if (char === ';') return index
    const rest = text.slice(index + 1).trimStart()
    const pending = /[=|&,(<]$/.test(text.slice(start, index).trimEnd())
    if (char === '\n' && !pending && !CONTINUES_TYPE.test(rest)) return index
  }
  return text.length
}

/**
 * 타입 선언을 비교할 수 있게 정규화합니다. 공백, export, 필드 구분자(`;`·`,`·줄바꿈)와 끝 구분자 차이를 없앱니다.
 */
export function normalizeTypeDeclaration(declaration) {
  return declaration
    .replace(/^\s*export\s+/, '')
    .replace(/([\w$\])}>'"?])[ \t]*\n\s*(?=[A-Za-z_$'"[])/g, '$1,')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(){}[\]<>:;,=|&?])\s*/g, '$1')
    .replace(/;/g, ',')
    .replace(/,+([}\])>])/g, '$1')
    .replace(/=\|/, '=')
    .replace(/[,;]+$/, '')
    .trim()
}

/**
 * 소스 텍스트에서 타입 선언(type, interface, enum)을 본문까지 찾아 이름과 정규화한 선언의 Map으로 돌려줍니다.
 */
export function extractTypeDeclarations(text, { exportedOnly = true } = {}) {
  const declarations = new Map()
  for (const match of text.matchAll(typePattern(exportedOnly))) {
    const [, keyword, name] = match
    if (declarations.has(name)) continue
    const end =
      keyword === 'type' ? aliasEnd(text, match.index) : closingBraceEnd(text, match.index)
    declarations.set(name, normalizeTypeDeclaration(text.slice(match.index, end)))
  }
  return declarations
}

/**
 * 타입 페이지의 `## 정의` 섹션에서 첫 코드 블록을 꺼냅니다.
 */
export function readDefinitionBlock(pageText) {
  const section = pageText.split(/^##\s+정의\s*$/m)[1]
  if (!section) return undefined
  const block = section.split(/^##\s/m)[0].match(/```[\w-]*\n([\s\S]*?)```/)
  return block ? block[1] : undefined
}
