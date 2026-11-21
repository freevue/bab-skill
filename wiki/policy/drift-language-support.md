---
name: drift-language-support
type: policy
issues: [24]
---

# 언어별 형상 검사

자동 검사기는 판독 한계와 실제 위반을 구분합니다. 사람이 보완할 미검증을 통과로 기록하지 않습니다.

## 규칙

| ID | 규칙 |
| --- | --- |
| POL-drift-language-01 | 구현 언어는 확장자로 판정하고 명세 표기는 별칭을 정규화해 대조합니다 |
| POL-drift-language-02 | JavaScript·TypeScript는 기존 선언 범위만 검사하고 Rust 파서는 추가하지 않습니다 |
| POL-drift-language-03 | 미지원·판정 불가·언어 혼합은 미검증이며 표기 충돌은 실제 문서 위반과 미검증입니다 |
| POL-drift-language-04 | 문서 구조·필수 내용·링크·파일 존재 검사는 언어와 관계없이 유지합니다 |
| POL-drift-language-05 | 실제 위반과 미검증은 별도 목록이며 미검증 페이지를 중복 집계하지 않습니다 |
| POL-drift-language-06 | 입력·실행 오류, 실제 위반, 미검증, 대상 없음, 성공 순서로 종료 코드를 정합니다 |
| POL-drift-language-07 | PR은 기존 미검증이 남아 있어도 코드 4이며 새 위반이면 코드 1입니다 |
| POL-drift-language-08 | 이전·잘못된 JSON을 소비하거나 코드 2를 파일 크기만으로 무시하지 않습니다 |
| POL-drift-language-09 | 미검증·검사 근거 없는 기존 이슈를 해소·종료하지 않습니다 |
| POL-drift-language-10 | 이슈 동기화 성공과 형상 검증 성공을 구분합니다 |

## 적용 기능

| 기능 | 적용 |
| --- | --- |
| [언어별 드리프트 검사](../feature/drift-language-support.md) | 판정·보고서·PR 비교·감시에 적용합니다 |
