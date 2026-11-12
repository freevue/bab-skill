---
name: visualization
type: feature
issues: [17]
code: [plugins/bab/skills/wiki/SKILL.md, plugins/bab/skills/spec/SKILL.md, plugins/bab/skills/audit/SKILL.md]
---

# 시각화 작성과 대조

에이전트는 질문에 맞는 관점으로 명세를 시각화하고 구현·검증 근거와 대조합니다.

## 구성 유닛

실행 함수 유닛은 없습니다. 이 기능은 다음 구성 스킬의 문서 절차로 수행합니다.

| 구성 스킬 | 역할 |
| --- | --- |
| [wiki](../../plugins/bab/skills/wiki/SKILL.md) | 공통 기준으로 기존 명세의 흐름에 시각화 작성 |
| [spec](../../plugins/bab/skills/spec/SKILL.md) | 빠진 결정 확인과 완료 기준 작성 |
| [audit](../../plugins/bab/skills/audit/SKILL.md) | 그림·표·구현·TC·실행 근거 대조 |

## 흐름

1. 에이전트는 사용자가 확인하려는 질문과 변경 범위를 정합니다.
2. [공통 기준](../../plugins/bab/skills/wiki/references/visualization.md)에서 필요한 관점을 고릅니다. 단순한 작업에 불필요한 그림을 요구하지 않습니다.
3. 대상과 근거를 확인합니다. 읽은 명세, 코드의 경로·커밋 또는 실행 환경·기록을 표시합니다.
4. spec은 기대 동작의 빠진 결정을 질문합니다. 이슈의 완료 기준을 적고 wiki나 구현을 먼저 바꾸지 않습니다.
5. wiki는 기존 기능의 흐름에 그림과 대응하는 표·문장을 작성합니다. 함수·타입 계약은 해당 페이지로 연결합니다.
6. UI 기능이면 [UI 패턴](../../plugins/bab/skills/wiki/references/ui-async-pattern.md)의 상태표·상태도·유닛·TC를 대응시킵니다.
7. audit은 상태·전이·조건과 역방향 누락을 대조합니다. 구현·관측이 기대와 다르면 근거와 영향, 필요한 조치를 보고합니다.
8. 실행하지 않은 동작은 미검증으로 남깁니다. 그림 표시와 문서 확인은 실제 화면 실행과 구분합니다.

## 관련 정책

| 정책 | 규칙 |
| --- | --- |
| [시각화](../policy/visualization.md) | POL-visualization-01~10 |

## TC

| ID | 조건 | 동작 | 기대 결과 |
| --- | --- | --- | --- |
| FT-visualization-01 | 검색 기능을 여러 관점으로 설명 | 관점별 예시 작성 | 시나리오·상태·실행·통신·값·의존·영향·검증을 구분 |
| FT-visualization-02 | 실행 근거 없이 명세와 코드만 제공 | 근거 표시 | 명세와 코드 해석을 구분하고 실행 관측을 주장하지 않음 |
| FT-visualization-03 | 여러 상태가 있는 검색 UI | 기능 흐름 작성 | 전이·조건·유닛·TC가 대응하고 늦은 응답·취소 경로를 포함 |
| FT-visualization-04 | Mermaid를 표시하지 않는 환경 | 명세 읽기 | 표와 문장으로 같은 조건·결과를 확인 |
| FT-visualization-05 | 재시도·취소 조건이 빠진 요청 | spec 작성 | 빠진 결정을 질문하고 제품 동작을 추측해서 확정하지 않음 |
| FT-visualization-06 | 그림과 표의 조건·전이가 다름 | audit | 위치·근거·영향·필요한 조치를 보고하고 파일을 보존 |
| FT-visualization-07 | 담당 유닛·TC 연결이 끊어짐 | audit | 누락을 보고하고 연결이 있다고 추측하지 않음 |
| FT-visualization-08 | 그림은 일치하나 실행 근거 없음 | audit | 문서 일치와 미검증 동작을 구분 |
| FT-visualization-09 | 정적인 화면 문구 변경 | 관점 선택 | 불필요한 그림과 여덟 관점의 일괄 작성을 요구하지 않음 |

이 TC는 스킬 적용 결과로 확인합니다. 문서의 문장 일치 검사로 동작 통과를 주장하지 않습니다.
