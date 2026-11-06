<div align="center">
  <img src="docs/assets/bab.svg" width="104" height="104" alt="밥그릇 위에 놓인 명세서 모양의 bab 로고">
  <h1>bab</h1>
  <p>이슈에서 합의하고, wiki에 명세를 쓰고, PR에서 확인합니다.</p>
  <p>
    <a href="https://github.com/freevue/bab-skill/releases/tag/v0.7.5">v0.7.5 릴리스</a>
    · <a href="docs/workflow.md">스킬과 흐름도</a>
    · <a href="docs/guide.md">상세 가이드</a>
    · <a href="docs/guide.md#라이선스">MIT</a>
  </p>
  <a href="https://github.com/freevue/bab-skill/actions/workflows/test.yml">
    <img src="https://github.com/freevue/bab-skill/actions/workflows/test.yml/badge.svg?branch=main" alt="bab 회귀 테스트 상태">
  </a>
</div>

## bab은 무엇인가요?

bab은 AI 코딩 에이전트가 GitHub 이슈에서 확정한 스펙을 구현하도록 돕는 스킬 모음입니다. Claude Code와 Codex에서 같은 wiki 템플릿과 검사기를 사용합니다. 어떤 이유로 코드를 바꿨고 무엇으로 검증했는지 저장소에서 다시 찾을 수 있습니다.

| 기록 | 남기는 것 |
| --- | --- |
| GitHub 이슈 | 왜, 무엇을, 어떻게 바꿀지에 대한 합의와 완료 기준 |
| 저장소의 wiki | 코드가 따라야 하는 정책, 기능, 함수와 타입의 명세, 테스트 케이스(TC) |
| PR | 변경한 문서와 코드, 테스트 결과, 리뷰 기록 |

wiki는 코드가 따라야 할 기준입니다. wiki와 코드가 어긋나면 합의된 명세에 맞춰 코드를 수정합니다. 기존 프로젝트에 처음 도입할 때만 [코드에서 wiki를 시작할 수 있습니다](docs/guide.md#이미-코드가-많은-프로젝트에도-적용할-수-있나요).

[설치](#설치) · [빠른 시작](#빠른-시작) · [전체 흐름](#전체-흐름) · [스킬](#스킬) · [CI 가드레일](#ci-가드레일)

## 설치

Git과 Node 18 이상이 필요합니다. GitHub에서 이슈나 PR을 읽으려면 인증된 `gh` CLI가 필요합니다. 이슈, 라벨, PR을 바꾸려면 대상 저장소의 쓰기 권한도 필요합니다.

### Claude Code

```bash
claude plugin marketplace add freevue/bab-skill
claude plugin install bab@bab-skill
```

대상 저장소에서 Claude Code를 열고 `/bab:setup`을 실행합니다. 셋업은 기존 지침 파일을 사용합니다. 지침 파일이 없으면 `CLAUDE.md`를 만듭니다.

### Codex

플러그인 명령을 지원하는 Codex CLI에서 마켓플레이스를 등록하고 bab을 설치합니다.

```bash
codex plugin marketplace add freevue/bab-skill
codex plugin add bab@bab-skill
```

Codex 지원이 포함된 로컬 체크아웃에서 설치하려면 그 루트에서 첫 명령을 `codex plugin marketplace add "$PWD"`로 바꿉니다. 스킬, 템플릿, 검사기가 함께 설치됩니다. 태그로 고정할 때는 Codex 마켓플레이스가 들어 있는 태그를 선택합니다.

대상 저장소에서 새 Codex 채팅을 열고 스킬 선택기에서 `bab:setup`을 고릅니다. 셋업은 `AGENTS.md`에 bab 지침을 추가합니다. 목록에 나타나지 않으면 Codex를 다시 시작합니다.

다른 에이전트에서는 [Node 스크립트와 스킬 문서를 직접 사용합니다](docs/guide.md#다른-에이전트에서-쓰기).

## 빠른 시작

1. 대상 Git 저장소에서 bab setup을 실행합니다. wiki 골격, 이슈·PR 템플릿과 CI를 준비합니다. GitHub 라벨도 설치하려면 요청에 포함합니다.
2. bab spec에 스펙 등록을 요청합니다. 예를 들어 “목록에서 범위를 넘는 페이지 번호는 마지막 페이지로 보내 줘”라고 입력합니다.
3. 이슈 코멘트에 합의한 근거를 남기고 `status:decided`로 확정합니다. [이슈 본문 예시](docs/guide.md#스펙-예시)를 참고합니다.
4. 이슈 번호가 12라면 bab sync로 진행합니다. 에이전트는 wiki, 테스트, 코드를 순서대로 작성합니다. 푸시나 PR이 필요하면 요청에 포함합니다.
5. PR에서 명세와 검증 결과를 리뷰합니다. `Closes #12`를 적은 PR이 기본 브랜치에 머지되면 이슈가 완료됩니다.

Claude Code에서는 `/bab:sync 12`를 입력합니다. Codex에서는 `bab:sync`를 선택하고 “이슈 #12를 검증하고 PR까지 올려 줘”라고 요청합니다. 큐에서 다음 작업을 고르려면 두 환경 모두 이슈 번호 대신 `next`를 사용합니다.

## 전체 흐름

```mermaid
flowchart LR
  issue["이슈 · 스펙 확정"] --> wiki["wiki · 명세 작성"]
  wiki --> test["TC · 실패 테스트 확인"]
  test --> code["코드 · 구현 및 검증"]
  code --> pr["PR · 리뷰 및 머지"]
```

예를 들어 전체가 3페이지일 때 `?page=9`로 접속하면 3페이지를 보여 주기로 합의합니다. 이 동작을 wiki의 TC로 적고, 테스트가 먼저 실패하는지 확인합니다. 코드를 맞춘 뒤 테스트를 다시 실행하고 결과를 PR에 남깁니다.

에이전트는 승인된 범위에서 PR을 엽니다. 머지는 저장소의 리뷰와 권한 규칙을 따릅니다.

## 스킬

[스킬과 흐름도](docs/workflow.md)에서 스킬 6개의 역할과 이슈 등록부터 머지까지의 순서를 확인할 수 있습니다.

## CI 가드레일

| 기능 | GitHub Actions에서 하는 일 |
| --- | --- |
| PR 검사 | 실제 이슈 연결과 확정 상태를 확인합니다. wiki의 누락이나 코드와의 불일치가 이번 PR에서 새로 생겼는지도 봅니다 |
| 이슈 라벨 | 본문의 중요도를 라벨에 반영하고, 닫힌 이슈의 상태 라벨을 제거합니다 |
| 드리프트 감시 | 기본 브랜치 푸시 뒤와 매일 wiki와 코드의 불일치를 찾아 이슈로 기록합니다 |

bab의 최종 검증은 [문서 완결성](docs/guide.md#문서-완결성)과 형상 일치입니다. 예를 들어 함수의 매개변수와 반환 타입이 wiki에 빠짐없이 적혔는지 봅니다. 실제 동작은 대상 저장소의 테스트로 검증합니다.

[가드레일 설정](docs/guide.md#ci-가드레일) · [드리프트 감시](docs/guide.md#드리프트-감시) · [스펙 큐](docs/guide.md#스펙-큐) · [현재 한계](docs/guide.md#현재-한계)

## 업데이트

Claude Code:

```bash
claude plugin marketplace update bab-skill
claude plugin update bab@bab-skill
```

Codex의 Git 마켓플레이스:

```bash
codex plugin marketplace upgrade bab-skill
codex plugin add bab@bab-skill
```

로컬 마켓플레이스를 쓴다면 체크아웃을 갱신하고 `codex plugin add bab@bab-skill`을 다시 실행합니다.

플러그인 업데이트와 GitHub Actions 업데이트는 별개입니다. 이미 bab을 적용한 저장소에서는 `.github/workflows/bab.yml`의 `uses`와 `bab-ref`를 같은 릴리스 태그로 맞춥니다. v0.7.3 이하에서 올릴 때는 이슈 재검사가 동작하도록 [설치 템플릿](plugins/bab/skills/setup/assets/workflows/bab.yml)의 이벤트와 권한도 반영합니다. 셋업은 기존 파일을 덮어쓰지 않습니다.

bab 자체를 개발한다면 [코드 컨벤션 적용 기준](docs/guide.md#코드-컨벤션-적용-기준)을 읽고, 저장소 루트에서 Node 20으로 `node --test`를 실행합니다.
