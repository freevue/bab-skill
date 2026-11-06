# bab

bab은 GitHub 이슈에서 확정한 스펙을 wiki에 기록하고 코드를 명세에 맞추는 에이전트 스킬 모음입니다. Claude Code와 Codex는 이 디렉터리의 같은 스킬과 검사기를 사용합니다.

## 설치

[루트 README의 설치 안내](../../README.md#설치)를 따릅니다. 대상 저장소에서 bab setup을 실행합니다. Claude Code는 기존 지침 파일을 사용하며, Codex는 `AGENTS.md`에 지침을 추가합니다.

## 스킬

`setup`, `spec`, `wiki`, `sync`, `audit`, `simple-english` 6개가 있습니다. CI 가드레일, 드리프트 감시, 스펙 큐도 함께 들어 있습니다.

[README](../../README.md)에서 사용 순서를 확인합니다. wiki 구조, CI 설정, 스펙 큐의 자세한 동작은 [상세 가이드](../../docs/guide.md)에 있습니다.
