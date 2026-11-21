import { rustTokens } from './rust-scan.mjs'

const { text, split, end, visibility } = rustTokens
const typeText = (tokens) => text(tokens)

const attributes = (tokens, start) => {
  let cursor = start
  while (tokens[cursor]?.value === '#') {
    if (tokens[cursor + 1]?.value !== '[' || !['doc', 'derive', 'repr'].includes(tokens[cursor + 2]?.value)) throw new Error('지원 밖 속성')
    cursor = end(tokens, cursor + 1, false) + 1
  }
  return cursor
}

const entries = (tokens) => split(tokens).map((piece) => {
  const start = visibility(piece, attributes(piece, 0))
  const cursor = piece[start]?.value === 'mut' ? start + 1 : start
  if (!rustTokens.name(piece[cursor]?.value) || piece[cursor + 1]?.value !== ':' || piece.length <= cursor + 2) throw new Error('지원 밖 필드·매개변수 패턴')
  return { name: piece[cursor].value, type: typeText(piece.slice(cursor + 2)) }
})

const boundary = (tokens, start) => {
  for (let cursor = start; cursor < tokens.length; cursor += 1) {
    const value = tokens[cursor].value
    if (['{', ';'].includes(value)) return cursor
    if (['(', '[', '<'].includes(value)) cursor = end(tokens, cursor)
  }
  return tokens.length
}

export const rustParts = {
  attributes,
  boundary,
  function(tokens, start, keyword) {
    const name = tokens[keyword + 1]?.value
    if (!rustTokens.name(name)) throw new Error('함수 이름 없음')
    let open = keyword + 2
    if (tokens[open]?.value === '<') open = end(tokens, open) + 1
    if (tokens[open]?.value !== '(') throw new Error('함수 매개변수 구분자 없음')
    const close = end(tokens, open)
    const finish = boundary(tokens, close + 1)
    const where = tokens.findIndex((token, index) => index > close && index < finish && token.value === 'where')
    const output = tokens.slice(close + 1, where < 0 ? finish : where)
    if (output.length && output[0].value !== '->') throw new Error('지원 밖 반환형')
    const params = entries(tokens.slice(open + 1, close))
    const returnType = output.length ? typeText(output.slice(1)) : '()'
    if (!returnType) throw new Error('반환형 없음')
    const last = tokens[finish]?.value === '{' ? end(tokens, finish, false) : finish
    return { name, signature: text(tokens.slice(start, finish)), params, returnType, last,
      body: tokens[finish]?.value === '{' ? tokens.slice(finish + 1, last) : [] }
  },
  struct(tokens, start) {
    const name = tokens[start + 1]?.value
    if (!rustTokens.name(name)) throw new Error('구조체 이름 없음')
    let cursor = start + 2
    if (tokens[cursor]?.value === '<') cursor = end(tokens, cursor) + 1
    if (tokens[cursor]?.value === '(') throw new Error('튜플 구조체는 지원 밖입니다')
    const open = boundary(tokens, cursor)
    if (!tokens[open]) throw new Error('구조체 끝 없음')
    const last = tokens[open].value === '{' ? end(tokens, open) : open
    const fields = tokens[open].value === '{' ? entries(tokens.slice(open + 1, last)) : []
    return { name, signature: text(tokens.slice(start, last + (tokens[last].value === ';' ? 0 : 1))), fields, last }
  },
  uses(tokens, params) {
    const names = new Set()
    const bindings = new Set(params.map(({ name }) => name))
    let error
    for (let index = 0; index < tokens.length; index += 1) {
      const value = tokens[index].value
      if (value === '!' || (value === '.' && rustTokens.name(tokens[index + 1]?.value))) error = '매크로·메서드·간접 호출 관계는 지원 밖입니다'
      if (value === ')' && tokens[index + 1]?.value === '(') error = '간접 호출 관계는 지원 밖입니다'
      if (value === 'let') {
        const binding = tokens[index + (tokens[index + 1]?.value === 'mut' ? 2 : 1)]?.value
        if (!rustTokens.name(binding)) error = '패턴 바인딩 관계는 지원 밖입니다'
        else bindings.add(binding)
      }
      if (!rustTokens.name(value) || tokens[index - 1]?.value === 'fn') continue
      let next = index + 1
      if (tokens[next]?.value === '::' && tokens[next + 1]?.value === '<') next = end(tokens, next + 1) + 1
      if (tokens[next]?.value !== '(' || tokens[index - 1]?.value === '.') continue
      if (bindings.has(value)) error = '변수·매개변수 호출 관계는 지원 밖입니다'
      names.add(value)
    }
    return { names, error }
  },
}
