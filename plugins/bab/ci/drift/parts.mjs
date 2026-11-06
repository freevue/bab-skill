import { scanDepth } from './scan.mjs'
import { normalizeTypeDeclaration } from './types.mjs'

/**
 * 비교용으로 타입 표기를 정규화합니다. 공백과 구분자 차이를 없앱니다.
 */
export const normalizeType = (text) => normalizeTypeDeclaration(text ?? '')

/**
 * 최상위(괄호 깊이 0) 쉼표로 문자열을 나눕니다. `=>`의 `>`는 괄호로 세지 않습니다.
 */
export function splitTopLevel(text) {
  const cuts = [...scanDepth(text, 0)]
    .filter(({ char, before }) => char === ',' && before === 0)
    .map(({ index }) => index)
  return [-1, ...cuts]
    .map((cut, position, all) => text.slice(cut + 1, all[position + 1] ?? text.length).trim())
    .filter(Boolean)
}

const topLevelIndex = (text, wanted) =>
  [...scanDepth(text, 0)].find(
    ({ char, before, index }) => char === wanted && before === 0 && text[index + 1] !== '>'
  )?.index

/**
 * `이름: 타입 = 기본값` 한 조각을 이름과 타입으로 나눕니다. `?`와 `...`은 이름에서 뗍니다.
 */
export function splitNameAndType(part) {
  const withoutDefault = part.slice(0, topLevelIndex(part, '=') ?? part.length)
  const colon = topLevelIndex(withoutDefault, ':')
  const rawName = colon === undefined ? withoutDefault : withoutDefault.slice(0, colon)
  const name = rawName.replace(/^\s*(?:readonly\s+)?\.\.\./, '').replace(/^\s*readonly\s+/, '')
  return {
    name: normalizeType(name.replace(/\?\s*$/, '')),
    type: colon === undefined ? undefined : normalizeType(withoutDefault.slice(colon + 1)),
  }
}

/**
 * 정규화된 함수 선언부에서 매개변수 목록과 반환 타입을 꺼냅니다.
 */
export function readCallShape(head) {
  const scanned = [...scanDepth(head, 0)]
  const open = scanned.find(({ char, before }) => char === '(' && before === 0)
  if (!open) return { params: [], returnType: undefined }
  const close = scanned.find(
    ({ char, depth, index }) => char === ')' && depth === 0 && index > open.index
  )
  const inner = head.slice(open.index + 1, close?.index ?? head.length)
  const rest = head.slice((close?.index ?? head.length) + 1).trim()
  return {
    params: splitTopLevel(inner).map(splitNameAndType),
    returnType: rest.startsWith(':') ? normalizeType(rest.slice(1)) : undefined,
  }
}

/**
 * 정규화된 타입 선언에서 필드(또는 enum 멤버)를 꺼냅니다. 중괄호 본문이 없으면 빈 목록입니다.
 */
export function readFields(declaration) {
  const open = declaration.indexOf('{')
  if (open === -1) return []
  const isEnum = /^(?:const\s+)?enum\b/.test(declaration)
  const body = declaration.slice(open + 1, declaration.lastIndexOf('}'))
  return splitTopLevel(body).map((member) => {
    if (!isEnum) return splitNameAndType(member)
    return { name: normalizeType(member.split('=')[0]), type: undefined }
  })
}
