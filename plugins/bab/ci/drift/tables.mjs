const FENCE_PATTERN = /```[\s\S]*?```/g
const ESCAPED_PIPE = '\u0000'

/**
 * 페이지에서 `## {heading}` 섹션의 본문을 다음 `##` 제목 전까지 돌려줍니다. 없으면 빈 문자열입니다.
 */
export function sectionText(text, heading) {
  const section = text.split(new RegExp(`^##\\s+${heading}\\s*$`, 'm'))[1]
  return section ? section.split(/^##\s/m)[0] : ''
}

const unwrapCell = (cell) =>
  cell
    .replaceAll(ESCAPED_PIPE, '|')
    .trim()
    .replace(/^`(.*)`$/, '$1')
    .trim()

const splitRow = (line) =>
  line
    .replace(/\\\|/g, ESCAPED_PIPE)
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(unwrapCell)

/**
 * 섹션 본문의 Markdown 표를 `{ header, rows }` 목록으로 읽습니다. 코드 블록 안의 표는 읽지 않습니다.
 */
export function readTables(body) {
  const lines = body.replace(FENCE_PATTERN, '').split('\n')
  return lines
    .reduce((groups, line) => {
      const isRow = line.trim().startsWith('|')
      const last = groups[groups.length - 1]
      if (!isRow) return last && last.length > 0 ? [...groups, []] : groups
      if (!last) return [[line]]
      return [...groups.slice(0, -1), [...last, line]]
    }, [])
    .filter((group) => group.length >= 2)
    .map(([header, , ...rows]) => ({ header: splitRow(header), rows: rows.map(splitRow) }))
}

/**
 * 첫 열 제목이 `firstHeader`인 표를 찾습니다.
 */
export const findTable = (tables, firstHeader) =>
  tables.find((table) => table.header[0] === firstHeader)

/**
 * 섹션 본문에 코드 블록이 있는지 봅니다.
 */
export const hasCodeBlock = (body) => /```[\s\S]*?```/.test(body)

/**
 * 섹션 본문에서 번호 목록 항목의 수를 셉니다.
 */
export const countOrderedItems = (body) =>
  (body.replace(FENCE_PATTERN, '').match(/^\s*\d+\.\s+\S/gm) ?? []).length

/**
 * 섹션 본문에서 Markdown 링크의 수를 셉니다.
 */
export const countLinks = (body) => (body.match(/\[[^\]]+\]\([^)]+\)/g) ?? []).length
