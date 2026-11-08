import { readCallShape, readFields, normalizeType } from './parts.mjs'
import { toList } from '../../skills/audit/scripts/frontmatter.mjs'
import { extractDeclarations, readSignatureBlock } from './source.mjs'
import {
  countLinks,
  countOrderedItems,
  findTable,
  hasCodeBlock,
  readTables,
  sectionText,
} from './tables.mjs'
import { extractTypeDeclarations, readDefinitionBlock } from './types.mjs'

const PLACEHOLDER_PATTERN = /\{[^{}`\n]*\}/

const item = (target, kind, message) => ({ target, kind, message })

const rowName = (row) => normalizeType(row[0].replace(/^\.\.\./, '').replace(/\?$/, ''))

const isBlank = (cell) => !cell || cell === '-'

/**
 * 선언의 항목(매개변수·필드)과 표의 행을 이름, 타입, 의미로 대조합니다.
 */
export function compareRows(entries, table, labels) {
  const rows = table?.rows ?? []
  const rowsByName = new Map(rows.map((row) => [rowName(row), row]))
  const names = new Set(entries.map((entry) => entry.name))
  const missing = entries
    .filter((entry) => !rowsByName.has(entry.name))
    .map((entry) => [`${labels.kind} 누락`, `\`${entry.name}\`이 표에 없습니다`])
  const extra = rows
    .filter((row) => !names.has(rowName(row)))
    .map((row) => [`${labels.kind} 초과`, `\`${row[0]}\`은 선언에 없습니다`])
  const detail = entries
    .filter((entry) => rowsByName.has(entry.name))
    .flatMap((entry) => {
      const row = rowsByName.get(entry.name)
      const typeMismatch = entry.type !== undefined && normalizeType(row[1]) !== entry.type
      const found = []
      if (typeMismatch)
        found.push([
          `${labels.kind} 타입 불일치`,
          `\`${entry.name}\`: 선언 \`${entry.type}\` / 표 \`${row[1]}\``,
        ])
      if (isBlank(row[row.length - 1]))
        found.push([`${labels.kind} 설명 없음`, `\`${entry.name}\`의 의미가 비어 있습니다`])
      return found
    })
  return [...missing, ...extra, ...detail]
}

const checkUnit = (page) => {
  const signature = sectionText(page.text, '시그니처')
  const block = readSignatureBlock(page.text)
  const head =
    block && extractDeclarations(block, { exportedOnly: false }).get(page.frontmatter.name)
  const found = []
  if (head) {
    const { params, returnType } = readCallShape(head)
    const tables = readTables(signature)
    found.push(...compareRows(params, findTable(tables, '매개변수'), { kind: '매개변수' }))
    const returns = findTable(tables, '반환')?.rows ?? []
    if (returns.length === 0) found.push(['반환 누락', '`반환` 표에 행이 없습니다'])
    else if (returnType !== undefined && normalizeType(returns[0][0]) !== returnType) {
      found.push(['반환 타입 불일치', `선언 \`${returnType}\` / 표 \`${returns[0][0]}\``])
    } else if (isBlank(returns[0][1])) found.push(['반환 설명 없음', '반환의 의미가 비어 있습니다'])
  }
  if (countOrderedItems(sectionText(page.text, '내부 로직')) === 0)
    found.push(['내부 로직 없음', '번호 목록이 없습니다'])
  if (!hasCodeBlock(sectionText(page.text, '사용법')))
    found.push(['사용법 없음', '코드 블록이 없습니다'])
  if ((findTable(readTables(sectionText(page.text, 'TC')), 'ID')?.rows ?? []).length === 0) {
    found.push(['TC 없음', 'TC 표에 행이 없습니다'])
  }
  return found
}

const checkType = (page) => {
  const block = readDefinitionBlock(page.text)
  const declaration =
    block && extractTypeDeclarations(block, { exportedOnly: false }).get(page.frontmatter.name)
  if (!declaration) return []
  const fields = readFields(declaration)
  if (fields.length === 0) return []
  const table = findTable(readTables(sectionText(page.text, '필드')), '필드')
  return compareRows(fields, table, { kind: '필드' })
}

const checkFeature = (page) => {
  const found = []
  if (countLinks(sectionText(page.text, '구성 유닛')) === 0)
    found.push(['구성 유닛 없음', '링크가 없습니다'])
  if ((findTable(readTables(sectionText(page.text, 'TC')), 'ID')?.rows ?? []).length === 0) {
    found.push(['TC 없음', 'TC 표에 행이 없습니다'])
  }
  return found
}

const checkPolicy = (page) =>
  (findTable(readTables(sectionText(page.text, '규칙')), 'ID')?.rows ?? []).length === 0
    ? [['규칙 없음', '규칙 표에 행이 없습니다']]
    : []

const checkReference = (page) => [
  ...['내용', '출처']
    .filter((section) => page.headings.includes(section) && !sectionText(page.text, section).trim())
    .map((section) => [`${section} 없음`, `\`## ${section}\`이 비어 있습니다`]),
  ...(toList(page.frontmatter.code).length > 0
    ? [['참고 문서에 code 지정', '코드 형상은 정책·기능·유닛·타입 명세에 적습니다']]
    : []),
]

const CHECKS = { unit: checkUnit, type: checkType, feature: checkFeature, policy: checkPolicy, reference: checkReference }

/**
 * 코드 블록과 인라인 코드 밖에 템플릿 자리표시 `{...}`가 남았는지 봅니다.
 */
export function findPlaceholders(text) {
  const prose = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
  const match = prose.match(PLACEHOLDER_PATTERN)
  return match ? [['자리표시 남음', `\`${match[0]}\``]] : []
}

/**
 * 페이지 하나의 문서 완결성을 검사합니다. 함수 이름과 매개변수 하나까지 빠짐없이 적혔는지 봅니다.
 */
export function checkCompleteness(page) {
  if (!Object.hasOwn(CHECKS, page.type)) return []
  const found = [...CHECKS[page.type](page), ...findPlaceholders(page.text)]
  return found.map(([kind, message]) => item(`wiki/${page.name}`, kind, message))
}
