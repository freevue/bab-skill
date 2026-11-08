# bab

[English README](https://github.com/freevue/bab-skill/blob/main/README.md) · [한국어 README](https://github.com/freevue/bab-skill/blob/main/README.ko.md)

bab은 이슈의 변경 이력, wiki와 로컬 룰의 개발 형상, PR의 검증 근거를 연결합니다. Claude Code와 Codex가 같은 스킬과 검사기를 사용합니다.

## 시작하기

1. [설치 안내](https://github.com/freevue/bab-skill/blob/main/README.ko.md#설치)에 따라 플러그인을 설치합니다.
2. 대상 저장소에서 `bab:setup`을 실행합니다.
3. [사용 예시](https://github.com/freevue/bab-skill/blob/main/README.ko.md#사용-예시)를 따라 이슈를 등록하고 작업합니다.

Claude Code는 기존 지침 파일을 사용합니다. Codex는 `AGENTS.md`에 bab 지침을 추가합니다.

## 스킬

| 스킬 | 역할 |
| --- | --- |
| `setup` | 저장소 준비 |
| `issues` | 현재 이슈를 상태·중요도별 표로 조회 |
| `spec` | 스펙 등록·확정·상태 변경 |
| `wiki` | 개발 형상 명세 작성 |
| `sync` | 확정 이슈의 wiki·구현·PR 작업 |
| `audit` | 명세·코드·PR 검증 |
| `simple-english` | 영문 문서 정리 |

CI 가드레일, 드리프트 감시, 원격 선점을 쓰는 스펙 큐도 포함합니다. 명세 페이지가 없으면 검사 대상이 없다고 표시합니다. 자세한 동작은 [상세 가이드](https://github.com/freevue/bab-skill/blob/main/docs/guide.md)를 읽습니다.
