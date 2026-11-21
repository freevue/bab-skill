---
name: drift-language-support
type: feature
issues: [24]
code: [plugins/bab/ci/drift-check.mjs, plugins/bab/ci/drift-diff.mjs, plugins/bab/ci/drift-report.mjs, plugins/bab/ci/drift/completeness.mjs, plugins/bab/ci/drift/detect.mjs, plugins/bab/ci/drift/language.mjs, plugins/bab/ci/drift/plan.mjs, plugins/bab/ci/drift/report.mjs]
---

# 언어별 드리프트 검사

미지원 언어를 실제 선언 누락으로 오인하지 않고 검사 범위와 종료 코드를 보고합니다.

## 구성 유닛

| 유닛 | 역할 |
| --- | --- |
| [inspectLanguage](../unit/drift/inspectLanguage.md) | 언어별 코드 해석 가능 여부와 실제 문서 위반·미검증 근거를 반환합니다. |
| [makeReport](../unit/drift/makeReport.md) | 미검증 페이지 수와 검사 완료 페이지 수, 집계 상태를 포함한 새 보고서를 반환합니다. |
| [protectedTargets](../unit/drift/protectedTargets.md) | 미검증 wiki 경로와 관련 코드 경로를 중복 없는 Set으로 반환합니다. |
| [readReport](../unit/drift/readReport.md) | 유효한 보고서 원본을 반환합니다. 읽기·JSON·계약 오류이면 예외를 발생시킵니다. |
| [sourceReader](../unit/drift/sourceReader.md) | 경로를 받아 정규화한 소스 또는 undefined를 반환하는 함수를 돌려줍니다. |
| [collectDrift](../unit/drift/collectDrift.md) | 실제 위반·미검증·집계·검사 근거가 있는 전체 보고서를 반환합니다. |
| [checkShape](../unit/drift/checkShape.md) | 지원 언어 페이지 하나를 받아 선언의 실제 위반 목록을 반환하는 함수를 돌려줍니다. |
| [checkUndocumentedExports](../unit/drift/checkUndocumentedExports.md) | 지원 언어 코드에서 명세가 없는 export의 위반 목록을 반환합니다. |
| [detectDrift](../unit/drift/detectDrift.md) | items·unverified·checkedTargets를 반환합니다. 미지원 소스를 지원 언어 추출기로 해석하지 않습니다. |
| [compareRows](../unit/drift/compareRows.md) | 표의 누락·초과·타입 불일치·설명 누락 목록을 반환합니다. |
| [findPlaceholders](../unit/drift/findPlaceholders.md) | 코드 블록·인라인 코드 밖의 템플릿 자리표시를 발견하면 위반 하나를 반환합니다. |
| [checkCompleteness](../unit/drift/checkCompleteness.md) | 문서 완결성 위반 목록을 반환합니다. parseCode가 false이면 선언 해석만 제외합니다. |
| [diffDrift](../unit/drift/diffDrift.md) | target·kind·message가 같은 항목을 기준으로 introduced·resolved·unchanged를 반환합니다. |
| [formatDiff](../unit/drift/formatDiff.md) | 실제 위반·미검증·기존 위반·검사 범위를 구분한 Markdown을 반환합니다. |
| [buildBody](../unit/drift/buildBody.md) | 기존 이슈 템플릿과 드리프트 식별 마커가 있는 본문을 반환합니다. |
| [planActions](../unit/drift/planActions.md) | 검사 근거가 있는 대상의 create·update·keep·close·mark·skip 계획을 반환합니다. |
| [applyAction](../unit/drift/applyAction.md) | 계획 하나를 gh 명령으로 적용하는 함수를 반환합니다. |

## 흐름

1. collectDrift가 wiki 구조와 페이지를 읽습니다.
2. detectDrift가 언어·파일 존재·문서·코드를 검사합니다.
3. makeReport가 범위와 상태를 집계합니다.
4. PR 비교는 검증한 실제 위반만 비교하고 미검증 대상의 해소를 막습니다.
5. 이슈 감시는 checkedTargets로 확인한 범위에서만 동기화합니다.

### 언어 판정 기준

언어 판정은 unit·type 페이지와 code가 지정된 feature 페이지의 코드 해석에 적용합니다.
정책·참고 문서의 문서 검사는 현재 범위를 유지합니다.

실제 구현 언어는 code 경로의 확장자로 판정합니다.
확장자와 코드 블록의 언어 표기는 비교할 때 앞뒤 공백을 제거하고 소문자로 정규화합니다.
경로 원문과 대소문자는 파일 존재 검사에서 유지합니다.

| code 경로의 확장자 | 구현 언어 | 이번 자동 대조 |
| --- | --- | --- |
| `.js`, `.mjs`, `.cjs`, `.jsx` | `javascript` | 기존 선언 문법 범위에서 수행합니다 |
| `.ts`, `.mts`, `.cts`, `.tsx` | `typescript` | 기존 선언 문법 범위에서 수행합니다 |
| `.rs` | `rust` | 미지원으로 보고합니다 |
| 그 밖의 확장자 또는 확장자 없음 | 판정 불가 | 미검증으로 보고합니다 |

`.d.ts`처럼 마지막 확장자가 `.ts`인 경로는 TypeScript로 판정합니다.
클래스·재export 등 기존에 읽지 못하는 선언의 지원 범위는 이번에 넓히지 않습니다.
소스 내용, package 설정이나 저장소의 주 언어로 구현 언어를 추측하지 않습니다.

명세 언어는 `## 시그니처` 또는 `## 정의`의 첫 코드 블록에서 읽습니다.
feature의 코드 사용 관계 검사는 코드 블록 표기를 요구하지 않습니다.

| 코드 블록의 언어 표기 | 정규화한 명세 언어 |
| --- | --- |
| `js`, `javascript`, `jsx` | `javascript` |
| `ts`, `typescript`, `tsx` | `typescript` |
| `rs`, `rust` | `rust` |
| 표기 없음 | 모든 code 경로가 같은 알려진 언어이면 그 언어를 사용합니다 |
| 그 밖의 표기 | 명세 언어 판정 불가로 보고합니다 |

code 경로가 하나이거나 모두 같은 구현 언어이면 다음 규칙을 적용합니다.

- 알려진 구현 언어와 알려진 명세 언어가 다르면 `언어 표기 불일치`를 실제 문서 위반으로 보고합니다.
- 언어가 일치하고 JavaScript·TypeScript이면 기존 추출기와 대조 규칙을 적용합니다.
- 언어가 일치하고 Rust이면 `unsupported-language`로 형상 대조를 미검증 처리합니다.
- 구현 언어를 판정하지 못하면 `unknown-language`로 보고합니다. 코드 블록 표기로 지원 언어로 승격하지 않습니다.
- 명세 언어 표기를 읽지 못하면 `unknown-language`로 보고합니다. 언어 표기가 없는 경우의 확장자 추론과 구분합니다.

한 페이지의 code 경로가 서로 다른 알려진 언어를 가리키면 `mixed-language`로 보고합니다.
이 경우에는 그 페이지의 코드 해석을 미검증 처리합니다.
코드 블록과 일부 경로만 골라 대조하지 않습니다.
판정 불가 경로도 섞여 있으면 해당 경로의 `unknown-language` 근거도 남깁니다.
서로 다른 페이지가 서로 다른 언어를 쓰는 경우에는 각 페이지를 독립적으로 검사합니다.

필수 섹션·코드 블록·code 경로가 없으면 기존 문서 구조 위반으로 보고합니다.
code 파일이 없으면 언어와 관계없이 `코드에 없음`으로 보고합니다.
파일이 존재하지만 권한·입출력 문제로 읽지 못하면 입력·실행 오류로 종료합니다.

미지원·판정 불가·언어 혼합·언어 표기 불일치에서는 코드 해석을 중단합니다.
선언 대조와 선언에서 파생한 매개변수·반환형·필드 대조를 건너뛴 근거를 남깁니다.
페이지 없는 export와 기능 구성의 코드 사용 관계도 같은 언어 판정을 적용합니다.
문서 구조·필수 내용·문서 간 링크·파일 존재 검사는 계속합니다.
다른 지원 언어 페이지의 검사는 계속합니다.

### JSON과 집계 상태

`items`에는 실제 문서 위반, 파일 누락과 지원 범위에서 확인한 코드 불일치를 기록합니다.
미검증은 별도 `unverified` 목록에 기록합니다.
각 미검증 기록에는 `target`, `code`, `reason`, `message`를 넣습니다.
`target`은 wiki 페이지 경로이며 `code`는 관련 코드 경로 목록입니다.
`message`에는 판정에 사용한 확장자와 언어 표기를 남깁니다.

`reason`은 `unsupported-language`, `unknown-language`, `mixed-language`, `language-conflict` 중 하나입니다.
언어 표기 불일치는 `items`의 실제 위반과 `language-conflict` 미검증 근거를 함께 남깁니다.
실제 위반을 발견해도 남은 미검증 근거를 삭제하지 않습니다.
미검증 원인이 여러 개이면 근거를 각각 남기고 페이지 수는 한 번만 셉니다.

기존 `pageCount`는 정책·기능·유닛·타입 명세의 전체 페이지 수로 유지합니다.
`referenceCount`는 참고 문서 수로 유지합니다.
`unverifiedPageCount`는 `unverified`에 등장하는 서로 다른 명세 페이지 수입니다.
`checkedPageCount`는 `pageCount`에서 `unverifiedPageCount`를 뺀 값입니다.
검사 완료 페이지에도 실제 위반이 있을 수 있습니다.
참고 문서 수는 두 명세 집계에 더하지 않습니다.

정상적으로 생성한 보고서에는 새 목록과 집계를 빈 값인 경우에도 포함합니다.
목록·집계가 빠진 이전 JSON이나 집계가 맞지 않는 JSON은 소비하지 않습니다.
소비자는 입력 오류로 종료하고 같은 버전의 검사기로 보고서를 다시 생성하도록 안내합니다.

### drift-check 종료 코드

아래 코드 0~3의 기존 의미를 유지하고 미검증 코드 4를 추가합니다.
여러 조건이 있으면 `2 → 1 → 4 → 3 → 0` 순서로 판정합니다.

| 종료 코드 | status | 조건 |
| --- | --- | --- |
| `0` | `pass` | 명세 페이지가 있고 실제 위반과 미검증이 없습니다 |
| `1` | `fail` | 실제 문서 위반·파일 누락·코드 불일치가 있습니다 |
| `2` | 유효한 검사 보고서 없음 | 인자·경로 오류나 예기치 않은 읽기·실행 오류가 있습니다 |
| `3` | `no-target` | 명세 페이지가 0건이며 구조 위반과 미검증이 없습니다 |
| `4` | `incomplete` | 실제 위반은 없지만 미검증이 한 건 이상 있습니다 |

참고 문서만 있고 구조가 정상이면 기존처럼 코드 3입니다.
실제 위반과 미검증이 함께 있으면 코드 1이며 미검증 목록도 보존합니다.
입력·실행 오류가 발생하면 표준 오류에 원인을 남깁니다.
일부 출력이 있어도 코드 2를 정상 보고서로 소비하지 않습니다.

### drift-diff와 CI 판정

| 종료 코드 | PR 비교 결과 |
| --- | --- |
| `0` | 새 실제 위반과 head의 미검증이 없습니다 |
| `1` | 새 실제 위반이 있거나 기존 인덱스·명세 전체 삭제 보호 규칙에 걸립니다 |
| `2` | 인자·JSON·보고서 계약·읽기·실행 오류가 있습니다 |
| `4` | 새 실제 위반은 없지만 head에 미검증이 있습니다 |

판정 우선순위는 `2 → 1 → 4 → 0`입니다.
기존부터 같은 미검증 항목이 있어도 head에 남아 있으면 코드 4입니다.
이 규칙은 미검증 명세가 남아 있는 저장소의 다른 PR에도 적용합니다.
미검증을 기존 불일치 허용 규칙으로 제외하지 않습니다.
반면 기존 실제 위반만 있고 새 위반과 미검증이 없으면 기존처럼 코드 0을 유지합니다.
이때 요약에는 기존 위반이 남았음을 표시합니다.
코드 0만으로 전체 형상 검증 완료를 주장하지 않습니다.

base와 head 모두 검사 대상이 없으면 기존처럼 코드 0과 `검사 대상 없음`을 보고합니다.
명세 전체 삭제 보호 규칙은 이 경우보다 먼저 적용합니다.
drift-diff는 코드 3을 사용하지 않습니다.

미검증 target과 관련 code 경로의 기존 항목을 해소 목록에 넣지 않습니다.
JSON과 요약에 실제 위반, 미검증과 검사 범위를 각각 표시합니다.
CI는 drift-check의 코드 0·1·3·4에서 생성한 유효한 JSON만 비교기로 전달합니다.
코드 2나 유효하지 않은 JSON은 즉시 중단합니다.
`파일이 비어 있지 않음`만으로 입력·실행 오류를 무시하지 않습니다.
최종 PR 검사에서 코드 1·2·4는 모두 성공이 아닙니다.
audit도 `incomplete`와 미검증 목록을 전체 검증 완료 근거로 사용하지 않습니다.

### 드리프트 이슈 감시

미검증만으로 실제 드리프트 이슈를 생성하지 않습니다.
미검증 target과 관련 code 경로를 가리키는 기존 이슈는 본문·상태·라벨을 유지합니다.
이 대상에는 자동 종료와 해소 코멘트도 남기지 않습니다.
검사 근거가 없는 기존 대상도 해소로 추측하지 않습니다.
검사를 완료한 다른 대상의 실제 위반과 해소는 기존 규칙으로 동기화합니다.
미검증 대상에서 확인한 구조 위반이나 파일 누락은 JSON과 CI 결과에 계속 표시합니다.

drift-report의 종료 코드는 형상 일치가 아닌 이슈 동기화 결과를 나타냅니다.

| 종료 코드 | 이슈 동기화 결과 |
| --- | --- |
| `0` | 동기화를 완료했거나 기존의 검사 대상 없음 규칙으로 건너뛰었습니다 |
| `1` | 인덱스 구조 위반으로 안전한 동기화 범위를 확인하지 못해 변경을 건너뛰었습니다 |
| `2` | 인자·JSON·보고서 계약·읽기·GitHub API 오류가 발생했습니다 |
| `4` | 미검증 대상을 보존하고 검사 완료 범위만 동기화했습니다 |

입력·실행 오류와 안전한 범위 확인 실패를 코드 4보다 먼저 처리합니다.
drift-report는 코드 3을 사용하지 않습니다.
코드 0을 형상 검증 성공으로 사용하지 않습니다.

### 필수 회귀 사례

PR 비교는 별도 표기가 없으면 위반이 없는 base에서 시작한 것으로 봅니다.

| 사례 | drift-check | drift-diff |
| --- | --- | --- |
| 유효한 TypeScript, 코드 블록 언어 표기 없음 | `0` | `0` |
| 유효한 Rust fn·struct와 `.rs` 경로 | `4` | `4` |
| Rust와 코드 블록 언어 표기 없음 | `4` | `4` |
| `.rs` 경로와 `typescript` 코드 블록 | `1` | `1` |
| 확장자 없는 코드와 `typescript` 코드 블록 | `4` | `4` |
| 미지원 코드의 실제 파일 누락 | `1` | `1` |
| 한 명세 페이지의 TypeScript·Rust 경로 혼합 | `4` | `4` |
| 서로 다른 TypeScript 정상 페이지와 Rust 페이지 | `4` | `4` |
| 새 TypeScript 불일치와 Rust 페이지 | `1` | `1` |
| 기존 그대로인 TypeScript 불일치와 Rust 페이지 | `1` | `4` |
| 참고 문서만 있고 구조 정상 | `3` | `0` |
| 기존 `wiki/` 디렉터리 전체를 삭제한 head | `3` | `1` |
| 인자·입력·실행 오류 | `2` | `2` |

입력·실행 오류 행은 각 도구가 받는 입력과 실행 조건에 적용합니다.
미지원 표본을 실제 선언 누락으로 보고하지 않는지 함께 검사합니다.
미검증에 실제 오류가 가려지지 않는지도 검사합니다.
언어 표기 별칭·대소문자, 미인식 표기와 미등록 확장자를 검사합니다.
JSON 집계, 요약 문구와 실제 종료 코드를 함께 검사합니다.
CI가 코드 2를 무시하지 않고 코드 4를 성공으로 바꾸지 않는지 검사합니다.
기존 드리프트 이슈가 유지되고 다른 검사 완료 대상만 동기화되는지 검사합니다.
Rust 파서가 추가되지 않았는지도 확인합니다.


### 검사 근거 경로

보고서에 `checkedTargets` 문자열 목록을 추가합니다.
검사한 wiki 페이지·참고 문서·인덱스와 읽은 지원 코드 경로를 넣습니다.
확인한 실제 위반의 target도 넣습니다.
미검증 target과 관련 code 경로는 이 목록에서 제외합니다.
이 목록은 페이지 집계와 별개인 이슈 해소의 근거입니다.
소비자는 목록 누락·중복·빈 경로를 입력 오류로 거부합니다.
이슈 감시는 목록에 없는 기존 이슈를 보존합니다.

## 관련 정책

| 정책 | 규칙 |
| --- | --- |
| [언어별 형상 검사](../policy/drift-language-support.md) | POL-drift-language-01~10 |

## TC

| ID | 조건 | 동작 | 기대 결과 |
| --- | --- | --- | --- |
| FT-drift-language-01 | Rust unit·type | 전체 CLI 검사 | 코드 4, 미지원 2페이지, 선언 누락 0건 |
| FT-drift-language-02 | 지원 언어 표기 생략·별칭·대소문자 | 전체 CLI 검사 | 확장자로 판정하고 코드 0 |
| FT-drift-language-03 | Rust와 TypeScript 코드 블록 | 전체 CLI 검사 | 실제 표기 충돌과 language-conflict, 코드 1 |
| FT-drift-language-04 | 무확장자·미등록 확장자·미인식 표기 | 전체 CLI 검사 | unknown-language와 코드 4 |
| FT-drift-language-05 | 한 페이지의 언어 혼합 | 전체 CLI 검사 | mixed-language와 코드 4 |
| FT-drift-language-06 | 정상 TypeScript와 Rust | 전체 CLI 검사·PR 비교 | 지원 범위 검사, 미검증 보존, 두 CLI 코드 4 |
| FT-drift-language-07 | 새 TypeScript 불일치와 Rust | 전체 CLI 검사·PR 비교 | 두 CLI 코드 1, 미검증 근거도 보존 |
| FT-drift-language-08 | 기존 TypeScript 불일치와 Rust | PR 비교 | 코드 4, 기존 위반과 미검증 구분 |
| FT-drift-language-09 | 미지원 파일 누락·문서 내용 누락 | 전체 CLI 검사 | 실제 위반 코드 1 |
| FT-drift-language-10 | 미지원 코드의 가짜 JS 선언 | 전체 CLI 검사 | JS 추출기·파생 표·기능 구성 대조를 수행하지 않음 |
| FT-drift-language-11 | 잘못된 인자·파일 읽기·JSON | CLI 실행 | 코드 2와 원인, 원격 변경 없음 |
| FT-drift-language-12 | 이전 JSON·잘못된 집계 | PR 비교·이슈 감시 | 코드 2와 재생성 안내 |
| FT-drift-language-13 | 미검증 wiki·코드 대상의 기존 이슈 | 이슈 감시 | 본문·상태·라벨 유지, 원격 갱신 0회, 코드 4 |
| FT-drift-language-14 | 다른 검사 완료 대상의 실제 해소 | 이슈 감시 | 해당 이슈만 종료, 검사 근거 없는 이슈는 유지 |
| FT-drift-language-15 | 비어 있지 않은 JSON과 검사 코드 2 | 실제 CI 셸 실행 | 비교기 호출 전에 코드 2로 중단 |
| FT-drift-language-16 | 검사 코드 4 | 실제 CI 셸 실행 | PR 검사가 성공으로 바뀌지 않음 |
| FT-drift-language-17 | 참고 문서만 존재·wiki 전체 삭제 | CLI·PR 비교 | check는 3, 비교는 각각 0·1 |
| FT-drift-language-18 | 지원 언어의 주석·문자열 속 선언 | 기존 회귀 검사 | 실제 export로 인정하지 않음 |

[실행 검증 기록](../../docs/verification/drift-language.md)에 환경·실행 결과·미검증 범위를 구분합니다.
