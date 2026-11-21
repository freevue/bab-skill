# #24 언어별 검사 검증

## 범위와 기준

- 이슈: [#24](https://github.com/freevue/bab-skill/issues/24)
- PR: [#25](https://github.com/freevue/bab-skill/pull/25)
- 기준 커밋: 38f22f2a8355632c8c01923eae8416d4e5b4769f
- 브랜치: codex/24-drift-language-support
- 로컬 환경: Node.js v24.14.0
- 범위: 언어 판정, Rust 선언·표·직접 호출, JSON, 종료 코드, PR 비교와 이슈 보호

사용자의 최종 업데이트 요청에 따라 이전 Rust 제외 결정을 대체했습니다.
wiki → 실패 테스트 → 구현 순서로 진행했습니다.

## 검증 계획과 결과

| 검사 | 결과와 근거 |
| --- | --- |
| 기존 기준선 | 73개 통과 |
| 최초 미검증 계약의 실패 재현 | 새 회귀 25개 실패 확인 |
| 이전 준비 버전 | Node 20.20.2에서 109개 통과. 아래 이전 기록을 유지합니다 |
| Rust 구현 전 | 새 Rust 회귀 28개 실패 확인 |
| 간접 호출 재현 | 매개변수·변수·별칭 가림·괄호 호출 4개 실패 확인 후 수정 |
| 배열 타입 구분 재현 | 세미콜론을 쉼표로 오인하는 1개 실패 확인 후 Rust 전용 정규화로 수정 |
| 최종 로컬 회귀 | 145개 통과, 실패·건너뜀 0개 |
| Rust 문법 표본 컴파일 | rustc 1.99.1·edition 2024로 함수·구조체 대표 표본 통과. 사용하지 않은 함수 경고 1건 |
| 전체 형상 검사 | 32페이지 검사, 실제 위반·미검증 0건, 코드 0 |
| 문서 기반 기능 | code: []로 보정하고 구성 스킬 링크·TC 보존 |
| CI 셸 | 실제 workflow 셸에서 입력 오류 2와 미검증 4 처리 확인 |
| 이슈 보호 | gh 대역으로 미검증·미확인 이슈 보존과 검사 완료 대상만 종료 확인 |

```bash
node --test
node plugins/bab/skills/audit/scripts/wiki-check.mjs wiki
node plugins/bab/ci/drift-check.mjs . --json
```

## 완료 기준별 근거

| 기준 | TC |
| --- | --- |
| 언어 판정·별칭·충돌·혼합·미검증 우선순위 | FT-drift-language-01~10 |
| 입력·JSON·CI·기존 이슈 보호 | FT-drift-language-11~18 |
| Rust 선언·제네릭·수명·where·함수 한정자 | FT-drift-language-19~20 |
| 중첩 주석·raw string·문자·내부 선언 제외 | FT-drift-language-21 |
| Rust 구조체·필드·표·공개 선언 누락 | FT-drift-language-22~23, 28 |
| 지원 밖 문법·중복 이름·잘린 입력 보호 | FT-drift-language-24 |
| 다른 페이지의 TypeScript·Rust 검사 | FT-drift-language-25 |
| 직접 호출·단순 use 별칭의 구성 대조 | FT-drift-language-26 |
| 공백·주석·끝 쉼표 정규화 | FT-drift-language-27 |
| 간접 호출·매크로·메서드의 미검증 | FT-drift-language-29 |
| Rust 배열 타입의 구분자 보존 | FT-drift-language-30 |

보고서의 checkedTargets는 이슈 해소의 근거가 있는 경로입니다.
미검증 wiki와 관련 코드는 제외합니다. 이전 JSON은 새 버전으로 다시 생성해야 합니다.

## 의미 대조와 한계

로컬 룰·wiki·실제 코드·이슈 완료 기준을 읽고 대조했습니다.
지원 범위와 미검증 보호, 문서 절차·소스 코드의 경계를 확인했습니다.
같은 입력의 성공 기록은 audit에서 재사용합니다.

형상 검사는 Rust 컴파일·타입 검사·동작 검증을 대신하지 않습니다.
Seed 원본 사례 전체와 실제 GitHub drift 이슈의 생성·종료는 미검증입니다.
CI 셸과 원격 변경 분기는 독립 표본·gh 대역으로 검증했습니다.
사용자의 앱에 설치된 플러그인 갱신은 별도이며 이번 게시 검증과 구분합니다.

## 원격 CI

이전 준비 커밋 59d443399e5a34f9828e95882e3c4c01df0f1b3d는 [Node 20.20.2 회귀 109개](https://github.com/freevue/bab-skill/actions/runs/44880640586)를 통과했습니다.
최종 Rust 변경의 현재 커밋 결과는 [PR Checks](https://github.com/freevue/bab-skill/pull/25/checks)에서 확인합니다.
태그 게시 전 PR 가드는 v1.1.0을 사용합니다. 새 검사기의 로컬 형상 검사와 Node 20 회귀를 별도로 확인합니다.

## 게시와 CI 전환

[Rust 구현 CI](https://github.com/freevue/bab-skill/actions/runs/44886203851)는 커밋 cec1b3c0985e309532ada84e468aae246cc4428a에서 Node 20.20.2로 145개를 통과했습니다.
실패·건너뜀은 0개입니다. PR 가드와 이슈 게이트도 통과했습니다.
PR #25의 머지 커밋 cb205c9ecaf284a18c7cc80de8787a27da3a8af5는 검사한 커밋과 같은 Git tree입니다.

[v2.0.0 태그와 정식 릴리스](https://github.com/freevue/bab-skill/releases/tag/v2.0.0)를 해당 머지 커밋에 게시했습니다.
공개 ZIP을 다시 내려받아 로컬 아카이브와 바이트가 같은지 확인했습니다.
플러그인 파일 67개가 일치하며 두 manifest는 2.0.0입니다. Rust 모듈 4개와 v2.0.0 setup 템플릿을 포함합니다.
공개 ZIP의 SHA-256은 b263158e49fb69ebc4813c0a78f16f1aa6d259ad38f89fd7aba6b8c955f1c9b7입니다.

태그가 존재한 뒤 저장소 자체 CI의 uses·bab-ref를 v2.0.0으로 전환합니다.
이 변경은 검사기 코드·TC·명세를 바꾸지 않습니다. 로컬 145개 실행 기록은 재사용합니다.
전환 PR에서는 v2.0.0 검사기로 base·head 형상 검사를 수행하고 현재 커밋의 Node 20 CI도 확인합니다.
사용자의 Codex·Claude Code에 설치된 플러그인은 이번 작업에서 변경하지 않았습니다.


[v2.0.0 전환 PR #26](https://github.com/freevue/bab-skill/pull/26)을 머지했습니다.
커밋 f8b84af154d2c1e7579dd5160742bd979d52d6dc에서 [실제 v2.0.0 가드](https://github.com/freevue/bab-skill/actions/runs/44886438408)가 32페이지를 대조했습니다.
새 불일치·미검증 없이 통과했습니다. [Node 20.20.2 회귀](https://github.com/freevue/bab-skill/actions/runs/44886438409)도 145개 통과, 실패·건너뜀 0개입니다.
자체 CI 참조 전환 뒤 main은 882a717caa9682ee5a91a017a6f06a957df7e89c입니다.
마지막 문서 보완은 syntaxFor가 반환하는 normalize와 언어별 타입 구분자 보존 계약을 명시합니다. 런타임 코드는 바꾸지 않습니다.
