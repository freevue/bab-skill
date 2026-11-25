---
name: inspectMilestones
type: unit
module: milestone
issues: [30]
code: [plugins/bab/skills/milestone/scripts/read-milestones.mjs]
---

# inspectMilestones

설정의 저장소를 대조하고 현재 원격 마일스톤을 읽습니다.

## 시그니처

```javascript
export function inspectMilestones(repoRoot, repository, request = readRemote)
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| repoRoot | string | 없음 | 설정을 읽을 저장소 루트 |
| repository | string 또는 undefined | 없음 | 확인한 대상 owner/repo. 활성 설정에서 필요 |
| request | function | readRemote | GitHub API 경로를 받아 JSON object를 반환하는 읽기 함수 |

| 반환 | 의미 |
| --- | --- |
| object | enabled와 current. 활성 결과에는 repository가 있으며 current는 null 또는 number·title·description·state·url·openIssues·closedIssues를 가진 object |

JavaScript의 타입은 표의 계약입니다. 선언의 정적 타입 비교는 미검증입니다.

## 내부 로직

1. readMilestoneConfig를 호출합니다. 비활성이면 원격 조회 없이 반환합니다.
2. 대상 repository의 형식과 설정의 저장소를 대소문자 구분 없이 대조합니다. 다르면 오류입니다.
3. current가 null이면 활성 상태와 현재 목표 없음을 반환합니다. 원격을 조회하지 않습니다.
4. repos/owner/repo/milestones/번호를 읽습니다. 기본 읽기는 gh api를 사용하며 30초 제한을 둡니다.
5. 응답 번호는 설정과 같고 state는 open 또는 closed여야 합니다. title은 비어 있지 않은 문자열이어야 합니다.
6. description은 문자열 또는 null, html_url은 HTTP 또는 HTTPS 주소, 열린·닫힌 항목 수는 0 이상의 안전한 정수여야 합니다.
7. 검증한 필드만 반환합니다. 항목 수만으로 완료, 종료나 다음 선택을 수행하지 않습니다. 입력·원격·응답 오류는 예외입니다.
8. CLI는 저장소 루트 하나와 GH_REPO를 받습니다. 성공 0, 오류 2이며 오류 시 JSON을 출력하지 않습니다.

## 사용법

```javascript
import { inspectMilestones } from './plugins/bab/skills/milestone/scripts/read-milestones.mjs'
const result = inspectMilestones('/workspace/app', 'example/app')
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [마일스톤 관리](../../feature/milestones.md) | 설정의 저장소를 대조하고 현재 원격 마일스톤을 읽습니다. |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-inspectMilestones-01 | 비활성 또는 활성 current null | 원격 호출 없음, 도입 여부 구분 |
| UT-inspectMilestones-02 | 현재 번호와 유효한 원격 응답 | 지정한 한 마일스톤의 검증한 필드만 반환 |
| UT-inspectMilestones-03 | 저장소 누락·불일치 또는 원격 실패 | 예외, 원격 변경 없음 |
| UT-inspectMilestones-04 | 번호·상태·제목·주소·개수 오류 | 예외, 현재 목표로 사용하지 않음 |
