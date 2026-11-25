---
name: pickNext
type: unit
module: sync
issues: [30, 31]
code: [plugins/bab/skills/sync/scripts/queue-next.mjs]
---

# pickNext

전체 진행 상태를 보호하며 현재 범위의 다음 확정 이슈 하나를 선택합니다.

## 시그니처

```javascript
export function pickNext({ decided, inProgress, maxInProgress = 1, milestones = { enabled: false, current: null } })
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| `{ decided, inProgress, maxInProgress = 1, milestones = { enabled: false, current: null } }` | object | 없음 | decided와 inProgress는 열린 이슈 배열. 상한은 양의 정수. milestones는 inspectMilestones 결과이며 생략하면 기존 범위 |

| 반환 | 의미 |
| --- | --- |
| object | next는 number·title 또는 null. waiting은 대기 사유 또는 null. skipped는 후보 번호와 제외 사유 배열 |

JavaScript의 타입은 표의 계약입니다. 선언의 정적 타입 비교는 미검증입니다.

## 내부 로직

1. 마일스톤을 사용하며 current가 없거나 닫혔거나 열린 항목이 0개면 사유와 빈 선택을 반환합니다.
2. 전체 inProgress에서 blocked가 아닌 이슈 수가 상한에 닿으면 대기합니다. 다른 묶음도 포함합니다.
3. 전체 inProgress의 wiki 경로를 수집합니다. blocked인 진행 이슈의 경로도 보호합니다.
4. 마일스톤 사용 시 현재 번호와 같은 소속의 decided만 후보로 삼습니다. 미사용 시 전체 decided를 유지합니다.
5. 후보를 중요도, 번호 오름차순으로 정렬합니다. blocked 또는 진행 경로와 겹치면 skipped에 기록합니다.
6. 남은 첫 이슈의 번호와 제목만 반환합니다. 활성 범위에 후보가 없으면 해당 마일스톤의 대기 사유를 반환합니다.
7. 호출자는 `listIssues`의 두 조회가 모두 끝난 뒤 전체 목록을 전달합니다. 부분 조회 결과로 선택하지 않습니다.
8. 함수는 입력과 원격을 변경하지 않습니다. 응답이 커져도 같은 범위·상한·경로 보호 규칙을 유지합니다.

## 사용법

```javascript
import { pickNext } from './plugins/bab/skills/sync/scripts/queue-next.mjs'
const result = pickNext({ decided: [], inProgress: [] })
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [마일스톤 관리](../../feature/milestones.md) | 전체 진행 상태를 보호하며 현재 범위의 다음 확정 이슈 하나를 선택합니다. |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-pickNext-01 | 비활성, 중요도와 번호가 다른 후보 | 기존 정렬 순서 유지, 입력 불변 |
| UT-pickNext-02 | 현재 묶음 P2, 다른 묶음·미배정 P0 | 현재 묶음 P2 선택 |
| UT-pickNext-03 | 다른 묶음 진행 이슈와 blocked 진행 경로 | 전체 상한과 경로 보호 유지 |
| UT-pickNext-04 | 현재 없음·닫힘·열린 항목 없음 | 사유별 대기, 다른 묶음 선택 없음 |
| UT-pickNext-05 | 현재 후보 없음 또는 모두 blocked·충돌 | 대기와 제외 사유, 전역 우회 없음 |
