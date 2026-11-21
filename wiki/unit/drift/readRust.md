---
name: readRust
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/rust.mjs]
---

# readRust

지원 범위의 최상위 Rust 선언과 직접 호출을 읽습니다.

## 시그니처

```javascript
export function readRust(text)
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| text | string | 없음 | 검사할 소스 원문 |

| 반환 | 의미 |
| --- | --- |
| object | 지원 범위의 최상위 Rust 선언과 직접 호출을 읽습니다. 오류는 error 또는 featureError에 기록합니다. |

## 내부 로직

1. 전용 토큰 판독기로 주석·리터럴 경계를 읽습니다.
2. 최상위 공개 범위·속성·함수·구조체를 순서대로 읽습니다.
3. 함수 선언·매개변수·반환형과 구조체 선언·필드를 정규화합니다.
4. 함수 본문의 내부 선언은 공개 선언에서 제외합니다.
5. 지원 밖 항목·패턴·중복 이름과 닫히지 않은 구분자는 error로 반환합니다.
6. 직접 호출 이름을 모읍니다. 미지원 기능 관계는 featureError로 반환합니다.

입출력 레코드와 지원 범위는 [기능 계약](../../feature/drift-language-support.md#rust-지원-범위)을 따릅니다.
Rust 판독 결과의 functions·types는 이름을 키로 한 Map입니다. 각 값은 signature·public과 params·returnType 또는 fields를 담습니다.
usedNames는 직접 호출 이름의 Set입니다. tokenizeRust는 value·start·end 토큰 배열과 error를 반환합니다.
syntaxFor는 extract·call·fields 함수를 반환합니다.

## 사용법

```javascript
readRust(text)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | Rust 판독과 언어별 대조 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-readRust-01 | 지원 선언과 표 | 정확한 선언과 항목 반환 |
| UT-readRust-02 | 경계 문법과 지원 밖 선언 | 가짜 선언 제외 또는 미검증 |
