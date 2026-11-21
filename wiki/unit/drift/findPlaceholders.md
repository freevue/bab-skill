---
name: findPlaceholders
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/completeness.mjs]
---

# findPlaceholders

코드 블록·인라인 코드 밖의 템플릿 자리표시를 발견하면 위반 하나를 반환합니다.

## 시그니처

```javascript
export function findPlaceholders(text)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| text | string | 없음 | 페이지 전체 본문입니다 |

| 반환 | 의미 |
| --- | --- |
| object[] | 코드 블록·인라인 코드 밖의 템플릿 자리표시를 발견하면 위반 하나를 반환합니다. |

## 내부 로직

1. 코드 블록과 인라인 코드를 제외합니다.
2. 중괄호로 둘러싼 남은 자리표시의 첫 항목을 보고합니다. 없으면 빈 목록입니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
findPlaceholders(text)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-findPlaceholders-01 | 중괄호가 코드 블록에만 있음 | 빈 목록 |
| UT-findPlaceholders-02 | 본문에 중괄호 자리표시가 남음 | 첫 자리표시 위반 |
