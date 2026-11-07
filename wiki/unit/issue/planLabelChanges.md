---
name: planLabelChanges
type: unit
module: plugins/bab/ci
issues: []
code: [plugins/bab/ci/issue-sync.mjs]
---

# planLabelChanges

이슈 이벤트에 따라 추가하거나 제거할 라벨을 계산합니다. GitHub를 호출하지 않고 입력 라벨도 바꾸지 않습니다.

## 시그니처

```javascript
export function planLabelChanges({ action, body, labels })
```

실제 JavaScript 선언에는 타입 표기가 없습니다. 아래 표가 타입 계약이며, 선언과의 타입 비교는 자동 검사 범위 밖입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| `{ action, body, labels }` | object | 없음 | 아래 세 필드를 가진 객체입니다 |

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| action | string | 이벤트 이름입니다. closed만 별도로 처리합니다 |
| body | string \| null \| undefined | parsePriority의 입력 계약을 따릅니다 |
| labels | string[] | 현재 라벨 이름입니다. 순서를 유지하며 중복을 제거하지 않습니다 |

| 반환 | 의미 |
| --- | --- |
| object | add와 remove가 각각 string[]인 새 객체입니다. 라벨이 없으면 빈 배열입니다 |

## 내부 로직

1. action이 closed이면 add는 빈 배열입니다. remove에는 `status:`로 시작하는 라벨만 입력 순서대로 담고 즉시 반환합니다. 본문은 읽지 않습니다.
2. 나머지 이벤트에서는 [parsePriority](parsePriority.md)로 본문의 중요도를 읽습니다. 값이 없으면 add와 remove가 모두 빈 배열인 객체를 반환합니다.
3. 중요도 라벨이 이미 있으면 add는 빈 배열입니다. 없으면 읽은 중요도 하나를 담습니다.
4. remove에는 P0~P3 중 읽은 중요도와 다른 라벨만 입력 순서대로 담습니다. 다른 라벨은 유지합니다.

이 함수는 재오픈의 상태 라벨을 만들지 않습니다. 에이전트가 bab spec 절차에서 status:proposed를 설정합니다.

## 사용법

```javascript
planLabelChanges({ action: 'edited', body: '# Priority\nP1', labels: ['P2', 'drift'] })
// { add: ['P1'], remove: ['P2'] }
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [이슈 라벨 동기화](../../feature/issue-label-sync.md) | 이슈 이벤트를 읽은 뒤 gh에 전달할 라벨 변경을 계산합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-planLabelChanges-01 | closed, body 없음, labels=[status:decided, P1, status:in-progress, drift] | add=[], remove=[status:decided, status:in-progress] |
| UT-planLabelChanges-02 | edited, 본문 중요도 P1, labels=[P2, drift] | add=[P1], remove=[P2] |
| UT-planLabelChanges-03 | edited, 본문 중요도 P1, labels=[P1, P3, P3] | add=[], remove=[P3, P3]. 입력 배열은 유지 |
| UT-planLabelChanges-04 | reopened, 중요도 없는 본문, labels=[P2] | add=[], remove=[] |
