---
name: checkUndocumentedExports
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/detect.mjs]
---

# checkUndocumentedExports

지원 언어 코드에서 명세가 없는 export의 위반 목록을 반환합니다.

## 시그니처

```javascript
export function checkUndocumentedExports(pages, readSource, codePages = pages)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| pages | object[] | 없음 | 이름이 문서화되었는지 확인할 모든 페이지입니다 |
| readSource | function | 없음 | 코드 경로를 읽습니다 |
| codePages | object[] | pages | 코드 해석이 가능한 페이지이며 기본값은 pages입니다 |

| 반환 | 의미 |
| --- | --- |
| object[] | 지원 언어 코드에서 명세가 없는 export의 위반 목록을 반환합니다. |

## 내부 로직

1. 전체 pages에서 유닛·타입 이름을 각각 모읍니다.
2. codePages의 유닛·타입이 가리키는 코드 파일만 중복 없이 읽습니다.
3. 함수·타입 export에서 전체 문서의 이름을 제외합니다. 없는 이름을 페이지 없는 export로 반환합니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

Rust 선언은 syntaxFor로 선택한 전용 판독기로 처리합니다. JavaScript·TypeScript 선언은 기존 판독기를 사용합니다.

## 사용법

```javascript
checkUndocumentedExports(pages, readSource, codePages)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-checkUndocumentedExports-01 | 기존 문서에 있는 이름과 지원 코드 | 빈 위반 목록 |
| UT-checkUndocumentedExports-02 | 지원 코드의 문서 없는 export | 페이지 없는 export |
