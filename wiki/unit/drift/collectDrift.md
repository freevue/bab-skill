---
name: collectDrift
type: unit
module: plugins/bab/ci
issues: [24]
code: [plugins/bab/ci/drift-check.mjs]
---

# collectDrift

실제 위반·미검증·집계·검사 근거가 있는 전체 보고서를 반환합니다.

## 시그니처

```javascript
export function collectDrift(repoRoot)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표와 기능 계약이 타입·값의 범위입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| repoRoot | string | 없음 | 검사할 저장소 루트입니다 |

| 반환 | 의미 |
| --- | --- |
| object | 실제 위반·미검증·집계·검사 근거가 있는 전체 보고서를 반환합니다. |

## 내부 로직

1. wiki가 없으면 hasIndex가 false인 no-target 보고서를 반환합니다.
2. wiki와 index가 일반 디렉터리·파일이 아니면 인덱스 구조 위반을 반환합니다.
3. 일반 Markdown 페이지와 wiki 구조 위반을 읽고 detectDrift에 전달합니다.
4. 정책·기능·유닛·타입 수와 참고 문서 수를 따로 셉니다. makeReport로 최종 보고서를 만듭니다.
5. 예기치 않은 읽기 오류는 호출자에게 전달합니다. CLI는 이를 코드 2로 처리합니다.

공통 레코드와 허용 값은 [기능 계약](../../feature/drift-language-support.md)을 따릅니다.

## 사용법

```javascript
collectDrift(repoRoot)
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [언어별 드리프트 검사](../../feature/drift-language-support.md) | 기능 흐름의 해당 단계에서 사용합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-collectDrift-01 | 유효한 Rust 유닛·타입 | 두 페이지의 미지원 근거와 incomplete |
| UT-collectDrift-02 | wiki 폴더 없음 | hasIndex false, no-target, 빈 목록 |
