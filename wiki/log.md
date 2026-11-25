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

## [2026-11-15] spec | #22 | 핫픽스 검증 범위와 결과 재사용

- [정책](policy/verification-scope.md)에 영향 범위·전체 확대·실행 결과 재사용의 기준을 적었습니다.
- [기능](feature/hotfix-verification.md)에 hotfix 진입, sync·audit의 역할과 FT-hotfix-01~19를 기록했습니다.
- 사용자가 구현과 배포를 승인했습니다. 새 스킬을 추가하는 v1.1.0으로 배포합니다.

## [2026-11-21] spec | #24 | 언어별 판정과 미검증 보고

- wiki/policy/drift-language-support.md
- wiki/feature/drift-language-support.md
- wiki/unit/drift/의 구성 유닛 명세 17개
- wiki/index.md

## [2026-11-21] spec | #24 | v2.0.0 릴리스 준비

- 사용자가 구현 내용을 포함한 버전업 준비를 요청했습니다.
- 공개 검사 상태와 필수 JSON 계약이 바뀌므로 두 manifest와 새 setup 템플릿을 v2.0.0으로 준비합니다.
- [릴리스 준비 기록](../docs/releases/v2.0.0.md)에 언어 범위, 전환 절차와 남은 검증을 기록합니다.
- Rust 자동 대조는 추가하지 않았습니다. 기존 미검증 2페이지와 원격 CI를 게시 전 조건으로 남깁니다.

## [2026-11-23] spec | #28 | 저장소 회귀 범위와 workflow 버전 참조

- [저장소 CI 검사](policy/repository-ci.md)에 회귀 테스트 범위와 버전 일치 규칙을 기록했습니다.
- [인덱스](index.md)에 새 정책을 연결했습니다.

## [2026-11-23] spec | #28 | v2.0.1 패치 준비

- 두 manifest, 저장소·setup workflow와 현재 README·가이드를 v2.0.1로 맞췄습니다.
- [릴리스 준비본](../docs/releases/v2.0.1.md)에 변경 범위와 미실행 원격 검증을 기록합니다.
- 사용자의 버전업 준비 요청에 따라 로컬 검증만 진행합니다. 태그와 GitHub Release는 만들지 않습니다.

## [2026-11-23] spec | #28 | v2.0.1 릴리스 후보

- [PR #29](https://github.com/freevue/bab-skill/pull/29)에서 회귀 범위와 workflow 버전 검사를 검증합니다.
- `v2.0.1` 후보 태그는 `41cfd08`을 가리킵니다. 첫 PR workflow는 태그 게시 전에 시작되어 작업 생성 단계에서 실패했습니다.
- GitHub Release와 설치 플러그인 갱신은 PR 검증 완료 후 진행합니다.

## [2026-11-25] spec | #30 | 선택형 마일스톤 셋업

- 마일스톤 정책과 기능, 설정 읽기와 현재 작업 선택의 유닛 명세를 추가했습니다.
- 기존 스펙 정리, 활성 프로젝트의 spec·sync·issues와 사람 검토 경계를 기록했습니다.
- 구현과 로컬 검증 범위입니다. 커밋·푸시·PR·릴리스·설치는 포함하지 않습니다.

## [2026-11-25] spec | #30 | v2.1.0 버전업 준비

- 사용자가 버전업 준비와 추가 기능에 맞춘 README·가이드 정리를 요청했습니다.
- 두 manifest와 저장소·setup workflow 참조를 v2.1.0으로 맞춥니다.
- 영문·한국어 README와 가이드에 선택형 도입, 현재 목표의 작업 선택과 사람의 검토 경계를 정리합니다.
- [릴리스 준비본](../docs/releases/v2.1.0.md)에 변경, 호환성, 검증과 게시 전 조건을 기록합니다.
- 이번 범위는 로컬 준비입니다. 태그·GitHub Release·플러그인 설치는 진행하지 않습니다.

## [2026-11-25] spec | #31 | 큰 이슈 응답의 큐 실패 수정

- 사용자가 #31의 재현 결과를 확인한 뒤 수정을 승인했습니다.
- [listIssues](unit/sync/listIssues.md)에 이슈별 스트림 읽기와 전체 조회 성공 후 반환하는 계약을 적었습니다.
- 마일스톤 기능과 pickNext의 호출 조건에 큰 응답·부분 실패 TC를 반영했습니다.
- #30의 미커밋 작업을 보존하고 함께 검증합니다. 게시·설치는 포함하지 않습니다.
