---
name: sourceReader
type: unit
module: plugins/bab/ci
issues: [24]
code: [plugins/bab/ci/drift-check.mjs]
---

# sourceReader

경로를 받아 정규화한 소스 또는 undefined를 반환하는 함수를 돌려줍니다.

## 시그니처

```javascript
export const sourceReader = (repoRoot) =>
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| repoRoot | string | 없음 | 실제 Git 저장소 루트입니다 |

| 반환 | 의미 |
| --- | --- |
| function | 경로를 받아 정규화한 소스 또는 undefined를 반환하는 함수를 돌려줍니다. |

## 내부 로직

1. 루트의 실제 경로를 고정합니다.
2. 반환한 함수는 절대 경로·루트 이탈·없는 경로·일반 파일이 아닌 경로를 undefined로 처리합니다.
3. 심볼릭 링크의 실제 위치도 루트 내부인지 확인합니다. 유효한 파일은 BOM·줄바꿈을 정규화해 읽습니다.
4. 존재하는 파일을 읽는 중 발생한 권한·입출력 오류는 숨기지 않습니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
const useSourceReader = sourceReader(input)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-sourceReader-01 | 루트 안 일반 파일 | 정규화한 소스 |
| UT-sourceReader-02 | 루트 밖으로 향하는 심볼릭 링크 | undefined |
