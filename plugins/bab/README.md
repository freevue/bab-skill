# bab

bab은 GitHub 이슈에서 확정한 스펙을 wiki에 기록하고, 코드를 명세에 맞춰 PR로 올리는 Claude Code 플러그인입니다. 이슈가 확정되면 에이전트가 wiki를 갱신하고, 테스트와 코드를 작성합니다. 머지는 저장소의 리뷰와 권한 규칙을 따릅니다.

## 설치

```bash
claude plugin marketplace add freevue/bab-skill
```

```bash
claude plugin install bab@bab-skill
```

설치한 뒤 저장소마다 `/bab:setup`을 한 번 실행합니다.

## 스킬

`setup`, `spec`, `wiki`, `sync`, `audit`, `simple-english` 6개가 있습니다. CI 가드레일, 드리프트 감시, 스펙 큐도 함께 들어 있습니다.

[README](../../README.md)에서 사용 순서를 확인합니다. wiki 구조, CI 설정, 스펙 큐의 자세한 동작은 [상세 가이드](../../docs/guide.md)에 있습니다.
