<div align="center">
  <img src="docs/assets/bab.svg" width="96" height="96" alt="밥그릇 위에 명세서가 놓인 bab 로고">
  <h1>bab</h1>
  <p>이슈에 바꿀 내용을 정하고, wiki를 기준으로 구현하고, PR에서 검증합니다.</p>
  <p>Claude Code · Codex · GitHub Actions</p>
  <p><a href="https://github.com/freevue/bab-skill/releases/tag/v1.0.2">v1.0.2</a> · <a href="LICENSE">MIT</a></p>
</div>

bab은 Git 저장소에서 쓰는 에이전트 스킬 모음입니다. 이슈, 저장소 안의 `wiki/`, PR을 연결합니다.

| 기록 | 담는 내용 |
| --- | --- |
| GitHub 이슈 | 무엇을 왜 바꿀지, 어떤 결정을 했는지 |
| wiki와 프로젝트 규칙 | 현재 코드가 따라야 할 이름·타입·동작·분기와 작성 규칙 |
| PR | 실제 변경과 완료 기준별 검증 결과 |

함수 명세에는 입력·출력·분기·실패 결과와 테스트 케이스(TC)를 적습니다. 기존 코드를 읽지 않아도 같은 함수를 재현할 수 있어야 합니다.

[설치](#설치) · [빠른 시작](#빠른-시작) · [시각화](#시각화) · [업데이트](#업데이트) · [상세 가이드](docs/guide.md)

## 설치

Git과 Node.js 18 이상이 필요합니다. GitHub 작업에는 인증된 `gh` CLI를 사용합니다. 원격 변경에는 해당 저장소의 쓰기 권한이 필요합니다.

Claude Code에서는 다음 명령을 실행합니다.

```bash
claude plugin marketplace add freevue/bab-skill
claude plugin install bab@bab-skill
```

Codex에서는 플러그인을 지원하는 CLI에서 다음 명령을 실행합니다.

```bash
codex plugin marketplace add freevue/bab-skill
codex plugin add bab@bab-skill
```

대상 프로젝트에서 새 채팅을 열고 `bab:setup`을 실행합니다. Claude Code는 `/bab:setup`으로 호출합니다.
스킬이 보이지 않으면 에이전트를 다시 시작합니다. Codex는 `AGENTS.md`에 지침을 추가합니다. Claude Code는 기존 지침 파일을 사용합니다.

setup은 wiki 골격, 이슈·PR 템플릿과 CI를 준비합니다. 코드 컨벤션과 `GEMINI.md`는 만들지 않습니다.
기존 훅과 충돌하지 않는 Node 프로젝트에서는 Husky 설치 여부를 묻습니다. 동의하면 적절한 기존 검사를 연결하고, 검사가 없으면 물어봅니다.
자세한 조건은 [setup 지침](plugins/bab/skills/setup/SKILL.md)을 읽습니다.

## 빠른 시작

저장소마다 setup을 한 번 실행하고, 변경마다 `spec → sync → PR`을 진행합니다.

| 단계 | 호출 | 결과 |
| --- | --- | --- |
| 준비 | `bab:setup` | 저장소의 wiki·템플릿·CI·지침 준비 |
| 합의 | `bab:spec` | 변경과 완료 기준을 이슈에 기록 |
| 구현 | `bab:sync 12` | 확정된 이슈 #12의 wiki·테스트·코드·audit 진행 |
| 검토 | PR 확인 후 머지 | 실제 변경과 근거 확인. `Closes #12`가 있으면 머지 후 이슈 종료 |

예를 들어 오래된 링크의 페이지 번호를 보정하려면 다음처럼 요청합니다.

```text
bab:spec으로 페이지 번호 보정 스펙을 등록해줘. 중요도는 P1이야.
1보다 작으면 첫 페이지, 마지막보다 크면 마지막 페이지를 보여줘.
항목이 없으면 오류 없이 빈 목록을 반환해줘. 빠진 결정은 물어봐줘.
```

이슈 내용을 확인한 뒤 확정을 요청합니다. 필수 항목이 채워져도 에이전트가 승인 없이 상태를 바꾸지 않습니다.

```text
이슈 #12의 내용에 동의해. bab:spec으로 확정 사유를 기록하고
status:proposed를 status:decided로 바꿔줘.
```

확정된 이슈는 구현과 원격 작업의 범위를 함께 지정합니다.

```text
bab:sync 12로 wiki, 실패 테스트와 구현을 진행해줘.
검증 후 커밋·푸시하고 PR을 열어줘. 완료 기준별 근거와 현재 커밋의 CI를 확인해줘.
```

열린 이슈는 `bab:issues`로 봅니다. `bab:sync next`는 확정된 이슈 하나를 고릅니다.
동작이 바뀌지 않는 오타나 작은 문서 수정은 스펙 이슈 없이 진행하고 PR에 `no-spec`을 붙입니다.
[이슈 상태와 결정 기록](docs/guide.md#상태와-라벨) · [전체 작업 흐름](docs/workflow.md)

## 시각화

복잡한 흐름이나 관계를 확인할 때 필요한 관점만 골라 그립니다. 같은 검색 기능도 질문에 따라 다른 그림이 필요합니다.

| 관점 | 보여주는 정보 |
| --- | --- |
| 시나리오 | 실패 후 재시도에 성공하는 한 경로 |
| 상태 전이 | 대기·로딩·결과·오류 사이의 이동 조건 |
| 코드 실행 | 응답 처리 함수의 분기와 처리 순서 |
| 상호작용 | 화면·API·서비스·DB 사이의 요청과 응답 |
| 데이터 | 검색어와 조회 결과의 변환 |
| 구조·의존 | 화면·함수·타입이 서로 사용하는 관계 |
| 변경 영향 | 응답 타입을 바꿀 때 확인할 함수·화면·테스트 |
| 검증 범위 | TC별 실행 결과와 미검증 항목 |

그림에는 명세 기준·코드 해석·실행 관측 중 어떤 근거인지 적습니다. 코드만 읽었다면 실제 동작은 미검증입니다.
UI 상태도는 상태표·담당 함수·TC와 연결합니다. spec은 빠진 결정을 묻고, audit은 그림과 구현·실행 근거를 대조합니다.

```text
bab:wiki로 검색 기능의 상태표와 상태도를 작성해줘.
재시도·취소·늦은 응답을 포함하고 담당 유닛과 TC를 연결해줘.
```

[작성 기준](plugins/bab/skills/wiki/references/visualization.md) · [여덟 관점의 예시](plugins/bab/skills/wiki/references/visualization-examples.md) · [UI 상태 전이 예시](plugins/bab/skills/wiki/references/ui-async-pattern.md#예시-검색-결과-화면)

## 스킬

| 스킬 | 할 일 |
| --- | --- |
| [setup](plugins/bab/skills/setup/SKILL.md) | 저장소 준비와 기존 설치 비교 |
| [link](plugins/bab/skills/link/SKILL.md) | 저장소 간 담당 영역과 공개 계약 연결 |
| [issues](plugins/bab/skills/issues/SKILL.md) | 이슈를 상태·중요도별 표로 조회 |
| [spec](plugins/bab/skills/spec/SKILL.md) | 스펙 작성·확인과 승인된 상태 변경 |
| [wiki](plugins/bab/skills/wiki/SKILL.md) | 정책·기능·유닛·타입·참고 문서 작성과 시각화 |
| [sync](plugins/bab/skills/sync/SKILL.md) | 확정 이슈의 wiki·테스트·구현·PR 검증 |
| [audit](plugins/bab/skills/audit/SKILL.md) | 명세·코드·이슈·PR 대조 |
| [simple-english](plugins/bab/skills/simple-english/SKILL.md) | 영문 문서를 짧고 분명하게 정리 |

이미 코드가 있다면 `bab:wiki`에 첫 문서화 범위를 지정합니다. 이후 변경은 이슈에서 합의하고 wiki부터 고칩니다.
관련 저장소가 있다면 setup에서 함께 지정하거나 `bab:link`를 실행합니다. [저장소 연결](docs/guide.md#저장소-연결)에서 사용법을 확인합니다.

audit은 파일을 수정하지 않습니다. 요청하면 wiki와 프로젝트 규칙만으로 유닛을 재현합니다.
[parsePriority 명세](wiki/unit/issue/parsePriority.md)와 [재현 검증 기록](docs/verification/parse-priority.md)이 예시입니다.

## 검사 범위

CI는 이슈 연결과 wiki의 누락·선언·관계를 검사합니다. 기본 브랜치 푸시 뒤와 매일 불일치를 찾아 제안 이슈로 남깁니다.
드리프트는 wiki와 코드가 어긋난 상태입니다. 검사기는 테스트나 실제 화면을 실행하지 않습니다.

명세 페이지가 없으면 `status: no-target`입니다. 참고 문서는 별도로 구조를 검사합니다.
`status: pass`도 화면 동작과 내부 로직의 정확성을 증명하지 않습니다. 실제 실행 결과는 PR에서 확인합니다.
이슈·PR·wiki·로그에는 비밀값과 개인정보 원문을 넣지 않습니다.

## 업데이트

Claude Code는 설치 범위를 확인한 뒤 같은 범위로 갱신합니다. 아래는 `user` 범위의 예시입니다.

```bash
claude plugin list --json
claude plugin marketplace update bab-skill
claude plugin update bab@bab-skill --scope user
```

Codex는 마켓플레이스를 갱신하고 플러그인을 다시 추가합니다. 새 채팅에서 사용합니다.

```bash
codex plugin marketplace upgrade bab-skill
codex plugin add bab@bab-skill
```

이전 태그에 고정했다면 고정 태그도 바꿉니다. Claude Code의 `--scope`는 기존 설치 범위를 사용합니다.

```bash
claude plugin marketplace add 'freevue/bab-skill#v1.0.2' --scope local
claude plugin update bab@bab-skill --scope local
```

```bash
codex plugin marketplace remove bab-skill
codex plugin marketplace add freevue/bab-skill --ref v1.0.2
codex plugin add bab@bab-skill
```

플러그인과 GitHub Actions는 따로 갱신합니다. 대상 저장소의 `.github/workflows/bab.yml`에서 `uses`와 `bab-ref`를 모두 `v1.0.2`로 맞춥니다.
setup은 기존 지침과 템플릿을 덮어쓰지 않습니다. 로컬 체크아웃에서 차이를 확인하려면 다음 명령을 실행합니다.

```bash
node plugins/bab/skills/setup/scripts/setup.mjs /대상/저장소 --instructions AGENTS.md --skip-labels --dry-run
```

이전 버전의 파일·이벤트·권한은 [설치 템플릿](plugins/bab/skills/setup/assets/workflows/bab.yml)과 대조합니다.
스킬 이름, 상태 라벨, wiki 문서 종류·필수 섹션과 검사 상태 코드를 호환되지 않게 바꾸면 주 버전을 올립니다.

## 개발과 문서

저장소 테스트는 Node.js 20에서 실행합니다.

```bash
node --test
```

[상세 가이드](docs/guide.md) · [전체 흐름](docs/workflow.md) · [v1.0.2 검증 기록](docs/verification/visualization.md)
