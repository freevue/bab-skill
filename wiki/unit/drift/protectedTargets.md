---
name: protectedTargets
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/report.mjs]
---

# protectedTargets

미검증 wiki 경로와 관련 코드 경로를 중복 없는 Set으로 반환합니다.

## 시그니처

```javascript
export function protectedTargets(unverified)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| unverified | object[] | 없음 | target·code를 담은 미검증 목록입니다 |

| 반환 | 의미 |
| --- | --- |
| Set<string> | 미검증 wiki 경로와 관련 코드 경로를 중복 없는 Set으로 반환합니다. |

## 내부 로직

1. 각 기록의 target과 code 경로를 순서대로 모읍니다.
2. 중복을 제거하며 원래 기록은 바꾸지 않습니다. 빈 목록은 빈 Set입니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
protectedTargets(unverified)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-protectedTargets-01 | wiki/a.md와 src/lib.rs가 반복된 미검증 목록 | 두 경로가 한 번씩 있는 Set |
| UT-protectedTargets-02 | 빈 미검증 목록 | 빈 Set |
