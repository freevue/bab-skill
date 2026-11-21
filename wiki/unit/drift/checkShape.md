---
name: checkShape
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/detect.mjs]
---

# checkShape

지원 언어 페이지 하나를 받아 선언의 실제 위반 목록을 반환하는 함수를 돌려줍니다.

## 시그니처

```javascript
export const checkShape = (readSource) =>
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| readSource | function | 없음 | 코드 경로를 소스 또는 undefined로 바꾸는 함수입니다 |

| 반환 | 의미 |
| --- | --- |
| function | 지원 언어 페이지 하나를 받아 선언의 실제 위반 목록을 반환하는 함수를 돌려줍니다. |

## 내부 로직

1. 호출자는 언어 판정과 파일 존재 검사를 마친 unit·type 페이지만 전달합니다.
2. 명세의 첫 시그니처·정의 블록에서 해당 이름의 선언을 추출합니다. 없으면 명세 선언 누락을 보고합니다.
3. code 파일이 없으면 코드에 없음으로 보고합니다.
4. 실제 export가 없으면 코드에 없음, 정규화한 선언이 다르면 불일치를 반환합니다. 같으면 빈 목록입니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
const useCheckShape = checkShape(input)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-checkShape-01 | 지원 선언과 같은 코드 | 빈 위반 목록 |
| UT-checkShape-02 | 지원 선언과 다른 코드 | 정규화한 양쪽 선언이 있는 불일치 |
