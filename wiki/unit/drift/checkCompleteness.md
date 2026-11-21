---
name: checkCompleteness
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/completeness.mjs]
---

# checkCompleteness

문서 완결성 위반 목록을 반환합니다. parseCode가 false이면 선언 해석만 제외합니다.

## 시그니처

```javascript
export function checkCompleteness(page, parseCode = true)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| page | object | 없음 | 검사할 페이지입니다 |
| parseCode | boolean | true | 선언에서 파생하는 검사를 수행할지 정합니다. 기본값은 true입니다 |

| 반환 | 의미 |
| --- | --- |
| object[] | 문서 완결성 위반 목록을 반환합니다. parseCode가 false이면 선언 해석만 제외합니다. |

## 내부 로직

1. 알 수 없는 페이지 분류이면 빈 목록을 반환합니다.
2. unit의 내부 로직·사용법·TC, feature의 유닛 링크·TC, policy의 규칙, reference의 내용·출처는 계속 검사합니다.
3. parseCode가 true일 때만 선언에서 매개변수·반환·필드를 읽어 표와 대조합니다.
4. 분류와 관계없이 코드 밖의 자리표시도 검사합니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

Rust 선언은 syntaxFor로 선택한 전용 판독기로 처리합니다. JavaScript·TypeScript 선언은 기존 판독기를 사용합니다.

## 사용법

```javascript
checkCompleteness(page, parseCode)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-checkCompleteness-01 | 필수 내용이 있는 미지원 페이지와 parseCode false | 코드 해석 없이 문서 내용 검사 |
| UT-checkCompleteness-02 | 내부 로직·TC가 없는 미지원 유닛 | 내부 로직·TC 누락 |
