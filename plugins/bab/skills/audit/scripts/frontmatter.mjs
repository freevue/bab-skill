const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---(?:\n|$)/
const KEY_PATTERN = /^([\w-]+):\s*(.*)$/
const LIST_ITEM_PATTERN = /^\s+-\s*(.*)$/

/**
 * BOM을 지우고 줄바꿈을 `\n`으로 통일합니다.
 */
export function normalizeText(text) {
  return (text ?? '').replace(/^﻿/, '').replace(/\r\n?/g, '\n')
}

const unquote = (value) => {
  const trimmed = value.trim()
  const quoted = trimmed.match(/^(['"])(.*)\1$/)
  return quoted ? quoted[2] : trimmed
}

const parseInlineList = (raw) => raw.slice(1, -1).split(',').map(unquote).filter(Boolean)

const parseValue = (raw) => {
  const value = raw.replace(/\s+#.*$/, '').trim()
  if (value.startsWith('[') && value.endsWith(']')) return parseInlineList(value)
  return unquote(value)
}

const appendListItem = (entries, item) => {
  const last = entries[entries.length - 1]
  if (!last) return entries
  const current = Array.isArray(last[1]) ? last[1] : []
  return [...entries.slice(0, -1), [last[0], [...current, unquote(item)]]]
}

/**
 * frontmatter를 읽습니다. 문자열(따옴표 허용), 한 줄 목록 `[a, b]`, 여러 줄 목록(`- a`), 주석을 지원합니다.
 */
export function readFrontmatter(text) {
  const block = normalizeText(text).match(FRONTMATTER_PATTERN)
  if (!block) return {}
  const entries = block[1].split('\n').reduce((collected, line) => {
    if (/^\s*(#.*)?$/.test(line)) return collected
    const listItem = line.match(LIST_ITEM_PATTERN)
    if (listItem) return appendListItem(collected, listItem[1])
    const pair = line.match(KEY_PATTERN)
    return pair ? [...collected, [pair[1], parseValue(pair[2])]] : collected
  }, [])
  return Object.fromEntries(entries)
}

/**
 * 값을 목록으로 맞춥니다. 배열은 그대로, 문자열 하나는 한 항목 목록, 비어 있으면 빈 목록입니다.
 */
export function toList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}
