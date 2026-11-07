---
name: parsePriority
type: unit
module: plugins/bab/ci
issues: []
code: [plugins/bab/ci/issue-sync.mjs]
---

# parsePriority

GitHub 이슈 본문의 첫 중요도 섹션에서 대문자 `P0`~`P3` 중 처음 나온 값을 읽습니다. 외부 호출이나 입력 변경은 없습니다.

## 시그니처

```javascript
export function parsePriority(body)
```

실제 JavaScript 선언에는 타입 표기가 없습니다. 아래 표가 타입 계약이며, 선언과의 타입 비교는 자동 검사 범위 밖입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| body | string \| null \| undefined | undefined | 이슈 본문입니다. null과 undefined는 빈 문자열로 읽습니다 |

| 반환 | 의미 |
| --- | --- |
| 'P0' \| 'P1' \| 'P2' \| 'P3' \| undefined | 찾은 중요도입니다. 섹션이나 유효한 값이 없으면 undefined입니다 |

문자열·null·undefined만 계약에 포함합니다. 숫자나 불리언을 전달하면 TypeError가 발생합니다. 오류 메시지 자체는 계약에 포함하지 않습니다.

Python으로 재현하면 이름은 `parsePriority`, 선언은 `def parsePriority(body=None)`입니다. null·undefined·반환값 없음은 모두 None으로 대응합니다.

## 내부 로직

다음 순서를 유지합니다. 없는 값을 기본 중요도로 바꾸거나, 본문 전체에서 중요도를 찾지 않습니다.

1. body가 null 또는 undefined이면 빈 문자열로 읽습니다.
2. 첫 중요도 제목 뒤부터 다음 중요도 제목 앞까지를 선택합니다. 다음 중요도 제목이 없으면 본문 끝까지 선택합니다. 첫 제목이 없거나 선택한 섹션이 비었으면 undefined를 반환합니다.
3. 선택한 섹션에서 다음 일반 제목 앞까지만 남깁니다. 그 뒤의 중요도 값은 읽지 않습니다.
4. 남긴 내용에서 닫힌 HTML 주석을 모두 제거합니다. 제거한 자리에 공백을 넣지 않습니다.
5. 남긴 내용에서 유효한 중요도 중 첫 값을 반환합니다. 없으면 undefined를 반환합니다.

제목과 값은 다음 규칙으로 구분합니다.

| 항목 | 규칙 |
| --- | --- |
| 중요도 제목 | 줄 처음의 # 1~3개 뒤에 공백이 있거나 없어도 됩니다. 제목은 Priority 또는 중요도이며, 앞뒤 공백 외의 내용은 없어야 합니다. 영어 제목은 대소문자를 구분하지 않습니다 |
| 일반 제목 | 줄 처음의 # 1~3개 바로 뒤에 공백 문자가 하나 있어야 합니다. #이 4개이거나 제목 앞에 들여쓰기가 있으면 섹션을 끝내지 않습니다 |
| HTML 주석 | `<!--`부터 그 다음 `-->`까지를 지웁니다. 여러 줄 주석도 지웁니다. 닫히지 않은 주석은 그대로 둡니다 |
| 중요도 값 | 대문자 P와 숫자 0~3으로 된 두 글자입니다. 양옆이 문자열 끝이거나 ASCII 단어 문자가 아니어야 합니다 |
| ASCII 단어 문자 | 영문 대소문자, 숫자 0~9와 밑줄입니다. 한글은 이 집합에 포함하지 않습니다 |

기준 정규식은 중요도 제목 `/^#{1,3}\s*(?:Priority|중요도)\s*$/im`, 일반 제목 `/^#{1,3}\s/m`, 주석 `/<!--[\s\S]*?-->/g`, 값 `/\b(P[0-3])\b/`입니다.

정규식의 `\s`는 JavaScript의 공백 집합입니다. 탭, LF, VT, FF, CR, 공백, NBSP와 BOM을 포함합니다. U+1680, U+2000~U+200A, U+2028, U+2029, U+202F, U+205F, U+3000도 포함합니다. U+0085는 포함하지 않습니다.

줄의 경계는 LF, CR, U+2028, U+2029입니다. 다른 언어의 정규식이 사용하는 공백·단어·줄 경계가 다르면 이 기준으로 맞춥니다.

반복된 중요도 제목은 일반 제목과 별도로 섹션을 끝냅니다. 따라서 공백 없는 `#Priority`나 `###중요도`도 앞 섹션을 끝냅니다.

제목을 먼저 자르므로 HTML 주석 안의 제목도 섹션을 끝낼 수 있습니다. 코드 블록은 별도로 제거하지 않습니다. 이 둘은 현재 동작의 한계입니다.

## 사용법

```javascript
parsePriority('# Priority\nP1 (이번 주기)') // 'P1'
parsePriority('# Priority\n<!-- P0 --> P2') // 'P2'
parsePriority('# What\nP1') // undefined
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [이슈 라벨 동기화](../../feature/issue-label-sync.md) | planLabelChanges가 본문의 중요도를 읽을 때 호출합니다 |

## TC

입력의 `\n`과 `\r\n`은 실제 줄바꿈을 뜻합니다. 모든 TC는 [회귀 테스트](../../../test/priority.test.mjs)에서 실행합니다.

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-parsePriority-01 | `# Priority\nP1 (이번 주기)` | P1 |
| UT-parsePriority-02 | `### 중요도\nP3` | P3 |
| UT-parsePriority-03 | `## pRiOrItY\nP2` | P2 |
| UT-parsePriority-04 | `#Priority\nP0` | P0 |
| UT-parsePriority-05 | `# Priority\nP3 P0` | P3 |
| UT-parsePriority-06 | `# Priority\n<!-- P0 --> P2` | P2 |
| UT-parsePriority-07 | `# Priority\n본문\n# What\nP2` | undefined |
| UT-parsePriority-08 | `# Priority\nP2\n# Priority\nP0` | P2 |
| UT-parsePriority-09 | `#### Priority\nP1` | undefined |
| UT-parsePriority-10 | ` # Priority\nP1` | undefined |
| UT-parsePriority-11 | `# Priority\np1 P4 P2x XP0 _P3 P10` | undefined |
| UT-parsePriority-12 | `# Priority\n한P1글` | P1 |
| UT-parsePriority-13 | 빈 문자열, null, undefined | 모두 undefined |
| UT-parsePriority-14 | `# Priority\r\nP0\r\n# What\r\nP2` | P0 |
| UT-parsePriority-15 | `# Priority\n#### 메모\nP2` | P2 |
| UT-parsePriority-16 | `# Priority\n<!-- 미완료 P3` | P3 |
| UT-parsePriority-17 | 코드 블록 안에 있는 `# Priority\nP2` | P2 |
| UT-parsePriority-18 | `# Priority\n<!--\n# What\n-->\nP2` | undefined |
| UT-parsePriority-19 | `# Priority\nP<!-- 설명 -->1` | P1 |
| UT-parsePriority-20 | `# Priority` 뒤에 NBSP, 줄바꿈, P0 | P0 |
| UT-parsePriority-21 | `# Priority` 뒤에 U+0085, 줄바꿈, P0 | undefined |
| UT-parsePriority-22 | 숫자 1, 불리언 false | 모두 TypeError |
| UT-parsePriority-23 | `# Priority\n없음\n#Priority\nP0` 또는 두 번째 제목이 `###중요도` | 모두 undefined |
