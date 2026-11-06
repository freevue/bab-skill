const ALL_BRACKETS = { openers: '([{<', closers: ')]}>' }

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
