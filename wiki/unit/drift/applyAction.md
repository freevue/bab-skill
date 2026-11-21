---
name: applyAction
type: unit
module: plugins/bab/ci
issues: [24]
code: [plugins/bab/ci/drift-report.mjs]
---

# applyAction

계획 하나를 gh 명령으로 적용하는 함수를 반환합니다.

## 시그니처

```javascript
export const applyAction = (repository) =>
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| repository | string | 없음 | 확인한 OWNER/REPO입니다 |

| 반환 | 의미 |
| --- | --- |
| function | 계획 하나를 gh 명령으로 적용하는 함수를 반환합니다. |

## 내부 로직

1. create는 고정된 drift·P2·제안 라벨과 본문으로 이슈를 생성합니다.
2. update·mark는 본문만 갱신합니다. mark는 해소 코멘트를 함께 남깁니다.
3. close는 완료 사유·해소 코멘트와 상태 라벨 제거를 수행합니다.
4. keep·skip는 원격을 변경하지 않습니다. GitHub 오류는 호출자에게 전달합니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
const useApplyAction = applyAction(input)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-applyAction-01 | 종료 계획과 GitHub 테스트 대역 | 완료 종료와 상태 라벨 제거 명령 |
| UT-applyAction-02 | keep·skip 계획 | GitHub 쓰기 명령 없음 |
