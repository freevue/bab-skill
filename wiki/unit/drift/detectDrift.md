---
name: detectDrift
type: unit
module: plugins/bab/ci/drift
issues: [24]
code: [plugins/bab/ci/drift/detect.mjs]
---

# detectDrift

items·unverified·checkedTargets를 반환합니다. 미지원 소스를 지원 언어 추출기로 해석하지 않습니다.

## 시그니처

```javascript
export function detectDrift({ pages, readSource, structureIssues })
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| `{ pages, readSource, structureIssues }` | object | 없음 | 페이지·소스 읽기 함수·구조 위반을 담습니다 |

| 반환 | 의미 |
| --- | --- |
| object | items·unverified·checkedTargets를 반환합니다. 미지원 소스를 지원 언어 추출기로 해석하지 않습니다. |

## 내부 로직

1. 코드 읽기 결과를 작업 안에서 재사용하고 각 페이지의 언어를 판정합니다.
2. 언어와 관계없이 code 파일 존재와 문서 구조를 검사합니다.
3. 코드 해석이 가능한 페이지에만 선언·파생 표·export·기능 구성 검사를 적용합니다.
4. 모든 페이지의 문서 간 관계와 비어 있는 내용·TC·자리표시를 검사합니다.
5. 실제 위반과 미검증 근거를 나누고 검사 완료 target을 기록합니다. 미검증 wiki·관련 코드 경로는 제외합니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

Rust 경로와 명세 블록은 readRust로 먼저 확인합니다. 지원 밖 문법이면 unsupported-syntax를 기록하고 파생 검사를 중단합니다.
파일 존재·문서 구조 검사는 계속합니다. Rust 기능에서는 featureError도 같은 미검증으로 처리합니다.

## 사용법

```javascript
detectDrift({ pages, readSource, structureIssues })
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-detectDrift-01 | 정상 TypeScript와 Rust 페이지 | 지원 코드 검사와 Rust 미검증 분리 |
| UT-detectDrift-02 | Rust 파일 누락 | 실제 누락과 미검증 근거 보존 |
