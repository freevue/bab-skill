<div align="center">
  <img src="docs/assets/bab.svg" width="96" height="96" alt="bab logo: a document above a bowl">
  <h1>bab</h1>
  <p>Plan a change with an agent, then implement and review it.</p>
  <p>Claude Code · Codex · GitHub Actions</p>
  <p><a href="README.md">English</a> · <a href="README.ko.md">한국어</a></p>
  <p><a href="https://github.com/freevue/bab-skill/releases/tag/v1.0.2">v1.0.2</a> · <a href="LICENSE">MIT</a></p>
</div>

bab is a set of agent skills for development work.
Record the change in a GitHub issue. Keep implementation contracts in the repository's `wiki/`. Review code changes and test results in a pull request (PR).

[Install](#install) · [Quick start](#quick-start) · [Change history](docs/guide.md#change-history) · [Release notes](https://github.com/freevue/bab-skill/releases) · [Detailed guide](docs/guide.md)

## Install

Use bab in a project managed with Git and hosted on GitHub. You need Git, Node.js 18 or newer, and the GitHub CLI (`gh`).
You need write access to the repository to create issues and PRs. If you are not signed in with the GitHub CLI, run:

```bash
gh auth login
```

Use the installation commands for your agent.

### Claude Code

```bash
claude plugin marketplace add freevue/bab-skill
claude plugin install bab@bab-skill
```

### Codex

Run these commands in a Codex CLI version that supports plugins.

```bash
codex plugin marketplace add freevue/bab-skill
codex plugin add bab@bab-skill
```

## Quick start

After installation, open a new chat in your target project. Enter the requests below in order.
To call a skill directly in Claude Code, add `/`, as in `/bab:setup`. If a skill does not appear, restart the agent.

### 1. Prepare the repository

```text
Run bab:setup in this repository. Install the GitHub labels too.
```

The agent prepares wiki folders, issue and PR templates, and CI. Run this step once per repository.
For existing code, read [Apply bab to an existing project](docs/guide.md#can-i-use-bab-in-a-project-with-existing-code).

### 2. Describe the change

This example keeps page numbers within a valid range. Replace the problem and expected behavior with your own task.

```text
The list shows a blank screen when the page number is out of range.
Use bab:spec to create an issue for this fix. Set priority to P1.
Numbers below 1 must show the first page. Numbers above the last page must show the last page.
If the list is empty, return an empty list. Ask me about any missing decisions.
```

The agent asks about missing decisions and records the change in an issue. This agreed change is the spec.

### 3. Review and approve the spec

Read the issue to make sure that it describes the behavior you want. Replace the example number `#12` with the actual issue number.
If you agree, send the request below. If you want changes, update the issue first.

```text
I approve the page-number behavior in issue #12.
Use bab:spec to record the reason and mark the issue as decided.
```

### 4. Build and review the PR

```text
Use bab:sync 12 to write the wiki, tests, and implementation.
After verification, commit and push the change, then open a PR.
Record the changes and test results in the PR. Check CI for its current commit.
```

The agent writes the wiki contracts first, then matches the tests and code to them.
Read the changes and verification results in the PR before you decide to merge. Repeat steps 2 to 4 for each change.

## Visualization

Ask `bab:wiki` to explain a complex flow or relationship with a diagram.
The [usage guide and examples](docs/guide.md#visualization) compare state transitions, code execution, and data flow.

## Updates

To update an existing installation, follow the [update guide](docs/guide.md#plugin-and-ci-updates).
It covers installation scope, pinned tags, and GitHub Actions versions.

## Change history

Read the [version history](docs/guide.md#change-history) for a summary of changes.
The [release notes](https://github.com/freevue/bab-skill/releases) record verification results and update steps for each release.

[Skill index (Korean)](docs/workflow.md#스킬-목록) · [Optional configuration](docs/guide.md#optional-configuration) · [Check scope and limits](docs/guide.md#current-limits)
