---
name: parseArgs
type: unit
module: sync
issues: [30]
code: [plugins/bab/skills/sync/scripts/queue-next.mjs]
---

# parseArgs

큐의 기존 동시 진행 상한과 출력 옵션을 읽습니다.

## 시그니처

```javascript
export function parseArgs(argv)
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| argv | string[] | 없음 | 큐 CLI 인자 배열 |

| 반환 | 의미 |
| --- | --- |
| object | maxInProgress는 기본 1 또는 옵션 다음 값의 Number 변환 결과. json은 --json 포함 여부 |

JavaScript의 타입은 표의 계약입니다. 선언의 정적 타입 비교는 미검증입니다.

## 내부 로직

1. 첫 --max-in-progress의 다음 값을 Number로 변환합니다. 옵션이 없으면 1을 사용합니다.
2. --json의 포함 여부와 상한을 반환합니다. CLI가 상한의 정수·양수 여부를 검사합니다.

## 사용법

```javascript
import { parseArgs } from './plugins/bab/skills/sync/scripts/queue-next.mjs'
const result = parseArgs(['--max-in-progress', '2', '--json'])
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [마일스톤 관리](../../feature/milestones.md) | 큐의 기존 동시 진행 상한과 출력 옵션을 읽습니다. |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-parseArgs-01 | 옵션 없음, 상한 2와 --json, 잘못된 상한 | 기본값, 지정값 또는 CLI 오류 판정용 값 |
