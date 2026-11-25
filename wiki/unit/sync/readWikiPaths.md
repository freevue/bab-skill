---
name: readWikiPaths
type: unit
module: sync
issues: [30]
code: [plugins/bab/skills/sync/scripts/queue-next.mjs]
---

# readWikiPaths

이슈의 Wiki 섹션에서 작업 경로를 수집합니다.

## 시그니처

```javascript
export function readWikiPaths(body)
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| body | string 또는 null 또는 undefined | 없음 | 이슈 본문 |

| 반환 | 의미 |
| --- | --- |
| string[] | Wiki 섹션의 wiki 경로 배열. 해당 섹션이 없으면 빈 배열 |

JavaScript의 타입은 표의 계약입니다. 선언의 정적 타입 비교는 미검증입니다.

## 내부 로직

1. 1~3단계 Wiki 또는 관련 wiki 제목을 대소문자 구분 없이 찾습니다.
2. 다음 1~3단계 제목 전까지 읽고 HTML 주석을 제거합니다.
3. wiki/로 시작하며 공백, 닫는 괄호와 백틱 전까지의 경로를 반환합니다.

## 사용법

```javascript
import { readWikiPaths } from './plugins/bab/skills/sync/scripts/queue-next.mjs'
const result = readWikiPaths('# Wiki\nwiki/feature/settings.md')
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [마일스톤 관리](../../feature/milestones.md) | 이슈의 Wiki 섹션에서 작업 경로를 수집합니다. |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-readWikiPaths-01 | Wiki 경로, HTML 주석과 다음 섹션 | Wiki의 실제 경로만 반환 |
| UT-readWikiPaths-02 | 옛 제목 또는 본문 없음 | 옛 제목 경로 또는 빈 배열 |
