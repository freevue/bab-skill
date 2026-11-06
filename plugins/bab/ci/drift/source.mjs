const IDENTIFIER = '[A-Za-z_$][\\w$]*'
const FUNCTION_HEAD = `(?:async\\s+)?function\\s*\\*?\\s*(${IDENTIFIER})`
const CONST_HEAD = `const\\s+(${IDENTIFIER})\\s*(?::[^=]+)?=\\s*(?:async\\s+)?(?:function\\b|\\(|${IDENTIFIER}\\s*=>)`
const OPENERS = '([{<'
const CLOSERS = ')]}>'
const TYPE_END = /[\w$>\])}]/

const declarationPattern = (exportedOnly) => {
  const prefix = exportedOnly ? 'export\\s+' : '(?:export\\s+)?'
  return new RegExp(`${prefix}(?:${FUNCTION_HEAD}|${CONST_HEAD})`, 'g')
}

const previousSignificant = (text, index) => {
  const before = text.slice(0, index).trimEnd()
  return before[before.length - 1] ?? ''
}

/**
 * 선언 시작 위치부터 본문 직전까지의 선언부를 잘라냅니다. 화살표 함수는 `=>`까지 포함합니다.
 */
export function sliceHead(text, start) {
  let depth = 0
  for (let index = start; index < text.length; index++) {
    const char = text[index]
    if (char === '=' && text[index + 1] === '>' && depth === 0) return text.slice(start, index + 2)
    if (char === '>' && text[index - 1] === '=') continue
    if (char === '{' && depth === 0 && TYPE_END.test(previousSignificant(text, index))) {
      return text.slice(start, index)
    }
    if (OPENERS.includes(char)) depth++
    else if (CLOSERS.includes(char)) depth--
    if (char === ';' && depth === 0) return text.slice(start, index)
    if (char === '\n' && depth === 0 && text[index + 1] === '\n') return text.slice(start, index)
  }
  return text.slice(start)
}

/**
 * 선언부를 비교할 수 있게 정규화합니다. export, 공백 차이, 끝의 `;`와 `=>`를 없앱니다.
 */
export function normalizeSignature(head) {
  return head
    .replace(/^\s*export\s+/, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),:<>{}[\]=|&?;])\s*/g, '$1')
    .replace(/=>$/, '')
    .replace(/[;{]$/, '')
    .trim()
}

/**
 * 소스 텍스트에서 함수 선언을 찾아 이름과 정규화한 선언부의 Map으로 돌려줍니다.
 */
export function extractDeclarations(text, { exportedOnly = true } = {}) {
  const declarations = new Map()
  for (const match of text.matchAll(declarationPattern(exportedOnly))) {
    const name = match[1] ?? match[2]
    if (!declarations.has(name)) {
      declarations.set(name, normalizeSignature(sliceHead(text, match.index)))
    }
  }
  return declarations
}

/**
 * 유닛 페이지의 `## 시그니처` 섹션에서 첫 코드 블록을 꺼냅니다.
 */
export function readSignatureBlock(pageText) {
  const section = pageText.split(/^##\s+시그니처\s*$/m)[1]
  if (!section) return undefined
  const block = section.split(/^##\s/m)[0].match(/```[\w-]*\n([\s\S]*?)```/)
  return block ? block[1] : undefined
}
