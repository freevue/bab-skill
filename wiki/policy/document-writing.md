---
name: document-writing
type: policy
issues: [33, 34]
code: []
---

# 한글 스펙과 명세의 작성

스펙은 합의와 결정 이력을 기록합니다. wiki 명세는 현재 개발 형상의 기준을 기록합니다.
두 문서는 같은 한글 작성 규칙을 따르며, 문장을 고쳐도 합의한 조건과 동작을 보존합니다.

## 규칙

| ID | 규칙 | 근거 |
| --- | --- | --- |
| POL-document-01 | 한글 스펙과 wiki는 [한글 작성 규칙](../../plugins/bab/skills/wiki/references/writing-rules.md)을 따릅니다. 이 규칙은 ASD-STE100의 일부 원칙을 한국어에 맞게 차용한 것이며 공식 영문 규격의 준수 판정은 아닙니다 | #33 |
| POL-document-02 | 이슈·wiki 템플릿의 제목과 표, 식별자·명령·경로·오류 문구·사실을 보존합니다. 문장 수정을 이유로 합의한 제약과 완료 기준을 바꾸지 않습니다 | #33 |
| POL-document-03 | 필요한 용어를 처음 쓸 때 정의하고 같은 대상을 같은 이름으로 부릅니다. 프로젝트의 도메인 용어가 있으면 그 정본을 따릅니다 | #33 |
| POL-document-04 | 문장은 조건, 행위자, 동작과 관찰 가능한 결과를 읽는 순서대로 적습니다. 한 문장에는 한 가지 사실이나 지시를 적습니다 | #33 |
| POL-document-05 | 절차와 설명 문장을 구분합니다. 절차는 20어절, 설명은 25어절, 한 문단은 6문장을 기준으로 확인합니다. 한국어 어절은 영문 단어 수의 번안 기준입니다 | #33 |
| POL-document-06 | spec과 wiki는 작성 직후 규칙을 적용합니다. sync는 합의한 의미를 보존했는지 대조하고 audit은 문장 검사와 읽기 판단의 근거를 구분합니다 | #33 |
| POL-document-07 | 기계 검사는 판정 가능한 표현·길이·문단만 보고합니다. 용어 의미, 정보 순서와 명세의 완결성은 사람이 읽고 확인합니다. 검사 통과만으로 공식 규격 준수를 주장하지 않습니다 | #33 |
| POL-document-08 | 기존 문서 전체를 문장 규칙만으로 다시 쓰지 않습니다. 변경한 범위에서 의미와 출처를 대조하고, 검사하지 않은 범위는 미검증으로 남깁니다 | #33 |
| POL-document-09 | PR은 기준본에 없는 문장 규칙 위반을 보고합니다. 기존 위반과 문장 검사 결과는 머지 차단이나 의미 검증의 근거로 쓰지 않습니다. 검사 실행 오류는 실패로 남깁니다 | #34 |

공식 규격의 영문 규칙과 사전은 [ASD-STE100 Issue 9](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf)에서 확인합니다.
어떤 규칙을 차용하고 제외했는지는 [한글 작성 규칙](../../plugins/bab/skills/wiki/references/writing-rules.md#asd-ste100에서-차용한-범위)에 기록합니다.

## 적용 기능

| 기능 | 적용 규칙 |
| --- | --- |
| [bab spec](../../plugins/bab/skills/spec/SKILL.md), [bab wiki](../../plugins/bab/skills/wiki/SKILL.md) | POL-document-01~05 |
| [bab sync](../../plugins/bab/skills/sync/SKILL.md), [bab audit](../../plugins/bab/skills/audit/SKILL.md) | POL-document-06~08 |
| [PR 문서 품질 리포트](../feature/document-quality-report.md) | POL-document-09 |
