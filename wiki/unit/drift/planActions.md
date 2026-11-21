---
name: planActions
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/plan.mjs]
---

# planActions

검사 근거가 있는 대상의 create·update·keep·close·mark·skip 계획을 반환합니다.

## 시그니처

```javascript
export function planActions(items, openIssues, scope = {})
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| items | object[] | 없음 | 실제 위반 목록입니다 |
| openIssues | object[] | 없음 | 번호·본문·라벨을 가진 열린 drift 이슈입니다 |
| scope | object | 빈 객체 | checkedTargets와 protectedTargets를 담습니다. 직접 호출의 기본값은 기존 전체 범위입니다 |

| 반환 | 의미 |
| --- | --- |
| object[] | 검사 근거가 있는 대상의 create·update·keep·close·mark·skip 계획을 반환합니다. |

## 내부 로직

1. scope.checkedTargets가 있으면 그 목록에 있는 대상만 처리합니다. 빈 목록이면 아무 대상도 처리하지 않습니다.
2. scope.protectedTargets의 대상은 항목과 기존 이슈에서 모두 제외해 원문·상태·라벨을 보존합니다.
3. 새 실제 위반을 target별로 묶고 기존 이슈의 검사 표만 갱신합니다. 사람의 결정과 중요도는 보존합니다.
4. 검사 완료 대상의 위반이 없어지면 제안 이슈는 종료하고 다른 상태는 해소 표시만 합니다.
5. 한 번에 새 이슈는 10개까지만 생성하며 나머지는 skip입니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
planActions(items, openIssues, scope)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-planActions-01 | 검사 완료 대상의 해소된 제안 이슈 | close 계획 |
| UT-planActions-02 | 보호 대상과 검사 근거 없는 기존 이슈 | 원격 변경 계획 없음 |
