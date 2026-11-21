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
| object | 경로와 페이지 종류에 맞는 선언·표 판독기를 선택합니다. 오류는 error 또는 featureError에 기록합니다. |

## 내부 로직

1. 마지막 확장자가 rs이면 Rust 전용 판독기를 선택합니다.
2. unit·type에 맞게 함수·구조체 판독기를 반환합니다.
3. 그 밖의 지원 경로는 기존 JavaScript·TypeScript 판독기를 반환합니다.

입출력 레코드와 지원 범위는 [기능 계약](../../feature/drift-language-support.md#rust-지원-범위)을 따릅니다.
Rust 판독 결과의 functions·types는 이름을 키로 한 Map입니다. 각 값은 signature·public과 params·returnType 또는 fields를 담습니다.
usedNames는 직접 호출 이름의 Set입니다. tokenizeRust는 value·start·end 토큰 배열과 error를 반환합니다.
syntaxFor는 extract·call·fields 함수를 반환합니다.

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
