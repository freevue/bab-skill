---
name: double
type: unit
module: src/demo
issues: []
code: [src/demo/double.ts]
---

# double

형상 가드 동작 확인용 테스트 유닛입니다.

## 시그니처

```typescript
export function double(value: number): number
```

## 내부 로직

1. `value`에 2를 곱해 돌려줍니다.

## 사용법

```typescript
double(2)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| 없음 | 테스트용 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-double-01 | 2 | 4 |
