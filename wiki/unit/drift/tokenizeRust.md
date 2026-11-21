---
name: tokenizeRust
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/rust-scan.mjs]
---

# tokenizeRust

Rust 소스를 주석·문자열 경계를 보존한 토큰 목록으로 읽습니다.

## 시그니처

```javascript
export function tokenizeRust(text)
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| text | string | 없음 | 검사할 소스 원문 |

| 반환 | 의미 |
| --- | --- |
| object | Rust 소스를 주석·문자열 경계를 보존한 토큰 목록으로 읽습니다. 오류는 error 또는 featureError에 기록합니다. |

## 내부 로직

1. 공백과 한 줄·중첩 블록 주석을 건너뜁니다.
2. 문자열·raw string·문자와 수명 토큰을 구분합니다.
3. 식별자·구분자·화살표를 시작·끝 위치와 함께 모읍니다.
4. 닫히지 않은 리터럴·주석이면 오류를 반환합니다.

입출력 레코드와 지원 범위는 [기능 계약](../../feature/drift-language-support.md#rust-지원-범위)을 따릅니다.
Rust 판독 결과의 functions·types는 이름을 키로 한 Map입니다. 각 값은 signature·public과 params·returnType 또는 fields를 담습니다.
usedNames는 직접 호출 이름의 Set입니다. tokenizeRust는 value·start·end 토큰 배열과 error를 반환합니다.
syntaxFor는 extract·call·fields 함수를 반환합니다.

## 사용법

```javascript
tokenizeRust(text)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | Rust 판독과 언어별 대조 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-tokenizeRust-01 | 지원 선언과 표 | 정확한 선언과 항목 반환 |
| UT-tokenizeRust-02 | 경계 문법과 지원 밖 선언 | 가짜 선언 제외 또는 미검증 |
