---
name: makeReport
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/report.mjs]
---

# makeReport

미검증 페이지 수와 검사 완료 페이지 수, 집계 상태를 포함한 새 보고서를 반환합니다.

## 시그니처

```javascript
export function makeReport(report)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| report | object | 없음 | hasIndex·pageCount·referenceCount·items·unverified·checkedTargets를 담습니다 |

| 반환 | 의미 |
| --- | --- |
| object | 미검증 페이지 수와 검사 완료 페이지 수, 집계 상태를 포함한 새 보고서를 반환합니다. |

## 내부 로직

1. 입력의 실제 위반과 미검증 목록을 보존합니다.
2. 서로 다른 미검증 target의 수를 unverifiedPageCount로 셉니다. checkedPageCount는 pageCount에서 이 값을 뺍니다.
3. items가 있으면 fail, 미검증만 있으면 incomplete, 명세가 없으면 no-target, 나머지는 pass로 정합니다.
4. checkedTargets는 실제로 검사한 wiki·코드 경로와 확인한 실제 위반의 대상입니다. 미검증 대상은 제외합니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
makeReport(report)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-makeReport-01 | 명세 2개, Rust 미검증 1개 | incomplete, 검사 완료 1개·미검증 1개 |
| UT-makeReport-02 | 실제 위반과 Rust 미검증 | fail이며 미검증 목록 유지 |
