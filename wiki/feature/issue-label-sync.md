---
name: issue-label-sync
type: feature
issues: []
code: [plugins/bab/ci/issue-sync.mjs]
---

# 이슈 라벨 동기화

이슈 본문의 중요도를 라벨에 반영하고, 닫힌 이슈의 상태 라벨을 제거합니다. 기존 코드에서 옮긴 명세이며 새 운영 정책을 정하지 않습니다.

## 구성 유닛

| 유닛 | 역할 |
| --- | --- |
| [parsePriority](../unit/issue/parsePriority.md) | 본문에서 중요도를 읽습니다 |
| [planLabelChanges](../unit/issue/planLabelChanges.md) | 추가·제거할 라벨을 계산합니다 |

## 흐름

1. GitHub Actions가 이슈의 opened, edited, closed 이벤트를 전달합니다. 이슈가 없거나 PR 이벤트이면 종료합니다.
2. 이벤트의 action, 본문과 현재 라벨 이름을 planLabelChanges에 전달합니다. closed가 아니면 내부에서 parsePriority를 호출합니다.
3. 추가·제거할 라벨이 있으면 gh issue edit을 호출합니다. 변경이 없으면 GitHub를 호출하지 않습니다.
4. 결과를 실행 요약에 기록합니다. gh 호출이 실패하면 오류를 전파합니다.

## 관련 정책

별도 정책 페이지는 아직 없습니다. 재오픈은 이 기능의 이벤트 범위 밖이며, bab spec이 status:proposed를 설정합니다.

## TC

| ID | 조건 | 동작 | 기대 결과 |
| --- | --- | --- | --- |
| FT-issue-label-sync-01 | 본문 P1, 현재 라벨 P2 | edited 이벤트 실행 | P1을 추가하고 P2를 제거하는 gh 호출 1회 |
| FT-issue-label-sync-02 | 현재 라벨 status:decided와 P1 | closed 이벤트 실행 | 상태 라벨만 제거하는 gh 호출 1회 |
| FT-issue-label-sync-03 | 본문에 중요도 없음 | edited 이벤트 실행 | gh 호출 없음 |
