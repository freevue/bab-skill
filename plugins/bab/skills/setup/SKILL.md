---
name: setup
description: 사용자가 bab 셋업을 요청하면 대상 Git 저장소에 wiki 골격, GitHub 템플릿과 워크플로, 에이전트 지침을 설치합니다. 승인된 경우 GitHub 라벨을 설치하고, Node 프로젝트에서는 Husky Git 훅을 선택할 수 있게 합니다.
disable-model-invocation: true
---

# bab setup

현재 저장소에 bab을 설치합니다. `scripts/setup.mjs`가 파일과 지침을 준비합니다. 에이전트는 실행 결과를 확인해 보고합니다. 다시 실행하면 이미 있는 파일은 유지합니다.

## 절차

1. `git rev-parse --show-toplevel`로 저장소 루트를 찾습니다. git 저장소가 아니면 중단하고 보고합니다.
2. 사용할 지침 파일을 고릅니다. Codex와 일반 에이전트는 `--instructions AGENTS.md`를 씁니다. Claude Code는 이 옵션을 생략해 기존 선택 순서를 따릅니다. 사용자가 파일을 지정하면 그 파일을 따릅니다.
3. GitHub 라벨 설치도 승인된 경우에만 `gh repo view --json nameWithOwner,viewerPermission`으로 원격과 쓰기 권한을 확인합니다. 해당 원격을 확인할 수 없거나 라벨 설치가 승인되지 않았으면 `--skip-labels`를 붙입니다.
4. 같은 옵션으로 먼저 `--dry-run`을 실행합니다. 오류가 없으면 이 옵션을 빼고 실행합니다. 라벨을 설치할 때는 확인한 `OWNER/REPO`를 `GH_REPO`로 지정합니다.

```bash
node <이 스킬 폴더>/scripts/setup.mjs <저장소 루트> [--instructions AGENTS.md|CLAUDE.md] [--skip-labels] [--dry-run]
```

5. `차이 있음`인 파일과 지침 섹션은 기존 내용과 원본(`assets/`)을 비교합니다. CI 호출 버전의 `uses`와 `bab-ref`도 확인합니다. 차이를 설명하고 기존 파일은 유지합니다.
6. 대상 저장소가 Node 프로젝트이면 아래 Husky 선택 절차를 진행합니다.
7. 아래 보고 규칙에 따라 전체 결과를 전합니다.

지침 파일을 생략하면 기존 `CLAUDE.md`, 기존 `AGENTS.md` 순으로 고릅니다. 둘 다 없으면 `CLAUDE.md`를 만듭니다.

두 에이전트를 함께 쓰는 저장소에서는 두 지침 파일이 기존 공통 규칙 문서를 참조하도록 안내합니다. 셋업은 프로젝트의 코드 컨벤션을 선택하거나 설치하지 않습니다.

종료 코드 `0`은 성공, `1`은 안전하지 않은 경로나 라벨 설치 실패, `2`는 경로나 옵션 오류입니다. 대상 파일이나 상위 폴더가 심볼릭 링크이면 파일이나 라벨을 만들기 전에 중단합니다.

## 선택 사항: Husky Git 훅

이 질문은 `bab:setup`을 호출한 에이전트가 합니다. `setup.mjs`를 직접 실행하면 질문이나 패키지 설치 없이 기본 파일만 준비합니다. GitHub Actions는 Husky 선택과 관계없이 유지합니다.

1. 저장소 루트에 `package.json`이 없으면 Husky를 제안하지 않습니다. 다른 패키지 폴더의 훅도 바꾸지 않습니다.
2. `package.json`의 의존성과 `prepare` 스크립트, `.husky/`와 기존 Git 훅 경로를 확인합니다. Husky가 이미 있으면 설치 여부를 다시 묻지 않습니다. 현재 `pre-commit`과 `pre-push`의 유무만 보고하고 기존 파일을 유지합니다.
3. Husky가 없고 다른 훅과 충돌하지 않으면 묻습니다. "이 저장소에 Husky를 설치하고 `pre-commit`과 `pre-push` 검사를 설정할까요? 기존 검사 명령을 확인해 훅에 연결하겠습니다." 사용자가 거절하면 설치하지 않고 결과에 기록합니다.
4. 사용자가 동의하면 잠금 파일과 `packageManager` 값으로 패키지 관리자를 확인합니다. 기존 `lint`·형식 검사·테스트·CI 명령에서 빠른 읽기 전용 검사를 `pre-commit`에, 푸시 전에 필요한 검사를 `pre-push`에 고릅니다. 적절한 명령이 없으면 임의의 빈 훅을 만들지 말고 실행할 검사를 사용자에게 묻습니다.
5. [Husky 공식 설치 절차](https://typicode.github.io/husky/get-started.html)에 따라 프로젝트의 개발 의존성으로 설치합니다. 기존 `prepare` 스크립트가 있으면 이를 덮어쓰는 `husky init` 대신 [수동 설치 절차](https://typicode.github.io/husky/how-to.html#manual-setup)를 따릅니다. 기존 훅을 덮어쓰지 않습니다. 다른 Git 훅 경로가 설정돼 있으면 변경하기 전에 충돌과 필요한 조치를 보고합니다.
6. 새 훅에 적은 명령을 실행해 결과를 확인합니다. 실행할 수 없는 검사는 이유와 함께 미검증으로 보고합니다.

## 설치 항목

| 원본 (`assets/`) | 대상 (저장소 루트 기준) | 이미 있을 때 |
| --- | --- | --- |
| `ISSUE_TEMPLATE/spec.md` | `.github/ISSUE_TEMPLATE/spec.md` | 유지. 내용이 다르면 `차이 있음` |
| `pull_request_template.md` | `.github/pull_request_template.md` | 유지. 내용이 다르면 `차이 있음` |
| `workflows/bab.yml` | `.github/workflows/bab.yml` (CI 가드레일 호출) | 유지. 내용이 다르면 `차이 있음` |
| `wiki/index.md`, `wiki/log.md` | `wiki/index.md`, `wiki/log.md` | 유지 |
| (원본 없음) | `wiki/policy/`, `wiki/feature/`, `wiki/unit/`, `wiki/type/` + `.gitkeep` | 유지 |
| `claude-section.md` | 선택한 `AGENTS.md` 또는 `CLAUDE.md` 끝에 추가 | `## bab (SDD/AIDD)` 제목이 있으면 원본과 비교하고 유지 |
| `labels.json` | GitHub 라벨 10개 (`no-spec`, `drift`, `blocked` 포함) | `gh label create --force`로 색과 설명만 맞춤 |

## 하지 않는 일

- 커밋, 푸시, 브랜치 생성을 하지 않습니다. 결과를 보여 주고 커밋은 사용자에게 맡깁니다.
- 기존 코드의 wiki 문서화는 하지 않습니다. 필요하면 [bab wiki](../wiki/SKILL.md)의 ingest 모드를 안내합니다.

## 보고

[공통 브리핑 규칙](assets/claude-section.md#최종-브리핑)을 따릅니다. 생성·유지·차이가 있는 파일을 요약합니다. 라벨과 Husky 훅을 설치했는지, 훅 검사를 실행했는지 밝힙니다.
플러그인 버전과 CI 호출 버전이 다르면 두 값을 함께 적습니다. 기존 지침과 템플릿은 자동으로 덮어쓰지 않습니다.

예시:

```text
bab 셋업을 마쳤습니다. wiki 골격과 CI 워크플로를 만들고 AGENTS.md에 지침을 추가했습니다.

기존 PR 템플릿에는 Verification 섹션이 없어 파일을 유지했습니다. 새 검증 표는 설치 템플릿에서 확인할 수 있습니다.

라벨 설치는 생략했습니다. 기존 코드를 wiki로 옮기는 작업도 아직 진행하지 않았습니다.

저장소 루트에 package.json이 없어 Husky는 제안하지 않았습니다.
```
