const ALL_BRACKETS = { openers: '([{<', closers: ')]}>' }
const SOURCE_TOKEN = /\/\/[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$)|"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*'|`/g
const TEMPLATE_TOKEN = /\\[\s\S]|\$\{|`/g
const INTERPOLATION_TOKEN = new RegExp(`${SOURCE_TOKEN.source}|[{}]`, 'g')

function templateEnd(text, start) {
  const pattern = new RegExp(TEMPLATE_TOKEN)
  pattern.lastIndex = start
  for (let match; (match = pattern.exec(text));) {
    if (match[0] === '`') return pattern.lastIndex
    if (match[0] === '${') pattern.lastIndex = interpolationEnd(text, pattern.lastIndex)
  }
}

function interpolationEnd(text, start) {
  const pattern = new RegExp(INTERPOLATION_TOKEN)
  pattern.lastIndex = start
  let depth = 1
  for (let match; (match = pattern.exec(text));) {
    if (match[0] === '`') pattern.lastIndex = templateEnd(text, pattern.lastIndex) ?? pattern.lastIndex
    if (match[0] === '{') depth += 1
    if (match[0] === '}') {
      depth -= 1
      if (depth === 0) return pattern.lastIndex
    }
  }
  return text.length
}

/** 선언을 찾는 코드와 문자열 원문을 보존한 소스의 위치를 맞춥니다. */
export function scanSource(text) {
  const pattern = new RegExp(SOURCE_TOKEN)
  let source = ''
  let code = ''
  let cursor = 0
  for (let match; (match = pattern.exec(text));) {
    if (match[0] === '`') {
      const end = templateEnd(text, pattern.lastIndex)
      if (end === undefined) continue
      pattern.lastIndex = end
    }
    const prefix = text.slice(cursor, match.index)
    cursor = pattern.lastIndex
    const token = text.slice(match.index, cursor)
    const comment = token.startsWith('/')
    const clean = comment ? token.replace(/[^\r\n]/g, ' ') : token
    source += prefix + clean
    code += prefix + (comment ? clean : token[0] + ' '.repeat(token.length - 1))
  }
  const rest = text.slice(cursor)
  return { source: source + rest, code: code + rest }
}

export const stripSourceComments = (text) => scanSource(text).source

/**
 * `start`부터 문자를 하나씩 내보내며 괄호 깊이를 셉니다. `=>`의 `>`는 괄호로 세지 않습니다.
 * 각 항목은 위치, 문자, 이 문자 앞의 깊이(before), 뒤의 깊이(depth), 화살표 여부를 담습니다.
 */
export function* scanDepth(text, start, { openers, closers } = ALL_BRACKETS) {
  let depth = 0
  for (const [offset, char] of text.slice(start).split('').entries()) {
    const index = start + offset
    const before = depth
    const isArrow = char === '>' && text[index - 1] === '='
    if (!isArrow && openers.includes(char)) depth += 1
    else if (!isArrow && closers.includes(char)) depth -= 1
    yield { index, char, before, depth, isArrow }
  }
}

export const BRACES = { openers: '{', closers: '}' }
