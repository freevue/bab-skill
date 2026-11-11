# 저장소 연결 검증 기록

관련 스펙은 [#15](https://github.com/freevue/bab-skill/issues/15)입니다. 검증일은 2026-11-11입니다.

## 로컬 실행

| 검사 | 결과 |
| --- | --- |
| Node 20 전체 `node --test` | 73개 통과, 실패 0개 |
| UT-inspectLinks-01~08 | 목록, 정본 참조, 단일 섹션, 잘못된 입력, 재귀 참조, 제목 경계, 심볼릭 링크, 원격 오류 검사 통과 |
| wiki 드리프트 | 명세 6개 검사, 불일치 0개 |
| 변경 Markdown의 한글 작성 검사 | 위반 없음 |
| 새 link 스킬 형식 검사 | 통과 |
| Claude 플러그인 manifest 검사 | 통과 |
| 변경 문서의 로컬 링크와 `git diff --check` | 통과 |

Node 20은 임시 실행 환경으로 사용했습니다. 프로젝트 의존성과 잠금 파일을 추가하지 않았습니다.

```bash
npm exec --yes --package=node@20 -- node --test
python3 <skill-creator 경로>/scripts/quick_validate.py plugins/bab/skills/link
claude plugin validate plugins/bab
node plugins/bab/ci/drift-check.mjs . --json
git diff --check
```

## 실제 GitHub 읽기

임시 로컬 연결 정본에서 공개 저장소 `freevue/bab-skill`의 계약 하나를 선택했습니다.
`wiki/unit/issue/parsePriority.md`의 `시그니처` 섹션만 읽었습니다.
기준 커밋은 `6d6eb0555782916f4eecbe9d1a4d3fd1b857139d`입니다.
읽기 도구가 592자의 해당 섹션과 전체 SHA를 반환했습니다. 다음 `내부 로직` 섹션이 포함되지 않았음을 확인했습니다.
이 검증은 원격 읽기만 수행했습니다. 다른 프로젝트의 연결 파일과 이슈를 만들거나 바꾸지 않았습니다.

## 절차 확인과 미검증

FT-repository-links-01~07은 스킬 문서를 읽어 절차와 연결 지점을 대조했습니다.
setup은 link를 참조합니다. 기존 repo의 link는 setup 파일을 다시 설치하지 않습니다.
spec은 원본 번호가 생긴 뒤 외부 이슈를 검색·등록합니다. 기존 계약을 사용할 때와 외부 변경이 필요할 때를 구분합니다.
wiki는 내부 issues와 외부 연결 표를 구분합니다. 외부 쓰기는 승인 범위를 따릅니다.

이 확인은 설치된 에이전트가 실제 요청을 수행한 결과가 아닙니다. 관련 repo의 이슈 생성·재사용·갱신은 미검증입니다.
토큰 절감량과 자동 관계 판단의 정확도는 측정하지 않았습니다. 같은 요청의 동시 원격 등록을 막는 잠금은 제공하지 않습니다.
설치본 갱신과 실제 제품 간 통합 검증은 수행하지 않았습니다.
이 기록은 배포 전 검증 범위입니다. 커밋·푸시·PR과 배포 결과는 [v1.0.1 릴리스](https://github.com/freevue/bab-skill/releases/tag/v1.0.1)에서 확인합니다.
