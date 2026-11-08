# bab 보완과 유닛 재현 검증

2026-11-07에 네 가지 보완점을 수정했습니다. bab의 이슈 라벨 기능을 wiki로 정리하고, parsePriority를 문서만으로 재현했습니다.

이 기록은 커밋·푸시 전의 로컬 검증 결과입니다.

## 변경 범위

| 분류 | 대상 | 결과 |
| --- | --- | --- |
| 변경 | [spec 스킬](../../plugins/bab/skills/spec/SKILL.md), [가이드](../guide.md) | 재오픈하면 status:proposed 하나로 맞춘 뒤 다시 확정하도록 정리했습니다 |
| 변경 | [spec 스킬의 현황 조회](../../plugins/bab/skills/spec/SKILL.md#작업-2-이슈-확인) | 본문도 읽고 필수 항목을 판정합니다. 결정 코멘트가 필요하면 개별 조회합니다 |
| 변경 | [README 업데이트 안내](../../README.ko.md#업데이트) | Claude Code의 설치 범위와 두 호스트의 고정 태그 변경 절차를 추가했습니다 |
| 변경 | [플러그인 README](../../plugins/bab/README.md) | 설치 묶음 밖을 가리키던 상대 링크 세 곳을 저장소 URL로 바꿨습니다 |
| 추가 | [이슈 라벨 동기화](../../wiki/feature/issue-label-sync.md), [parsePriority](../../wiki/unit/issue/parsePriority.md), [planLabelChanges](../../wiki/unit/issue/planLabelChanges.md) | 기존 기능의 흐름, 유닛 관계, 타입 계약과 TC를 기록했습니다 |
| 변경 | [wiki 스킬](../../plugins/bab/skills/wiki/SKILL.md), [유닛 템플릿](../../plugins/bab/skills/wiki/templates/unit.md) | 실제 JavaScript 선언과 별도의 타입 계약 표를 허용합니다. 선언에 없는 타입 비교는 미검증으로 남깁니다 |
| 추가 | [유닛 테스트](../../test/priority.test.mjs), [기능 테스트](../../test/issue-sync.test.mjs) | wiki의 TC를 회귀 검사에 연결했습니다 |
| 삭제 | 없음 | 기존 기능과 공개 유닛을 제거하지 않았습니다 |

기준 구현은 커밋 e87995b의 issue-sync.mjs입니다. 이번에는 JSDoc에 wiki 경로만 연결했고 실행 로직은 바꾸지 않았습니다. 기존 코드의 첫 문서화이며 연결할 스펙 이슈는 없습니다.

## 문서만으로 재현한 범위

재현 대상은 이슈 본문의 중요도를 읽는 parsePriority입니다. 별도 세션에 다음 7개 파일만 제공했습니다.

- AGENTS.md
- .agent/rules/GEMINI.md
- plugins/bab/skills/setup/assets/claude-section.md
- wiki/index.md
- wiki/unit/issue/parsePriority.md
- wiki/unit/issue/planLabelChanges.md
- wiki/feature/issue-label-sync.md

재현 세션은 기존 코드, 테스트, 이슈, PR과 인터넷을 읽지 않았습니다. 임시 위치에 JavaScript와 Python 구현을 각각 작성했습니다. 두 구현 모두 공개 함수 이름은 parsePriority입니다.

초기 명세에서는 공백 없는 중요도 제목이 반복될 때의 경계가 모호했습니다. 초기 TC 22개는 통과했지만 추가 비교에서 입력 70건이 기존 구현과 달랐습니다.

첫 중요도 제목 뒤부터 다음 중요도 제목 앞까지만 선택하도록 명세를 보완했습니다. UT-parsePriority-23을 추가한 뒤, 이전 재현을 읽지 않은 새 세션에서 다시 구현했습니다.

## 검증 결과

| 검사 | 결과 | 근거와 범위 |
| --- | --- | --- |
| 독립 재현 TC | 두 언어 모두 23개 TC 통과 | 복수 입력과 인수 생략을 포함해 언어별 28회 호출을 확인했습니다 |
| 기존 구현과 결과 비교 | 두 언어 모두 2,043개 입력에서 일치 | TC 세부 입력 27개와 추가 경계 입력 2,016개를 비교했습니다. 예외는 이름을 비교했습니다 |
| 형상 확인 | 일치 | 함수 이름, 언어별 입력·반환 대응, 분기 순서, 외부 호출 없음과 사용처를 확인했습니다 |
| 저장소 회귀 검사 | 56개 통과, 실패·생략 0개 | Node 20.16.0에서 node --test를 실행했습니다 |
| wiki·코드 검사 | 불일치 0건 | drift-check.mjs가 구조, 선언, 표와 구성 관계를 검사했습니다 |
| 변경 스킬 검사 | spec·wiki 모두 통과 | skill-creator의 quick_validate.py를 실행했습니다 |
| 문서 검사 | 변경·추가 문서 12개에서 위반 없음 | prose-check.mjs를 실행했습니다. 코드 예시 밖의 로컬 링크도 확인했습니다 |
| 설치본 문서 링크 | 3곳 모두 HTTP 200 | 플러그인 README가 참조하는 저장소 페이지를 조회했습니다 |

추가 입력은 제목 12종, 줄 경계 7종, 본문 17종을 조합한 1,428건입니다. 여기에 공백 후보 28종, 줄 경계 7종, 배치 3종을 조합한 588건을 더했습니다.

비교 환경은 Node 20.16.0과 Python 3.14.3입니다. JavaScript와 Python의 공백 집합, 줄 경계와 단어 경계 차이도 확인했습니다. null·undefined와 반환값 없음은 Python의 None으로 대응했습니다. 숫자·불리언은 두 언어에서 TypeError가 발생했습니다.

회귀 검사와 wiki 검사는 저장소 루트에서 다시 실행할 수 있습니다.

```bash
node --test
node plugins/bab/ci/drift-check.mjs . --json
```

## 확인하지 않은 범위

재현 성공은 parsePriority 하나와 위 입력 범위에 대한 결과입니다. bab 전체의 재현 가능성이나 모든 문자열의 동등성을 증명하지 않습니다.

선언에 타입이 없는 JavaScript의 정적 타입 비교는 미검증입니다. 입력·반환 계약은 실행 결과로 확인했습니다. 오류 메시지는 계약에 포함하지 않았습니다.

기능 테스트는 가짜 gh 명령으로 호출 인자를 확인했습니다. 실제 GitHub의 이슈 재오픈, 라벨 변경, PR 검증과 원격 CI는 실행하지 않았습니다. 업데이트 명령을 검토했지만 실제 설치 상태는 바꾸지 않았습니다.
