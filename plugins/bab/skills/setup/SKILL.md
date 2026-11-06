---
name: setup
description: 사용자가 bab 셋업을 요청하면 대상 Git 저장소에 wiki 골격, GitHub 템플릿과 워크플로, 에이전트 지침을 설치합니다. 승인된 경우 GitHub 라벨도 설치합니다.
disable-model-invocation: true
---

# bab setup

현재 저장소에 bab을 한 번에 설치합니다. 설치는 `scripts/setup.mjs`가 정해진 대로 수행하고, 에이전트는 결과를 해석해 보고합니다. 여러 번 실행해도 결과가 같습니다(멱등). 이미 있는 파일은 덮어쓰지 않습니다.

## 절차

1. `git rev-parse --show-toplevel`로 저장소 루트를 찾습니다. git 저장소가 아니면 중단하고 보고합니다.
2. 사용할 지침 파일을 고릅니다. Codex와 일반 에이전트는 `--instructions AGENTS.md`를 씁니다. Claude Code는 이 옵션을 생략해 기존 선택 순서를 따릅니다. 사용자가 파일을 지정하면 그 파일을 따릅니다.
3. GitHub 라벨 설치도 승인된 경우에만 `gh repo view --json nameWithOwner,viewerPermission`으로 원격과 쓰기 권한을 확인합니다. 해당 원격을 확인할 수 없거나 라벨 설치가 승인되지 않았으면 `--skip-labels`를 붙입니다.
4. 같은 옵션으로 먼저 `--dry-run`을 실행합니다. 오류가 없으면 이 옵션을 빼고 실행합니다. 라벨을 설치할 때는 확인한 `OWNER/REPO`를 `GH_REPO`로 지정합니다.

```bash
node <이 스킬 폴더>/scripts/setup.mjs <저장소 루트> [--instructions AGENTS.md|CLAUDE.md] [--skip-labels] [--dry-run]
```

5. 출력 표를 아래 보고 형식으로 정리합니다. `차이 있음`인 파일은 기존 파일과 원본(`assets/`)을 비교해 무엇이 다른지 설명합니다. 기존 파일은 고치지 않습니다.

지침 파일을 생략하면 기존 `CLAUDE.md`, 기존 `AGENTS.md` 순으로 고릅니다. 둘 다 없으면 `CLAUDE.md`를 만듭니다.

두 에이전트를 함께 쓰는 저장소에서는 두 지침 파일이 기존 공통 규칙 문서를 참조하도록 안내합니다. 셋업은 프로젝트의 코드 컨벤션을 선택하거나 설치하지 않습니다.

종료 코드 `0`은 성공, `1`은 안전하지 않은 경로나 라벨 설치 실패, `2`는 경로나 옵션 오류입니다. 대상 파일이나 상위 폴더가 심볼릭 링크이면 파일이나 라벨을 만들기 전에 중단합니다.

## 설치 항목

| 원본 (`assets/`) | 대상 (저장소 루트 기준) | 이미 있을 때 |
| --- | --- | --- |
| `ISSUE_TEMPLATE/spec.md` | `.github/ISSUE_TEMPLATE/spec.md` | 유지. 내용이 다르면 `차이 있음` |
| `pull_request_template.md` | `.github/pull_request_template.md` | 유지. 내용이 다르면 `차이 있음` |
| `workflows/bab.yml` | `.github/workflows/bab.yml` (CI 가드레일 호출) | 유지. 내용이 다르면 `차이 있음` |
| `wiki/index.md`, `wiki/log.md` | `wiki/index.md`, `wiki/log.md` | 유지 |
| (원본 없음) | `wiki/policy/`, `wiki/feature/`, `wiki/unit/`, `wiki/type/` + `.gitkeep` | 유지 |
| `claude-section.md` | 선택한 `AGENTS.md` 또는 `CLAUDE.md` 끝에 추가 | `## bab (SDD/AIDD)` 제목이 있으면 유지 |
| `labels.json` | GitHub 라벨 10개 (`no-spec`, `drift`, `blocked` 포함) | `gh label create --force`로 색과 설명만 맞춤 |

## 하지 않는 일

- 커밋, 푸시, 브랜치 생성을 하지 않습니다. 결과를 보여 주고 커밋은 사용자에게 맡깁니다.
- 기존 코드의 wiki 문서화는 하지 않습니다. 필요하면 [bab wiki](../wiki/SKILL.md)의 ingest 모드를 안내합니다.

## 보고 형식

```text
## bab setup 결과

저장소: owner/repo

| 항목 | 결과 |
| --- | --- |
| .github/ISSUE_TEMPLATE/spec.md | 생성 |
| .github/pull_request_template.md | 차이 있음 (기존 템플릿에 Verification 섹션 없음) |
| wiki/ | 생성 |
| AGENTS.md | 섹션 추가 |
| .github/workflows/bab.yml | 생성 |
| 라벨 10개 | 생성·갱신 10 |

다음 단계: 변경 파일을 확인하고 커밋하세요. 기존 코드가 있으면 bab wiki의 ingest 모드로 첫 문서화를 진행할 수 있습니다.
```
