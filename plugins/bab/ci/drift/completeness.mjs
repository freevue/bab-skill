import { normalizeType } from './parts.mjs'
import { toList } from '../../skills/audit/scripts/frontmatter.mjs'
import { readSignatureBlock } from './source.mjs'
import {
  countLinks,
  countOrderedItems,
  findTable,
  hasCodeBlock,
  readTables,
  sectionText,
} from './tables.mjs'
import { readDefinitionBlock } from './types.mjs'
import { syntaxFor } from './syntax.mjs'

// 선언 스캔이 정규식의 백틱을 템플릿 시작으로 오인하지 않도록 문자 코드를 씁니다.
const PLACEHOLDER_PATTERN = /\{[^{\x60\n]*\}/

const item = (target, kind, message) => ({ target, kind, message })

const rowName = (row) => normalizeType(row[0].replace(/^\.\.\./, '').replace(/\?$/, ''))

const isBlank = (cell) => !cell || cell === '-'

/** 선언 항목과 문서 표의 이름·타입·의미를 대조합니다. @see wiki/unit/drift/compareRows.md */
export function compareRows(entries, table, labels) {
  const normalize = labels.normalize ?? normalizeType
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
      const typeMismatch = entry.type !== undefined && normalize(row[1]) !== entry.type
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

const checkUnit = (page, parseCode) => {
  const signature = sectionText(page.text, '시그니처')
  const block = readSignatureBlock(page.text)
  const syntax = syntaxFor(toList(page.frontmatter.code)[0], 'unit')
  const head =
    parseCode && block && syntax.extract(block, { exportedOnly: false }).get(page.frontmatter.name)
  const found = []
  if (head) {
    const { params, returnType } = syntax.call(head)
    const tables = readTables(signature)
    found.push(...compareRows(params, findTable(tables, '매개변수'), { kind: '매개변수', normalize: syntax.normalize }))
    const returns = findTable(tables, '반환')?.rows ?? []
    if (returns.length === 0) found.push(['반환 누락', '`반환` 표에 행이 없습니다'])
    else if (returnType !== undefined && syntax.normalize(returns[0][0]) !== returnType) {
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

const checkType = (page, parseCode) => {
  if (!parseCode) return []
  const block = readDefinitionBlock(page.text)
  const syntax = syntaxFor(toList(page.frontmatter.code)[0], 'type')
  const declaration =
    block && syntax.extract(block, { exportedOnly: false }).get(page.frontmatter.name)
  if (!declaration) return []
  const fields = syntax.fields(declaration)
  const table = findTable(readTables(sectionText(page.text, '필드')), '필드')
  return compareRows(fields, table, { kind: '필드', normalize: syntax.normalize })
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

/** 코드 밖에 남은 템플릿 자리표시를 찾습니다. @see wiki/unit/drift/findPlaceholders.md */
export function findPlaceholders(text) {
  const prose = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
  const match = prose.match(PLACEHOLDER_PATTERN)
  return match ? [['자리표시 남음', `\`${match[0]}\``]] : []
}

/** 언어 판독 범위에 맞춰 문서의 완결성을 검사합니다. @see wiki/unit/drift/checkCompleteness.md */
export function checkCompleteness(page, parseCode = true) {
  if (!Object.hasOwn(CHECKS, page.type)) return []
  const found = [...CHECKS[page.type](page, parseCode), ...findPlaceholders(page.text)]
  return found.map(([kind, message]) => item(`wiki/${page.name}`, kind, message))
}
