---
name: compareRows
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/completeness.mjs]
---

# compareRows

표의 누락·초과·타입 불일치·설명 누락 목록을 반환합니다.

## 시그니처

```javascript
export function compareRows(entries, table, labels)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| entries | object[] | 없음 | 선언에서 읽은 이름과 선택적인 타입입니다 |
| table | object \| undefined | 없음 | 문서 표의 rows입니다 |
| labels | object | 없음 | kind에 진단 이름, 선택적 normalize에 언어별 타입 정규화 함수를 담습니다 |

| 반환 | 의미 |
| --- | --- |
| object[] | 표의 누락·초과·타입 불일치·설명 누락 목록을 반환합니다. |

## 내부 로직

1. 매개변수 이름의 선택·나머지 표기를 정규화합니다.
2. 선언 이름이 없는 행과 표에 없는 선언을 각각 찾습니다.
3. 타입을 읽을 수 있을 때 언어별 normalize로 표를 정규화해 대조합니다. 생략하면 기존 normalizeType을 사용합니다. 마지막 의미 칸이 비었으면 설명 누락을 보고합니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
compareRows(entries, table, labels)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-compareRows-01 | 선언과 같은 이름·타입·의미의 표 | 빈 위반 목록 |
| UT-compareRows-02 | 표에 없는 선언·표의 추가 행·다른 타입 | 각 누락·초과·불일치 진단 |
