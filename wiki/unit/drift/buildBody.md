---
name: buildBody
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/plan.mjs]
---

# buildBody

기존 이슈 템플릿과 드리프트 식별 마커가 있는 본문을 반환합니다.

## 시그니처

```javascript
export function buildBody(target, items)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| target | string | 없음 | 확인한 실제 위반의 대상입니다 |
| items | object[] | 없음 | 실제 위반 목록입니다 |

| 반환 | 의미 |
| --- | --- |
| string | 기존 이슈 템플릿과 드리프트 식별 마커가 있는 본문을 반환합니다. |

## 내부 로직

1. target을 식별 마커에 기록합니다. wiki 경로가 아니면 Wiki는 wiki/index.md를 사용합니다.
2. 실제 위반 표와 해결 방향 체크리스트, P2와 완료 기준을 생성합니다.
3. 미검증은 이 함수에 실제 위반으로 전달하지 않습니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
buildBody(target, items)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-buildBody-01 | wiki/a.md와 실제 위반 | 식별 마커·완료 기준이 있는 본문 |
| UT-buildBody-02 | src/a.ts 대상 | Wiki 경로는 wiki/index.md |
