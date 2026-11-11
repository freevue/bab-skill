---
name: inspectLinks
type: unit
module: link
issues: [15]
code: [plugins/bab/skills/link/scripts/read-links.mjs]
---

# inspectLinks

연결 설정을 검사하고 공개 계약 목록 또는 지정한 외부 계약 섹션을 반환합니다.

## 시그니처

```javascript
export function inspectLinks(repoRoot, selector)
```

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| repoRoot | string | 없음 | `.bab/links.json`이 있는 저장소 루트 |
| selector | string 또는 undefined | undefined | `owner/repo:contract-id`. 생략하면 계약 본문 없이 목록 반환 |

| 반환 | 의미 |
| --- | --- |
| object | 목록은 source와 repositories. 계약은 repository, contract, path, section, ref와 body. ref는 원본의 전체 커밋 SHA |

JavaScript의 타입은 표의 계약으로 정의합니다. 선언의 정적 타입 비교는 미검증입니다.

## 내부 로직

1. 저장소 안의 일반 `.bab` 폴더와 일반 `links.json` 파일만 읽습니다. 심볼릭 링크를 거부합니다.
2. JSON의 `version`이 1인지 검사합니다. `source` 또는 `repositories` 중 하나만 허용합니다.
3. `source`는 `owner/repo`입니다. 그 저장소 기본 브랜치의 HEAD를 전체 SHA로 확정하고 `.bab/links.json`을 읽습니다.
4. 정본이 또 `source`를 가리키면 오류로 처리합니다. 정본 참조는 한 번만 풉니다.
5. 정본의 저장소 목록이 비어 있지 않은지 검사합니다. 주소는 대소문자를 무시해 중복을 거부합니다.
6. 각 항목에 repository, responsibility, contracts가 있는지 검사합니다. responsibility는 비어 있지 않은 한 줄입니다.
7. 계약마다 고유 id, 한 줄 summary, wiki 아래 Markdown path와 비어 있지 않은 section을 요구합니다. 계약 목록은 비어 있어도 됩니다.
8. id는 소문자로 시작하는 소문자·숫자·하이픈입니다. 경로의 빈 구간, 점 구간, 역슬래시, URL·쿼리 문자를 거부합니다.
9. selector가 없으면 검사한 목록만 반환합니다. 있으면 목록에 등록된 저장소와 계약만 선택합니다.
10. 선택한 저장소의 HEAD를 SHA로 확정하고 계약 파일 하나를 읽습니다. GitHub 응답이 일반 base64 파일인지 확인합니다.
11. 코드 블록 밖에서 지정한 2단계 제목을 찾습니다. 다음 1~2단계 제목 전까지 반환하며 하위 제목은 포함합니다.
12. 제목이 없거나 둘 이상이거나 본문이 비어 있으면 오류로 처리합니다. 코드 블록 안의 가짜 제목은 무시합니다.
13. 원본 위치, 커밋 SHA와 선택한 본문만 반환합니다. 외부 이슈·파일은 수정하지 않습니다.

JSON 형식은 [공통 규약](../../../plugins/bab/skills/link/references/protocol.md)을 따릅니다.
입력·파일·원격 오류는 예외를 던집니다. CLI는 성공 0, 오류 1이며 오류 시 계약 본문을 표준 출력에 쓰지 않습니다.

## 사용법

```javascript
import { inspectLinks } from './plugins/bab/skills/link/scripts/read-links.mjs'

const catalog = inspectLinks('/workspace/app')
const contract = inspectLinks('/workspace/app', 'example/api:profile')
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [저장소 연결](../../feature/repository-links.md) | link·spec이 필요한 계약만 읽기 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-inspectLinks-01 | 올바른 로컬 정본, selector 생략 | 원격 호출 없이 목록 반환 |
| UT-inspectLinks-02 | 정본 참조와 올바른 원격 정본 | SHA로 고정한 정본 목록 반환 |
| UT-inspectLinks-03 | 등록된 계약 selector | 지정한 섹션과 SHA만 반환 |
| UT-inspectLinks-04 | 잘못된 버전·형식·경로·중복 또는 미등록 selector | 오류, 계약 읽기와 원격 변경 없음 |
| UT-inspectLinks-05 | 정본이 다시 정본 참조를 가리킴 | 오류, 추가 참조 읽기 없음 |
| UT-inspectLinks-06 | 누락·중복·빈 제목, 코드 블록 안의 제목 | 유효한 한 섹션만 허용, 나머지 오류 |
| UT-inspectLinks-07 | 로컬 연결 파일 또는 상위 폴더가 심볼릭 링크 | 외부 파일을 읽지 않고 오류 |
| UT-inspectLinks-08 | 원격 조회 실패 또는 일반 파일이 아닌 응답 | 오류, 계약 본문 출력 없음 |
