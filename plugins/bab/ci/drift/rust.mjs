import { tokenizeRust, rustTokens } from './rust-scan.mjs'
import { rustParts } from './rust-parts.mjs'

/** 지원하는 최상위 Rust 선언과 호출 관계를 읽습니다. @see wiki/unit/drift/readRust.md */
export function readRust(text) {
  const { tokens, error } = tokenizeRust(text)
  const result = { functions: new Map(), types: new Map(), usedNames: new Set(), error, featureError: undefined }
  if (error) return result
  const aliases = new Map()
  const bodies = []
  try {
    let cursor = 0
    while (cursor < tokens.length) {
      if (tokens[cursor].value === ';') { cursor += 1; continue }
      cursor = rustParts.attributes(tokens, cursor)
      const start = rustTokens.visibility(tokens, cursor)
      const isPublic = start !== cursor
      let keyword = start
      while (['const', 'async', 'unsafe', 'extern'].includes(tokens[keyword]?.value)) {
        if (['const'].includes(tokens[keyword].value) && tokens[keyword + 1]?.value !== 'fn' && tokens[keyword + 1]?.value !== 'unsafe') break
        keyword += 1
        if (/^"/.test(tokens[keyword]?.value ?? '')) keyword += 1
      }
      const value = tokens[keyword]?.value
      if (value === 'fn' || value === 'struct') {
        const record = value === 'fn' ? rustParts.function(tokens, start, keyword) : rustParts.struct(tokens, keyword)
        const records = value === 'fn' ? result.functions : result.types
        if (records.has(record.name)) throw new Error(`중복 선언: ${record.name}`)
        records.set(record.name, { ...record, public: isPublic })
        if (record.body) bodies.push(record)
        cursor = record.last + 1
        continue
      }
      if (['use', 'const', 'static'].includes(tokens[start]?.value)) {
        const finish = rustParts.boundary(tokens, start + 1)
        if (tokens[finish]?.value !== ';') throw new Error('지원 밖 항목 초기화')
        if (tokens[start].value === 'use') {
          const pieces = tokens.slice(start + 1, finish).map((token) => token.value)
          if (pieces.some((piece) => ['{', '*'].includes(piece))) result.featureError = '그룹·glob use는 지원 밖입니다'
          const alias = pieces.indexOf('as')
          if (alias > 0) aliases.set(pieces[alias + 1], pieces[alias - 1])
        }
        cursor = finish + 1
        continue
      }
      throw new Error(`지원 밖 최상위 항목: ${tokens[start]?.value ?? '(없음)'}`)
    }
    for (const record of bodies) {
      const uses = rustParts.uses(record.body, record.params)
      if (uses.error) result.featureError = uses.error
      for (const name of uses.names) result.usedNames.add(aliases.get(name) ?? name)
    }
  } catch (cause) { result.error = cause.message }
  return result
}
