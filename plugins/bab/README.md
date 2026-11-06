# bab

bab은 이슈, PR, LLM Wiki로 스펙을 기록하고, 코드를 wiki 명세에 맞추는 SDD/AIDD 플러그인입니다. 사람은 이슈를 확정하고 PR을 머지합니다. 에이전트는 그 사이에서 wiki를 쓰고, 코드를 명세에 맞추고, PR을 엽니다.

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

개념, 사용 순서, wiki 구조, 자주 묻는 질문은 저장소 루트의 [README](../../README.md)에 있습니다.
