---
name: diffProse
type: unit
module: plugins/bab/ci
issues: [34]
code: [plugins/bab/ci/prose-diff.mjs]
---

# diffProse

두 저장소의 문장 규칙 위반을 비교해 PR이 새로 만든 항목만 반환합니다.

## 시그니처

```javascript
export function diffProse(baseRoot, headRoot)
```

JavaScript 선언에는 타입 표기가 없습니다. 아래 표가 타입과 허용 값의 계약입니다.

| 매개변수 | 타입 | 기본값 | 의미 |
| --- | --- | --- | --- |
| baseRoot | string | 없음 | 기준 커밋의 로컬 저장소 디렉터리입니다 |
| headRoot | string | 없음 | PR 커밋의 로컬 저장소 디렉터리입니다 |

| 반환 | 의미 |
| --- | --- |
| object | `checkedFiles`는 새 파일 또는 내용이 바뀌어 대조한 Markdown 수이고, `introduced`는 `{path, number, rule, detail}`의 배열입니다 |

## 내부 로직

1. 두 입력이 심볼릭 링크가 아닌 디렉터리인지 확인합니다. 아니면 오류를 던집니다.
2. 변경본의 `wiki/`, `docs/`, 루트 `README*.md`, `plugins/bab/skills/`에서 일반 `.md` 파일을 경로순으로 모읍니다. 심볼릭 링크와 삭제한 파일은 제외합니다.
3. 각 파일과 기준본의 같은 경로를 읽습니다. 내용이 같으면 문장 검사를 생략합니다. 다르면 기존 `checkProse`를 실행합니다. 기준본 파일이 없거나 일반 파일이 아니면 기준 위반은 빈 목록입니다.
4. 경로·규칙·상세·위반 시작 줄에서 코드·링크 주소를 뺀 문장을 키로 만듭니다. 문장 안의 연속 공백을 합칩니다. 기준본의 키별 횟수만큼 변경본의 위반을 제외합니다. 줄 번호는 키에 넣지 않습니다.
5. 남은 위반을 변경본의 경로·줄 번호 순서로 반환합니다. 호출자가 표에 표시할 수 있도록 본문 원문은 반환하지 않습니다.

## 사용법

```javascript
diffProse('/tmp/base', '/tmp/head')
```

## 사용처

| 위치 | 용도 |
| --- | --- |
| [PR 문서 품질 리포트](../../feature/document-quality-report.md) | 새 문장 규칙 위반을 대조합니다 |

## TC

| ID | 입력 | 기대 결과 |
| --- | --- | --- |
| UT-diffProse-01 | 기준과 변경본에 같은 긴 문단 | `introduced`가 비어 있음 |
| UT-diffProse-02 | 새 위반과 이동한 기존 위반 | 새 위반만 원래 변경본 줄 번호로 반환 |
| UT-diffProse-03 | 기준에 같은 위반 한 건, 변경본에 두 건 | 한 건만 반환 |
| UT-diffProse-04 | 변경본에 새 파일과 삭제 파일, 심볼릭 링크 | 새 일반 파일만 검사하고 삭제·링크 내용은 읽지 않음 |
| UT-diffProse-05 | 입력 경로가 없거나 디렉터리가 아님 | 오류를 던짐 |
| UT-diffProse-06 | 내용이 같은 문서 한 개와 새 문서 한 개 | 새 문서만 대조하고 `checkedFiles`는 1 |
