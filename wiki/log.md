---
name: log
type: log
---

# Wiki Log

항목 형식은 `## [YYYY-MM-DD] {spec|ingest|lint} | #N | 제목`입니다. 최신 항목을 아래에 추가합니다.

## [2026-11-07] ingest | - | 이슈 라벨 유닛 명세

사용자 요청으로 기존 이슈 라벨 코드를 처음 문서화했습니다. 연결할 스펙 이슈는 없습니다.

- [이슈 라벨 동기화](feature/issue-label-sync.md)의 이벤트 범위와 흐름을 기록했습니다.
- [parsePriority](unit/issue/parsePriority.md)의 입력, 반환, 분기 순서와 TC를 기록했습니다.
- [planLabelChanges](unit/issue/planLabelChanges.md)는 같은 구현 파일의 공개 함수이므로 함께 기록했습니다.
- 독립 재현에서 찾은 반복 제목의 경계를 보완했습니다. [검증 기록](../docs/verification/parse-priority.md)에 두 언어의 재현 결과와 한계를 남겼습니다.
