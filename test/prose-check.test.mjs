import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkLine, checkProse, proseLines } from '../plugins/bab/skills/audit/scripts/prose-check.mjs'

test('여러 줄로 이어진 문단이 6문장을 넘으면 시작 줄을 보고한다', () => {
  const document = [
    '# 제목',
    '',
    '첫 문장입니다. 둘째 문장입니다.',
    '셋째 문장입니다. 넷째 문장입니다.',
    '다섯째 문장입니다. 여섯째 문장입니다. 일곱째 문장입니다.',
  ].join('\n')
  assert.deepEqual(checkProse(document), [{ number: 3, rule: '긴 문단', detail: '7문장' }])
})

test('코드·표·제목·목록은 문단을 나누고 그 안의 문장은 세지 않는다', () => {
  const document = [
    '첫 문장입니다. 둘째 문장입니다. 셋째 문장입니다. 넷째 문장입니다.',
    '```text',
    '다섯째 문장입니다. 여섯째 문장입니다. 일곱째 문장입니다.',
    '```',
    '다섯째 문장입니다. 여섯째 문장입니다. 일곱째 문장입니다.',
    '| 열 | 값 |',
    '| --- | --- |',
    '| 한 줄 | 한 문장입니다. 또 한 문장입니다. |',
    '# 제목입니다. 제목입니다.',
    '- 목록입니다. 목록입니다.',
    '마지막 문장입니다.',
  ].join('\n')
  assert.deepEqual(checkProse(document), [])
})

test('기존 표현 검사와 한 줄에 담긴 7문장도 유지한다', () => {
  assert.deepEqual(checkLine('단순히 실행합니다.'), [['수식어', '단순히']])
  const document = Array.from({ length: 7 }, (_, index) => `${index + 1}번째 문장입니다.`).join(' ')
  assert.deepEqual(checkProse(document), [{ number: 1, rule: '긴 문단', detail: '7문장' }])
})

test('frontmatter와 두 코드 울타리를 빼고 원래 줄 번호를 유지한다', () => {
  const document = [
    '---', 'name: sample', '---', '첫 문장입니다.',
    '```text', '단순히 실행합니다.', '```',
    '둘째 문장입니다.', '~~~text', '매우 길게 씁니다.', '~~~', '셋째 문장입니다.',
  ].join('\n')
  assert.deepEqual([...proseLines(document)].filter(({ text }) => text), [
    { number: 4, text: '첫 문장입니다.' },
    { number: 8, text: '둘째 문장입니다.' },
    { number: 12, text: '셋째 문장입니다.' },
  ])
})
