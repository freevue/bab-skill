---
name: diffDrift
type: unit
module: plugins/bab/ci
issues: [24]
code: [plugins/bab/ci/drift-diff.mjs]
---

# diffDrift

target·kind·message가 같은 항목을 기준으로 introduced·resolved·unchanged를 반환합니다.

## 시그니처

```javascript
export function diffDrift(baseItems, headItems)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| baseItems | object[] | 없음 | 기준 버전의 실제 위반입니다 |
| headItems | object[] | 없음 | 결과 버전의 실제 위반입니다 |

| 반환 | 의미 |
| --- | --- |
| object | target·kind·message가 같은 항목을 기준으로 introduced·resolved·unchanged를 반환합니다. |

## 내부 로직

1. 세 문자열을 NUL 문자로 구분한 키를 만듭니다.
2. head에만 있는 항목, base에만 있는 항목과 양쪽에 있는 항목을 입력 순서대로 나눕니다.
3. 이 함수는 미검증을 실제 위반으로 받지 않습니다. CLI가 미검증 해소 보호를 별도로 적용합니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
diffDrift(baseItems, headItems)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-diffDrift-01 | 동일한 실제 위반 목록 두 개 | unchanged에만 원본 항목 |
| UT-diffDrift-02 | 기준 항목 삭제와 새 항목 추가 | resolved와 introduced 분리 |
