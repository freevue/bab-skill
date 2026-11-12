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

## [2026-11-08] spec | #12 | 참고 문서 분류

- [인덱스](index.md)에 `## 참고` 분류를 추가했습니다.
- 조사·정보 문서는 `reference` 템플릿으로 작성하고 형상 명세와 구분합니다.
- 참고 문서의 내용·출처·링크·인덱스를 검사합니다. 코드 계약은 네 명세 분류에서 관리합니다.

## [2026-11-11] spec | #15 | 저장소 간 계약·이슈 연결

- [정책](policy/repository-links.md)에 연결 정본, 컨텍스트 범위와 내부·외부 이슈 구분을 기록했습니다.
- [기능](feature/repository-links.md)에 독립 link, setup 재사용과 spec 연결 절차를 기록했습니다.
- [inspectLinks](unit/link/inspectLinks.md)에 목록 검사와 커밋으로 고정한 계약 섹션 읽기를 명시했습니다.
- [검증 기록](../docs/verification/repository-links.md)에 로컬 실행, 실제 GitHub 읽기와 미검증 범위를 구분했습니다.
- 사용자 배포 요청에 따라 플러그인과 저장소·setup workflow의 버전을 v1.0.1로 맞췄습니다.

## [2026-11-12] spec | #17 | 시각화 기준과 적용 검증

- [정책](policy/visualization.md)에 여덟 관점, 근거 표시와 검증 한계를 기록했습니다.
- [기능](feature/visualization.md)에 wiki·spec·audit의 작성·대조 동작과 기능 TC를 기록했습니다.
- 사용자가 UI 상태 전이 초안을 여덟 관점의 구성으로 확장하고 README 정리·적용 테스트·v1.0.2 배포를 요청했습니다.
