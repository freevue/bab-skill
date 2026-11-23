---
name: repository-ci
type: policy
issues: [28]
code: [.github/workflows/test.yml, .github/workflows/bab.yml, plugins/bab/skills/setup/assets/workflows/bab.yml, test/package.test.mjs]
---

# 저장소 CI 검사

저장소 CI는 정해진 회귀 테스트 파일을 실행하고 플러그인 배포 버전을 검사합니다.

## 규칙

| ID | 규칙 | 근거 |
| --- | --- | --- |
| POL-repository-ci-01 | CI와 사용 안내는 `test/*.test.mjs`에 있는 회귀 테스트만 실행합니다. | #28 |
| POL-repository-ci-02 | 플러그인 버전, 저장소 workflow의 `uses` 태그·`bab-ref`, setup workflow의 두 버전 참조는 모두 같은 `vX.Y.Z`를 사용합니다. | #28 |

## 적용 기능

| 기능 | 적용 규칙 |
| --- | --- |
| 저장소 회귀 검사 | POL-repository-ci-01~02 |
