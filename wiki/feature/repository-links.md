---
name: repository-links
type: feature
issues: [15]
code: [plugins/bab/skills/link/scripts/read-links.mjs]
---

# 저장소 연결

사용자는 setup할 때 또는 독립 `bab:link`로 저장소를 연결합니다. spec은 그 연결에서 필요한 계약과 외부 이슈를 찾습니다.

## 구성 유닛

| 유닛 | 역할 |
| --- | --- |
| [inspectLinks](../unit/link/inspectLinks.md) | 연결 설정 검사, 계약 목록과 지정한 외부 계약 읽기 |

## 흐름

1. link는 실제 Git 원격과 사용자가 지정한 저장소를 확인합니다. 기존 setup의 wiki와 지침은 다시 설치하지 않습니다.
2. 기존 연결 정본이 있으면 재사용합니다. 처음 연결하면 담당 영역과 기존 wiki에서 공개할 계약 위치를 정합니다.
3. 에이전트는 승인된 저장소에 정본 또는 참조를 기록합니다. 저장소별 로컬 경로를 공유 설정에 넣지 않습니다.
4. `inspectLinks`로 연결 설정을 검사합니다. 설정이 잘못됐으면 오류를 보고하고 기존 파일을 보존합니다.
5. spec은 목록에서 후보를 고르고 계약 식별자를 지정해 필요한 섹션을 읽습니다.
6. 기존 계약으로 충분하면 참조를 남깁니다. 변경이 필요하면 기존 이슈를 찾거나 제안 초안을 작성합니다.
7. 외부 이슈 등록이 승인됐으면 제안 상태로 등록하고 원본 이슈와 연결합니다. 내부 구현 방법은 대상 저장소에서 확정합니다.
8. wiki는 내부 이슈와 외부 관계를 구분합니다. sync는 사용한 계약의 기준과 현재 변경 여부를 확인합니다.

연결 파일의 형식과 이슈·wiki 표는 [공통 규약](../../plugins/bab/skills/link/references/protocol.md)을 따릅니다.
공개 계약이 아직 없으면 연결 목록만 등록하고 해당 계약을 미확정으로 보고합니다.

## 관련 정책

| 정책 | 규칙 |
| --- | --- |
| [저장소 연결](../policy/repository-links.md) | POL-repository-links-01~10 |

## TC

| ID | 조건 | 동작 | 기대 결과 |
| --- | --- | --- | --- |
| FT-repository-links-01 | setup을 마친 저장소 | link로 연결 설정을 추가 | setup 파일을 다시 설치하지 않고 같은 규약으로 연결 |
| FT-repository-links-02 | setup 요청에 관련 저장소가 포함됨 | 연결 단계 실행 | 독립 link 절차 재사용 |
| FT-repository-links-03 | 기존 외부 계약이 작업을 충족함 | spec 등록 | 계약 참조만 기록하고 외부 이슈를 만들지 않음 |
| FT-repository-links-04 | 외부 계약 변경이 필요함 | spec 등록 | 대상 저장소와 기존 이슈 또는 제안 초안 식별 |
| FT-repository-links-05 | 외부 등록 승인이 없음 | 변경 요청 준비 | 로컬 초안까지 준비하고 원격을 바꾸지 않음 |
| FT-repository-links-06 | 같은 요청을 다시 처리함 | 기존 원본·대상·계약 검색 | 기존 이슈 재사용, 재귀 전파와 중복 생성 없음 |
| FT-repository-links-07 | 외부 이슈가 연결됨 | wiki 작성 | 내부 이슈 번호와 외부 관계·계약 기준을 구분 |
| FT-repository-links-08 | 계약 하나를 지정함 | 읽기 도구 실행 | 지정한 섹션과 커밋만 반환, 다른 문서와 섹션 제외 |

FT-repository-links-01~07은 에이전트 절차 검증 대상입니다. 읽기 도구 테스트와 원격 적용 근거는 구분합니다.
[검증 기록](../../docs/verification/repository-links.md)에 실행 결과와 미검증 범위를 남깁니다.
