---
name: priorityRank
type: unit
module: sync
issues: [30]
code: [plugins/bab/skills/sync/scripts/queue-next.mjs]
---

# priorityRank

이슈의 중요도 라벨을 정렬 순위로 반환합니다.

## 시그니처

```javascript
export function priorityRank(issue)
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| issue | object | 없음 | name을 가진 labels 배열이 있는 이슈 |

| 반환 | 의미 |
| --- | --- |
| number | P0~P3은 0~3. 해당 라벨이 없으면 4 |

JavaScript의 타입은 표의 계약입니다. 선언의 정적 타입 비교는 미검증입니다.

## 내부 로직

1. labels에서 P0, P1, P2, P3 순서로 첫 일치를 찾습니다.
2. 찾은 순위를 반환합니다. 일치가 없으면 중요도 목록의 길이인 4를 반환합니다.

## 사용법

```javascript
import { priorityRank } from './plugins/bab/skills/sync/scripts/queue-next.mjs'
const result = priorityRank({ labels: [{ name: 'P1' }] })
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [마일스톤 관리](../../feature/milestones.md) | 이슈의 중요도 라벨을 정렬 순위로 반환합니다. |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-priorityRank-01 | P0~P3, 미지정 또는 여러 중요도 | 0~3, 4 또는 가장 높은 중요도 순위 |
