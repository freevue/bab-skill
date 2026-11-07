# bab

bab은 이슈의 도메인 이력, wiki와 로컬 룰의 개발 형상, PR의 검증 근거를 연결하는 에이전트 스킬 모음입니다. Claude Code와 Codex는 이 디렉터리의 같은 스킬과 검사기를 사용합니다.

## 설치

[루트 README의 설치 안내](https://github.com/freevue/bab-skill/blob/main/README.md#설치)를 따릅니다. 대상 저장소에서 bab setup을 실행합니다. Claude Code는 기존 지침 파일을 사용하며, Codex는 `AGENTS.md`에 지침을 추가합니다.

## 스킬

`setup`, `spec`, `wiki`, `sync`, `audit`, `simple-english` 6개가 있습니다. CI 가드레일, 드리프트 감시, 스펙 큐도 함께 들어 있습니다.

[README](https://github.com/freevue/bab-skill/blob/main/README.md)에서 사용 순서를 확인합니다. wiki 구조, CI 설정, 스펙 큐의 자세한 동작은 [상세 가이드](https://github.com/freevue/bab-skill/blob/main/docs/guide.md)에 있습니다.
