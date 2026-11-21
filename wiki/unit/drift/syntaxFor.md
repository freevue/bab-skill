---
name: syntaxFor
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/syntax.mjs]
---

# syntaxFor

경로와 페이지 종류에 맞는 선언·표 판독기를 선택합니다.

## 시그니처

```javascript
export function syntaxFor(path, type)
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| path | string | 없음 | 검사할 경로 |
| type | string | 없음 | 검사할 명세 종류 |

| 반환 | 의미 |
| --- | --- |
| object | extract·call·fields·normalize 함수를 반환합니다. 오류 레코드를 만들지 않습니다. |

## 내부 로직

1. 마지막 확장자가 rs이면 Rust 전용 판독기를 선택합니다.
2. unit·type에 맞게 함수·구조체 판독기를 반환합니다.
3. 그 밖의 지원 경로는 기존 JavaScript·TypeScript 판독기를 반환합니다.

입출력 레코드와 지원 범위는 [기능 계약](../../feature/drift-language-support.md#rust-지원-범위)을 따릅니다.
| 반환 함수 | 계약 |
| --- | --- |
| extract(text, options) | 이름과 정규화한 선언의 Map입니다. options.exportedOnly는 기본 true입니다 |
| call(signature) | params의 name·type과 returnType을 반환합니다 |
| fields(definition) | name·type 필드 목록을 반환합니다 |
| normalize(text) | 문서 표의 타입을 언어별로 정규화합니다. Rust의 세미콜론·리터럴 내용은 보존합니다 |

호출자는 먼저 언어 판정과 Rust 지원 문법 검사를 수행합니다. 이 함수로 미지원 입력을 지원 언어로 승격하지 않습니다.

## 사용법

```javascript
syntaxFor(path, type)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | Rust 판독과 언어별 대조 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-syntaxFor-01 | 지원 선언과 표 | 정확한 선언과 항목 반환 |
| UT-syntaxFor-02 | 경계 문법과 지원 밖 선언 | 가짜 선언 제외 또는 미검증 |
