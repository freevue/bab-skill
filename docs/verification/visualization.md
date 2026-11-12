# 시각화 적용 검증 기록

관련 스펙은 [#17](https://github.com/freevue/bab-skill/issues/17)입니다. 검증일은 2026-11-12입니다.
명세는 [시각화 정책](../../wiki/policy/visualization.md)과 [기능 TC](../../wiki/feature/visualization.md)에 있습니다.

## 로컬 검사

| 검사 | 결과 |
| --- | --- |
| Node 20의 `test/*.test.mjs` | 기존 회귀 73개 통과, 실패 0개 |
| 로컬 기본 `node --test` | 96개 통과. 기존 임시 재현 폴더의 테스트 23개가 추가로 발견됨 |
| wiki 드리프트 | 명세 8개 검사, 불일치 0개 |
| wiki·spec·audit 스킬 형식 | 세 스킬 통과 |
| Claude 플러그인 manifest | 통과 |
| 변경 문서의 문장 검사 | 위반 없음 |
| Mermaid 표시 | 공통 예시 7개, UI 상태도 1개와 독립 작성 결과 1개를 PNG로 렌더링하고 표시 확인 |

Node 20과 Mermaid CLI는 임시 실행 도구로 사용했습니다. 프로젝트의 의존성이나 잠금 파일을 추가하지 않았습니다.
Mermaid CLI 12.2.0과 로컬 Google Chrome으로 표시를 확인했습니다. GitHub나 에이전트별 표시 결과를 전부 검사한 것은 아닙니다.
처음 표시 검사에서 한글 상태 별칭의 문법 오류를 발견했습니다. 표시 이름을 큰따옴표로 묶은 뒤 여덟 그림이 모두 렌더링됐습니다.
보완한 지침으로 독립 작성한 상태도도 별도로 렌더링했습니다. 표시 확인은 총 아홉 그림입니다.
[Mermaid CLI 공식 사용법](https://github.com/mermaid-js/mermaid-cli#usage)에 따라 Markdown 안의 그림을 변환했습니다.

```bash
npm exec --yes --package=node@20 -- node --test test/*.test.mjs
node plugins/bab/ci/drift-check.mjs . --json
python3 <skill-creator 경로>/scripts/quick_validate.py plugins/bab/skills/wiki
python3 <skill-creator 경로>/scripts/quick_validate.py plugins/bab/skills/spec
python3 <skill-creator 경로>/scripts/quick_validate.py plugins/bab/skills/audit
claude plugin validate plugins/bab
```

## 독립 적용

skill-creator의 독립 적용 지침에 따라 두 평가 에이전트가 실제 스킬 문서를 읽고 가상 요청을 수행했습니다.
작성 평가에는 wiki·spec의 경로와 사용자 요청만 전달했습니다. audit 평가에는 기준 경로와 입력 문서만 전달했습니다.
의도한 답과 찾을 문제 목록은 전달하지 않았습니다. 평가 대상 제품을 구현하거나 실제 화면을 실행하지 않았습니다.

| TC | 적용 입력 | 관측한 결과 |
| --- | --- | --- |
| FT-visualization-01 | 검색 예시와 관점 선택 요청 | 여덟 예시의 차이를 확인. 네 추가 요청을 코드 실행·상호작용·데이터·변경 영향으로 구분하고 필요한 근거를 답함 |
| FT-visualization-02 | 구현·실행 기록 없는 가상 요청 | 가상 명세와 예정 함수·TC를 표시하고 실행을 미검증으로 구분 |
| FT-visualization-03~04 | 검색 UI의 상태표·그림·TC 작성 | 명확한 입력으로 다시 적용. 로딩 중 취소·모든 상태의 늦은 응답을 표·그림·유닛·TC에 연결하고 그림 없이도 조건·결과 확인 |
| FT-visualization-05 | 재시도·취소 조건을 정하지 않은 spec 요청 | 검색어, 출발·도착 상태와 늦은 응답 처리를 질문. 이슈 등록·wiki 변경 없음 |
| FT-visualization-06~07 | 표와 그림·구성·TC가 다른 문서 | 아래 다섯 문제를 찾음. 대상 문서의 SHA-256이 검사 전후 같음 |
| FT-visualization-08 | 내부 관계가 일치하나 실행 근거가 없는 문서 | 문서 위반 없음과 실제 동작 미검증을 구분. 구현·화면 실행의 통과를 주장하지 않음 |
| FT-visualization-09 | 상태가 바뀌지 않는 안내 문구 수정 | 상태도와 여덟 관점의 일괄 작성을 요구하지 않음 |

audit에 제공한 문서에서 관측한 결과는 다음과 같습니다.

| 입력의 문제 | audit 결과 |
| --- | --- |
| 표·TC는 오류에서 로딩, 그림은 오류에서 대기 | 재시도 전이 불일치 High |
| 표의 로딩 중 취소가 그림에 없음 | 취소 전이 누락 High |
| 표는 모든 상태의 늦은 응답을 무시, 그림은 로딩에만 적용 | 적용 상태 범위 불일치 High |
| 상태표의 cancelSearch가 구성 유닛에 없음 | 담당 유닛 누락 Medium |
| 상태표의 FT-sample-05가 TC에 없음 | TC 연결 누락 Medium |

불일치 입력의 SHA-256은 `8cab3002d36eb8b95904e31ba6e64028d7c7b0ad59b2b3fd30d79b47780bfa32`였습니다.
새 문서에서 관계를 일치시킨 뒤 별도로 audit했습니다. 확인한 문서 범위의 위반 없음과 동작 미검증을 보고했습니다.
작성 적용의 첫 spec 초안에서 `Type`을 템플릿 외의 값으로 적었습니다. 기존 네 값을 고르도록 참조를 보완한 뒤 `개선`으로 작성됐습니다.
초기 wiki 요청의 취소 출발 상태가 모호해 초안·미정으로 남았습니다. 출발 상태를 명시한 새 요청으로 완성된 전이를 다시 확인했습니다.
스킬 적용은 자연어 요청에 대한 표본 평가입니다. 모든 입력에서 같은 판단을 한다는 보장은 아닙니다.

## 문서 정리와 한계

README는 설치, 첫 작업, 시각화, 업데이트 순서로 정리했습니다. 긴 반복 예시와 세부 규칙은 기존 가이드로 연결했습니다.
두 README의 합계는 정리 전 631줄에서 203줄로 줄었습니다.
한국어 본문을 README.md에 모으고 README.ko.md의 설치·사용 예시·업데이트 진입 링크를 유지했습니다.
기존 MIT 라이선스 파일의 내용은 바꾸지 않았습니다. 기존 사용자 문서 수정도 이번 정리에 반영했습니다.

이 변경은 작성·검토 지침입니다. 시뮬레이터, 자동 그림 생성기와 의미 판정기는 추가하지 않았습니다.
실제 검색 제품의 기능 TC, 화면 접근성·반응형 배치와 취소·응답 경합은 실행하지 않았습니다.
PR의 현재 커밋 CI와 배포 패키지 확인 결과는 릴리스 기록에 남깁니다.
