---
name: inspectLanguage
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/language.mjs]
---

# inspectLanguage

언어별 코드 해석 가능 여부와 실제 문서 위반·미검증 근거를 반환합니다.

## 시그니처

```javascript
export function inspectLanguage(page)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| page | object | 없음 | 명세의 name·type·text·frontmatter를 담습니다 |

| 반환 | 의미 |
| --- | --- |
| object | 언어별 코드 해석 가능 여부와 실제 문서 위반·미검증 근거를 반환합니다. |

## 내부 로직

1. unit·type 또는 code가 있는 feature만 언어 판정 대상으로 고릅니다.
2. code 경로의 소문자 확장자를 JavaScript·TypeScript·Rust로 분류합니다. 그 밖은 판정 불가입니다.
3. 해당 섹션의 첫 코드 블록 표기를 정규화합니다. 빈 표기는 같은 알려진 구현 언어에서만 추론합니다.
4. 복수 언어이면 mixed-language, 판정 불가이면 unknown-language, Rust이면 unsupported-language를 기록합니다.
5. 단일 구현 언어와 알려진 명세 언어가 다르면 언어 표기 불일치와 language-conflict를 함께 기록합니다.
6. 필수 code 경로·코드 블록 누락은 실제 위반입니다. 미검증은 코드 해석만 중단하며 다른 검사는 유지합니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
inspectLanguage(page)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-inspectLanguage-01 | Rust 코드 블록과 src/lib.rs | unsupported-language, 코드 해석 불가 |
| UT-inspectLanguage-02 | TypeScript 코드 블록과 src/lib.rs | 실제 표기 위반과 language-conflict |
