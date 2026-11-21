---
name: readReport
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/report.mjs]
---

# readReport

유효한 보고서 원본을 반환합니다. 읽기·JSON·계약 오류이면 예외를 발생시킵니다.

## 시그니처

```javascript
export function readReport(path)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| path | string | 없음 | JSON 보고서 파일 경로입니다 |

| 반환 | 의미 |
| --- | --- |
| object | 유효한 보고서 원본을 반환합니다. 읽기·JSON·계약 오류이면 예외를 발생시킵니다. |

## 내부 로직

1. JSON을 읽고 객체·불리언·문자열·목록·0 이상 정수 필드를 검사합니다.
2. 실제 위반은 target·kind·message 문자열을 요구합니다. 미검증은 target·code·reason·message를 요구합니다.
3. reason의 허용 값, 페이지 집계 합계, 미검증의 서로 다른 페이지 수와 상태의 일관성을 검사합니다.
4. checkedTargets를 필수로 요구합니다. 이전 보고서를 빈 미검증이나 검사 완료로 간주하지 않습니다.
5. 조건이 맞지 않으면 같은 버전의 검사기로 다시 생성하라는 오류를 발생시킵니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
readReport(path)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-readReport-01 | 집계가 일치하고 새 필드가 있는 JSON | 원본 보고서 |
| UT-readReport-02 | 미검증 목록·집계·checkedTargets가 없는 JSON | 재생성 안내가 있는 오류 |
