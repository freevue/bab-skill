---
name: listIssues
type: unit
module: sync
issues: [31]
code: [plugins/bab/skills/sync/scripts/list-issues.mjs]
---

# listIssues

열린 이슈의 모든 페이지를 스트림으로 읽고 큐 선택에 필요한 필드만 반환합니다.

## 시그니처

```javascript
export async function listIssues(label, repository)
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| label | string | 없음 | 조회할 상태 라벨. 큐는 status:decided와 status:in-progress 사용 |
| repository | string | 없음 | 호출자가 확인한 대상 owner/repo |

| 반환 | 의미 |
| --- | --- |
| Promise<object[]> | 모든 페이지의 큐 이슈. number·title·body, name만 있는 labels와 번호만 있는 milestone 또는 null |

JavaScript의 타입은 표의 계약입니다. 선언의 정적 타입 비교는 미검증입니다.

## 내부 로직

1. gh api를 비동기로 실행합니다. 열린 이슈와 지정한 라벨을 페이지당 100개씩 전체 조회합니다.
2. --paginate와 --jq의 `.[] | @json`을 사용합니다. --slurp로 전체 응답을 합치지 않습니다.
3. 표준 출력을 UTF-8로 읽고 JSON 한 줄씩 파싱합니다. 빈 줄은 건너뛰고 PR은 제외합니다.
4. number, title, body, labels의 name과 milestone의 number만 보관합니다. 반복된 마일스톤 설명과 불필요한 REST 필드는 버립니다.
5. 여러 줄 본문과 UTF-8 문자가 청크 경계에서 나뉘어도 원문을 보존합니다. 마지막 줄의 줄바꿈은 필수가 아닙니다.
6. 표준 오류와 프로세스 종료도 함께 확인합니다. 모든 출력 파싱과 종료 코드 0이 확인된 뒤에만 목록을 반환합니다.
7. 실행 실패, 스트림 오류, 잘못된 JSON과 0이 아닌 종료 코드는 예외입니다. 실패 시 자식 프로세스와 읽기를 종료합니다.
8. 부분 목록은 반환하지 않습니다. 고정 출력 버퍼 한도를 늘리는 방식으로 우회하지 않습니다.

원격은 읽기 전용입니다. 큐 CLI는 조회 실패 시 선택 JSON을 출력하지 않고 코드 2로 종료합니다.

## 사용법

```javascript
import { listIssues } from './plugins/bab/skills/sync/scripts/list-issues.mjs'
const issues = await listIssues('status:decided', 'example/app')
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [마일스톤 관리](../../feature/milestones.md) | 활성·비활성 큐의 후보와 전체 진행 상태 읽기 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-listIssues-01 | 여러 페이지의 전체 응답이 1 MiB 초과 | ENOBUFS 없이 모든 페이지를 읽고 필요한 필드만 반환 |
| UT-listIssues-02 | 단일 JSON 레코드가 1 MiB 초과 | 본문과 wiki 경로를 손실 없이 반환 |
| UT-listIssues-03 | UTF-8·본문 줄바꿈·PR·마지막 줄 개행 없음 | 본문 보존, PR 제외와 마지막 레코드 포함 |
| UT-listIssues-04 | 유효한 앞 페이지 뒤의 원격 실패 또는 JSON 오류 | 예외, 부분 목록 성공 없음 |
| UT-listIssues-05 | gh 실행 실패 | 예외, 읽기와 프로세스 종료 |
