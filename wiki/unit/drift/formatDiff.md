---
name: formatDiff
type: unit
module: plugins/bab/ci
issues: [24]
code: [plugins/bab/ci/drift-diff.mjs]
---

# formatDiff

실제 위반·미검증·기존 위반·검사 범위를 구분한 Markdown을 반환합니다.

## 시그니처

```javascript
export function formatDiff(result)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| result | string | 없음 | introduced·resolved·unchanged와 head의 상태·집계·미검증 목록입니다 |

| 반환 | 의미 |
| --- | --- |
| object | 실제 위반·미검증·기존 위반·검사 범위를 구분한 Markdown을 반환합니다. |

## 내부 로직

1. 새 위반이 있으면 그 대상과 진단을 표시합니다.
2. 미검증 목록과 집계를 표시하고 전체 형상 일치로 표현하지 않습니다.
3. 대상이 없으면 검사 대상 없음, 기존 위반만 남으면 새 위반 없음과 기존 위반 수를 표시합니다.
4. 보호된 대상을 제외한 실제 해소 항목만 표시합니다. 테스트 미실행·동작 의미 미검증을 명시합니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
formatDiff(result)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-formatDiff-01 | 미검증 1페이지인 비교 결과 | 미검증 범위 표시와 전체 일치 표현 없음 |
| UT-formatDiff-02 | 검사 대상 없음 | 검사 대상 없음과 실행 한계 표시 |
