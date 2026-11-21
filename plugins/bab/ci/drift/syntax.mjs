import { extname } from 'node:path'
import { extractDeclarations } from './source.mjs'
import { extractTypeDeclarations } from './types.mjs'
import { readCallShape, readFields, normalizeType } from './parts.mjs'
import { readRust } from './rust.mjs'
import { tokenizeRust, rustTokens } from './rust-scan.mjs'

/** 언어와 명세 종류에 맞는 선언·표 판독기를 선택합니다. @see wiki/unit/drift/syntaxFor.md */
export function syntaxFor(path, type) {
  if (extname(path ?? '').toLowerCase() !== '.rs') return {
    extract: type === 'unit' ? extractDeclarations : extractTypeDeclarations,
    call: readCallShape, fields: readFields, normalize: normalizeType,
  }
  const records = (text) => readRust(text)[type === 'unit' ? 'functions' : 'types']
  return {
    extract: (text, { exportedOnly = true } = {}) => new Map([...records(text)]
      .filter(([, record]) => !exportedOnly || record.public).map(([name, record]) => [name, record.signature])),
    call: (text) => [...records(text).values()][0],
    fields: (text) => [...records(text).values()][0]?.fields ?? [],
    normalize: (text) => rustTokens.text(tokenizeRust(text ?? '').tokens),
  }
}
