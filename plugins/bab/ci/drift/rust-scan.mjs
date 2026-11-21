const identifier = /^(?:r#)?[\p{ID_Start}_][\p{ID_Continue}_]*/u
const character = /^(?:b)?'(?:\\(?:u\{[\da-fA-F_]+\}|x[\da-fA-F]{2}|[^\r\n])|[^'\\\r\n])'/u

/** Rust 주석·리터럴과 수명을 구분해 토큰을 읽습니다. @see wiki/unit/drift/tokenizeRust.md */
export function tokenizeRust(text) {
  const tokens = []
  let cursor = 0
  while (cursor < text.length) {
    const rest = text.slice(cursor)
    if (/^\s/.test(rest)) { cursor += 1; continue }
    if (rest.startsWith('//')) {
      const end = text.indexOf('\n', cursor)
      cursor = end < 0 ? text.length : end
      continue
    }
    if (rest.startsWith('/*')) {
      let depth = 1
      cursor += 2
      while (cursor < text.length && depth > 0) {
        if (text.startsWith('/*', cursor)) { depth += 1; cursor += 2 }
        else if (text.startsWith('*/', cursor)) { depth -= 1; cursor += 2 }
        else cursor += 1
      }
      if (depth > 0) return { tokens, error: '닫히지 않은 블록 주석' }
      continue
    }
    const start = cursor
    const raw = rest.match(/^(?:br|cr|r)(#*)"/)
    const quote = rest.match(/^(?:b|c)?"/)
    const char = rest.match(character)
    if (raw) {
      const close = `"${raw[1]}`
      const end = text.indexOf(close, cursor + raw[0].length)
      if (end < 0) return { tokens, error: '닫히지 않은 raw string' }
      cursor = end + close.length
    } else if (quote) {
      cursor += quote[0].length
      while (cursor < text.length && text[cursor] !== '"') cursor += text[cursor] === '\\' ? 2 : 1
      if (cursor >= text.length) return { tokens, error: '닫히지 않은 문자열' }
      cursor += 1
    } else if (char) cursor += char[0].length
    else {
      const token = rest.match(/^'[\p{ID_Start}_][\p{ID_Continue}_]*/u)
        ?? rest.match(identifier) ?? rest.match(/^\d[\w.]*/)
        ?? rest.match(/^(?:->|::|\.\.\.)/) ?? rest.match(/^[^\s]/u)
      cursor += token[0].length
    }
    tokens.push({ value: text.slice(start, cursor), start, end: cursor })
  }
  return { tokens, error: undefined }
}

// Rust 전용 구분자는 ->를 하나의 토큰으로 읽으므로 제네릭의 >와 혼동하지 않습니다.
export const rustTokens = {
  name: (value) => identifier.test(value ?? ''),
  text: (tokens) => tokens.filter((token, index) => token.value !== ',' || ![')', '}', ']', '>'].includes(tokens[index + 1]?.value))
    .map((token, index, all) => `${index > 0 && /[\p{ID_Continue}_]$/u.test(all[index - 1].value) && /^[\p{ID_Start}_']/u.test(token.value) ? ' ' : ''}${token.value}`).join(''),
  end(tokens, start, angles = true) {
    const pairs = { '(': ')', '[': ']', '{': '}', ...(angles ? { '<': '>' } : {}) }
    const stack = [pairs[tokens[start]?.value]]
    if (!stack[0]) throw new Error('구분자 시작 없음')
    for (let index = start + 1; index < tokens.length; index += 1) {
      const value = tokens[index].value
      if (pairs[value]) stack.push(pairs[value])
      else if (Object.values(pairs).includes(value)) {
        if (stack.pop() !== value) throw new Error('구분자 불일치')
        if (stack.length === 0) return index
      }
    }
    throw new Error('닫히지 않은 구분자')
  },
  split(tokens) {
    const pieces = []
    let start = 0
    for (let index = 0; index < tokens.length; index += 1) {
      if (['(', '[', '{', '<'].includes(tokens[index].value)) index = rustTokens.end(tokens, index)
      else if (tokens[index].value === ',') { pieces.push(tokens.slice(start, index)); start = index + 1 }
    }
    pieces.push(tokens.slice(start))
    return pieces.filter((piece) => piece.length > 0)
  },
  visibility(tokens, start) {
    if (tokens[start]?.value !== 'pub') return start
    return tokens[start + 1]?.value === '(' ? rustTokens.end(tokens, start + 1) + 1 : start + 1
  },
}
