<div align="center">
  <img src="docs/assets/bab.svg" width="96" height="96" alt="밥그릇 위에 명세서가 놓인 bab 로고">
  <h1>bab</h1>
  <p>에이전트와 바꿀 동작을 정하고, 구현과 검증까지 진행합니다.</p>
  <p>Claude Code · Codex · GitHub Actions</p>
  <p><a href="README.md">English</a> · <a href="README.ko.md">한국어</a></p>
  <p><a href="https://github.com/freevue/bab-skill/releases/tag/v1.0.2">v1.0.2</a> · <a href="LICENSE">MIT</a></p>
</div>

bab은 개발 작업에 쓰는 에이전트 스킬 모음입니다.
바꿀 내용은 GitHub 이슈에 적습니다. 구현 기준은 저장소 안의 `wiki/`에 둡니다. 코드 변경과 검증 결과는 PR에서 확인합니다.

[설치](#설치) · [빠른 시작](#빠른-시작) · [변경 이력](docs/guide.md#변경-이력) · [릴리스 노트](https://github.com/freevue/bab-skill/releases) · [상세 가이드](docs/guide.md)

## 설치

Git으로 관리하고 GitHub에 연결한 프로젝트에서 사용합니다. Git, Node.js 18 이상과 GitHub CLI(`gh`)가 필요합니다.
이슈와 PR을 만들려면 프로젝트의 쓰기 권한이 필요합니다. GitHub CLI에 로그인하지 않았다면 다음 명령을 실행합니다.

```bash
gh auth login
```

사용할 에이전트에 맞는 설치 명령을 실행합니다.

### Claude Code

```bash
claude plugin marketplace add freevue/bab-skill
claude plugin install bab@bab-skill
```

### Codex

플러그인을 지원하는 Codex CLI에서 실행합니다.

```bash
codex plugin marketplace add freevue/bab-skill
codex plugin add bab@bab-skill
```

<a id="사용-예시"></a>

## 빠른 시작

설치 후에는 대상 프로젝트에서 새 채팅을 엽니다. 아래 요청문을 순서대로 입력합니다.
Claude Code에서 직접 명령을 호출할 때는 `/bab:setup`처럼 앞에 `/`를 붙입니다. 스킬이 보이지 않으면 에이전트를 다시 시작합니다.

### 1. 저장소 준비

```text
이 저장소에 bab:setup을 실행해줘. GitHub 라벨도 설치해줘.
```

에이전트가 wiki 폴더, 이슈·PR 템플릿과 CI를 준비합니다. 이 단계는 저장소마다 한 번 진행합니다.
기존 코드부터 명세로 정리하려면 [기존 프로젝트 적용 방법](docs/guide.md#이미-코드가-많은-프로젝트에도-적용할-수-있나요)을 확인합니다.

### 2. 바꿀 동작 정하기

다음은 목록의 페이지 번호를 보정하는 예시입니다. 자신의 작업에서는 문제와 원하는 동작을 바꿔 적습니다.

```text
목록의 페이지 번호가 범위를 벗어나면 빈 화면이 나와.
bab:spec으로 이를 고치는 이슈를 등록해줘. 중요도는 P1이야.
1보다 작으면 첫 페이지, 마지막보다 크면 마지막 페이지를 보여줘.
항목이 없으면 빈 목록을 반환해줘. 빠진 조건은 물어봐줘.
```

에이전트가 확인할 내용을 질문하고 이슈에 정리합니다. 이슈에 정한 변경 내용을 스펙이라고 부릅니다.

### 3. 내용 확인하고 확정하기

이슈의 내용이 원하는 동작과 같은지 읽습니다. 아래의 `#12`는 예시이므로 실제 생성된 이슈 번호로 바꿉니다.
동의하면 다음처럼 요청합니다. 수정할 내용이 있으면 먼저 이슈를 고칩니다.

```text
이슈 #12의 페이지 번호 처리에 동의해.
bab:spec으로 사유를 기록하고 이슈를 확정해줘.
```

### 4. 구현하고 PR 확인하기

```text
bab:sync 12로 wiki, 테스트와 구현을 진행해줘.
검증 후 커밋·푸시하고 PR을 열어줘. PR에 변경 내용과 테스트 결과를 남겨줘.
현재 PR 커밋의 CI도 확인해줘.
```

에이전트가 구현 기준인 wiki를 먼저 쓰고 테스트와 코드를 맞춥니다.
완료되면 PR의 변경 내용과 검증 결과를 읽고 머지 여부를 정합니다. 다음 작업에서는 2~4단계를 반복합니다.

## 시각화

복잡한 흐름이나 관계는 `bab:wiki`에 그림으로 설명해 달라고 요청할 수 있습니다.
[사용 방법과 예시](docs/guide.md#시각화)에서 상태 전이, 코드 실행과 데이터 흐름 등을 비교합니다.

## 업데이트

기존 설치를 갱신하려면 [업데이트 절차](docs/guide.md#플러그인과-ci-업데이트)를 따릅니다.
설치 범위, 고정 태그와 GitHub Actions의 버전을 확인하는 방법도 가이드에 있습니다.

## 변경 이력

[버전별 변경 요약](docs/guide.md#변경-이력)에서 무엇이 바뀌었는지 확인합니다.
배포별 검증 결과와 업데이트 방법은 [릴리스 노트](https://github.com/freevue/bab-skill/releases)에 있습니다.

[스킬별 사용처](docs/workflow.md#스킬-목록) · [선택 설정](docs/guide.md#선택-설정) · [검사 범위와 한계](docs/guide.md#현재-한계)
