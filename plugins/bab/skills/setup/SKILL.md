---
name: setup
description: 현재 저장소에 bab SDD/AIDD 파일과 라벨을 설치합니다. wiki 골격(index, log), 스펙 이슈 폼, PR 템플릿, 상태·중요도 라벨, 로컬 CLAUDE.md 섹션을 만듭니다. 사용자가 "/bab:setup", "bab 셋업", "이 저장소에 bab 적용"이라고 말할 때만 사용합니다.
disable-model-invocation: true
---

# bab setup

현재 저장소에 bab을 한 번에 설치합니다. 설치는 `scripts/setup.mjs`가 정해진 대로 수행하고, 에이전트는 결과를 해석해 보고합니다. 여러 번 실행해도 결과가 같습니다(멱등). 이미 있는 파일은 덮어쓰지 않습니다.

## 절차

1. `git rev-parse --show-toplevel`로 저장소 루트를 찾습니다. git 저장소가 아니면 중단하고 보고합니다.
2. `gh repo view --json nameWithOwner,viewerPermission`으로 원격과 권한을 확인합니다. 원격이 없거나 권한이 `READ`이면 라벨을 만들 수 없으므로 `--skip-labels`를 붙입니다.
3. 먼저 `--dry-run`으로 실행해 무엇이 바뀌는지 확인합니다.
4. 실제로 실행합니다.

```bash
node <이 스킬 폴더>/scripts/setup.mjs <저장소 루트> [--skip-labels] [--dry-run]
```

5. 출력 표를 아래 보고 형식으로 정리합니다. `차이 있음`인 파일은 기존 파일과 원본(`assets/`)을 비교해 무엇이 다른지 설명합니다. 기존 파일은 고치지 않습니다.

종료 코드는 다음과 같습니다. `0`은 성공, `1`은 일부 라벨 실패, `2`는 저장소 루트 오류입니다.

## 설치 항목

| 원본 (`assets/`) | 대상 (저장소 루트 기준) | 이미 있을 때 |
| --- | --- | --- |
| `ISSUE_TEMPLATE/spec.yml` | `.github/ISSUE_TEMPLATE/spec.yml` | 유지. 내용이 다르면 `차이 있음` |
| `pull_request_template.md` | `.github/pull_request_template.md` | 유지. 내용이 다르면 `차이 있음` |
| `workflows/bab.yml` | `.github/workflows/bab.yml` (CI 가드레일 호출) | 유지. 내용이 다르면 `차이 있음` |
| `wiki/index.md`, `wiki/log.md` | `wiki/index.md`, `wiki/log.md` | 유지 |
| (원본 없음) | `wiki/policy/`, `wiki/feature/`, `wiki/unit/` + `.gitkeep` | 유지 |
| `claude-section.md` | `CLAUDE.md` 끝에 추가. `CLAUDE.md`가 없고 `AGENTS.md`가 있으면 `AGENTS.md` | `## bab (SDD/AIDD)` 제목이 있으면 유지 |
| `labels.json` | GitHub 라벨 10개 (`no-spec`, `drift`, `blocked` 포함) | `gh label create --force`로 색과 설명만 맞춤 |

## 하지 않는 일

- 커밋, 푸시, 브랜치 생성을 하지 않습니다. 결과를 보여 주고 커밋은 사용자에게 맡깁니다.
- 기존 코드의 wiki 문서화는 하지 않습니다. 필요하면 `/bab:wiki`의 ingest 모드를 안내만 합니다.

## 보고 형식

```text
## bab setup 결과

저장소: owner/repo

| 항목 | 결과 |
| --- | --- |
| .github/ISSUE_TEMPLATE/spec.yml | 생성 |
| .github/pull_request_template.md | 차이 있음 (기존 템플릿에 Verification 섹션 없음) |
| wiki/ | 생성 |
| CLAUDE.md | 섹션 추가 |
| .github/workflows/bab.yml | 생성 |
| 라벨 10개 | 생성·갱신 10 |

다음 단계: 변경 파일을 확인하고 커밋하세요. 기존 코드가 있으면 `/bab:wiki ingest`로 첫 문서화를 진행할 수 있습니다.
```
