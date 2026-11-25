---
name: readMilestoneConfig
type: unit
module: milestone
issues: [30]
code: [plugins/bab/skills/milestone/scripts/read-config.mjs]
---

# readMilestoneConfig

프로젝트의 선택형 마일스톤 설정을 읽고 검사합니다.

## 시그니처

```javascript
export function readMilestoneConfig(repoRoot)
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| repoRoot | string | 없음 | 설정을 읽을 저장소 루트 |

| 반환 | 의미 |
| --- | --- |
| object | 비활성은 enabled false와 current null. 활성은 enabled true, repository와 정수 또는 null인 current |

JavaScript의 타입은 표의 계약입니다. 선언의 정적 타입 비교는 미검증입니다.

## 내부 로직

1. 루트 아래 .bab이 없으면 비활성을 반환합니다. 있으면 일반 폴더만 허용합니다.
2. .bab/milestones.json이 없으면 비활성을 반환합니다. 있으면 일반 파일만 허용하며 심볼릭 링크를 거부합니다.
3. UTF-8 JSON의 BOM을 제거합니다. object이며 version이 1인지 검사합니다.
4. repository는 owner/repo 형식입니다. current는 양의 안전한 정수 또는 null입니다. 누락과 다른 형식은 오류입니다.
5. 검증한 필드만 반환합니다. 파일·JSON·형식 오류는 예외를 던집니다. 원격 조회와 파일 변경은 하지 않습니다.

## 사용법

```javascript
import { readMilestoneConfig } from './plugins/bab/skills/milestone/scripts/read-config.mjs'
const result = readMilestoneConfig('/workspace/app')
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [마일스톤 관리](../../feature/milestones.md) | 프로젝트의 선택형 마일스톤 설정을 읽고 검사합니다. |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-readMilestoneConfig-01 | 폴더 또는 설정 없음 | 비활성 결과, 원격 조회 없음 |
| UT-readMilestoneConfig-02 | 올바른 설정, BOM 또는 추가 필드 | 검증한 필드만 반환 |
| UT-readMilestoneConfig-03 | current null | 활성 상태와 현재 번호 없음을 구분 |
| UT-readMilestoneConfig-04 | JSON·버전·저장소·current 오류 | 예외, 비활성 우회 없음 |
| UT-readMilestoneConfig-05 | 심볼릭 링크 또는 잘못된 파일 종류 | 예외, 링크 대상 읽기 없음 |
