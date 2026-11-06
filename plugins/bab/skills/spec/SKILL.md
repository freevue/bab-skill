---
name: spec
description: GitHub 이슈로 스펙을 다룹니다. 대화로 왜·무엇을·어떻게를 정리해 스펙 이슈를 등록하고, 등록된 이슈의 필수 항목·라벨·상태를 확인하고, 요청에 따라 이슈를 닫기·재오픈·취소하며 사유 코멘트를 남깁니다. 사용자가 "스펙 등록", "이슈 만들어줘", "이슈 확인", "스펙 현황", "이슈 닫아줘", "재오픈", "취소", "/bab:spec"이라고 말할 때 사용합니다.
---

# bab spec

이슈는 스펙을 **기록**하는 곳입니다. 결정, 수정, 취소의 이력이 모두 이슈 타임라인에 남아야 합니다.

## 스펙 필수 항목

| 항목 | 이슈 폼 필드 | 확인 방법 |
| --- | --- | --- |
| 왜 | `### 왜` | 본문에 섹션이 있고 비어 있지 않음 |
| 무엇을 | `### 무엇을` | 본문에 섹션이 있고 비어 있지 않음 |
| 어떻게 | `### 어떻게` | 체크리스트 항목이 1개 이상 |
| 관련 wiki | `### 관련 wiki` | `wiki/` 경로가 1개 이상 |
| 검증 기준 | `### 검증 기준` | 비어 있지 않음 |
| 중요도 | 라벨 `P0`~`P3` | 정확히 1개 |
| 상태 | 라벨 `status:*` 또는 Closed 사유 | 열린 이슈는 정확히 1개 |

## 상태 모델

| 상태 | GitHub 표현 | 누가 바꾸나 |
| --- | --- | --- |
| 등록 | Open + `status:proposed` | AI·사람 |
| 확정 | Open + `status:decided` | **사람만** |
| 진행 | Open + `status:in-progress` | `/bab:sync` |
| 완료 | Closed as completed (PR의 `Closes #N`) | PR 머지 |
| 재오픈 | Reopen + `status:decided` | 사람의 요청 |
| 취소 | Closed as not planned | 사람의 요청 |

- AI는 `status:decided`를 붙이지 않습니다. 확정은 사람의 결정입니다.
- 상태를 바꿀 때는 항상 사유 코멘트를 먼저 남깁니다. 사유가 없으면 사용자에게 묻습니다.

## 작업 1. 스펙 등록

1. 대화로 필수 항목을 채웁니다. 빈 항목이 있으면 질문합니다. 추측해서 채우지 않습니다.
2. 관련 wiki 경로는 `wiki/index.md`를 읽고 기존 페이지에서 고릅니다. 새 페이지면 만들 경로를 적습니다.
3. 초안을 보여 주고 사용자의 확인을 받은 뒤 등록합니다.

```bash
gh issue create --title "[스펙]: <제목>" --body-file <초안 파일> --label status:proposed --label <P0~P3>
```

본문은 이슈 폼과 같은 `### 왜`, `### 무엇을`, `### 어떻게`, `### 관련 wiki`, `### 검증 기준` 섹션을 씁니다.

## 작업 2. 이슈 확인

읽기 전용입니다.

- 단일 이슈: `gh issue view <N> --json number,title,body,labels,state,stateReason,comments`로 읽고 필수 항목 표를 기준으로 판정합니다.
- 현황: `gh issue list --state all --limit 100 --json number,title,labels,state,stateReason`으로 상태별 개수와 누락 항목이 있는 이슈를 정리합니다.

```text
## 스펙 현황

| 상태 | 개수 | 이슈 |
| --- | --- | --- |
| proposed | 2 | #12, #15 |
| decided | 1 | #9 |
| in-progress | 1 | #7 (PR #20) |

필수 항목 누락
| 이슈 | 누락 |
| --- | --- |
| #15 | 검증 기준, 중요도 라벨 |
```

## 작업 3. 상태 전이

사용자가 요청한 전이만 수행합니다.

| 요청 | 순서 |
| --- | --- |
| 취소 | 사유 코멘트 → `gh issue close <N> --reason "not planned"` → `status:*` 라벨 제거 |
| 재오픈 | 바뀐 스펙을 본문에 반영 → 사유 코멘트 → `gh issue reopen <N>` → `status:decided` 붙이기는 사람에게 안내 |
| 수동 완료 | 사유 코멘트 → `gh issue close <N> --reason completed` |

사유 코멘트 형식은 다음과 같습니다.

```markdown
**상태 변경**: {이전} → {이후}

- 사유: {한 문장}
- 근거: {관련 코멘트·PR 링크}
```
