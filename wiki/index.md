---
name: index
type: index
---

# Wiki Index

정책·기능·유닛·타입은 코드가 따라야 하는 명세입니다. 참고 문서는 조사·정보의 근거를 기록합니다.

## 정책

| 페이지 | 설명 |
| --- | --- |
| [검증 범위](policy/verification-scope.md) | 핫픽스 검증 선택·전체 확대·결과 재사용 |
| [시각화](policy/visualization.md) | 관점 선택, 근거 표시와 검증 한계 |
| [저장소 연결](policy/repository-links.md) | 저장소별 담당 영역, 공개 계약과 외부 이슈 관계 |

| [언어별 형상 검사](policy/drift-language-support.md) | 언어 판정·미검증·종료·이슈 보존 |

## 기능

| 페이지 | 설명 |
| --- | --- |
| [핫픽스 검증](feature/hotfix-verification.md) | hotfix 진입과 sync·audit의 실행 근거 공유 |
| [시각화 작성과 대조](feature/visualization.md) | wiki·spec·audit의 그림 작성과 검증 근거 대조 |
| [이슈 라벨 동기화](feature/issue-label-sync.md) | 중요도 라벨 반영과 닫힌 이슈의 상태 라벨 제거 |
| [저장소 연결](feature/repository-links.md) | 독립 link, setup 재사용과 spec의 외부 계약 선택 |

| [언어별 드리프트 검사](feature/drift-language-support.md) | 지원 범위·CLI·CI·감시 |

## 유닛

| 페이지 | 설명 |
| --- | --- |
| [parsePriority](unit/issue/parsePriority.md) | 이슈 본문에서 중요도 읽기 |
| [planLabelChanges](unit/issue/planLabelChanges.md) | 추가·제거할 이슈 라벨 계산 |
| [inspectLinks](unit/link/inspectLinks.md) | 연결 목록과 지정한 외부 계약 섹션 읽기 |

| [inspectLanguage](unit/drift/inspectLanguage.md) | 언어별 검사와 보고 계약 |
| [makeReport](unit/drift/makeReport.md) | 언어별 검사와 보고 계약 |
| [protectedTargets](unit/drift/protectedTargets.md) | 언어별 검사와 보고 계약 |
| [readReport](unit/drift/readReport.md) | 언어별 검사와 보고 계약 |
| [sourceReader](unit/drift/sourceReader.md) | 언어별 검사와 보고 계약 |
| [collectDrift](unit/drift/collectDrift.md) | 언어별 검사와 보고 계약 |
| [checkShape](unit/drift/checkShape.md) | 언어별 검사와 보고 계약 |
| [checkUndocumentedExports](unit/drift/checkUndocumentedExports.md) | 언어별 검사와 보고 계약 |
| [detectDrift](unit/drift/detectDrift.md) | 언어별 검사와 보고 계약 |
| [compareRows](unit/drift/compareRows.md) | 언어별 검사와 보고 계약 |
| [findPlaceholders](unit/drift/findPlaceholders.md) | 언어별 검사와 보고 계약 |
| [checkCompleteness](unit/drift/checkCompleteness.md) | 언어별 검사와 보고 계약 |
| [diffDrift](unit/drift/diffDrift.md) | 언어별 검사와 보고 계약 |
| [formatDiff](unit/drift/formatDiff.md) | 언어별 검사와 보고 계약 |
| [buildBody](unit/drift/buildBody.md) | 언어별 검사와 보고 계약 |
| [planActions](unit/drift/planActions.md) | 언어별 검사와 보고 계약 |
| [applyAction](unit/drift/applyAction.md) | 언어별 검사와 보고 계약 |

- [tokenizeRust](unit/drift/tokenizeRust.md)
- [readRust](unit/drift/readRust.md)
- [syntaxFor](unit/drift/syntaxFor.md)


## 타입

| 페이지 | 설명 |
| --- | --- |

## 참고

| 페이지 | 설명 |
| --- | --- |

- 2026-11-21: #24 Rust fn·struct 검사와 문서 기반 기능의 code 보정 명세를 확정했습니다.
