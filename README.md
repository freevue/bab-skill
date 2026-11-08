<div align="center">
  <img src="docs/assets/bab.svg" width="112" height="112" alt="bab logo: a document above a bowl">
  <h1>bab</h1>
  <p>Record why a change exists. Build from the wiki. Review the evidence in a pull request.</p>
  <p><sub>Claude Code · Codex · GitHub Actions</sub></p>
  <p><a href="README.md">English</a> · <a href="README.ko.md">한국어</a></p>
  <p>
    <a href="#quick-start">Quick start</a> ·
    <a href="#install">Install</a> ·
    <a href="#walk-through">Walk-through</a> ·
    <a href="docs/workflow.md">Workflow guide</a>
  </p>
  <p>
    <a href="https://github.com/freevue/bab-skill/actions/workflows/test.yml">
      <img src="https://github.com/freevue/bab-skill/actions/workflows/test.yml/badge.svg?branch=main" alt="Regression test status">
    </a>
  </p>
  <p><a href="https://github.com/freevue/bab-skill/releases/tag/v0.9.0">v0.9.0 release</a> · <a href="docs/guide.md#라이선스">MIT</a></p>
</div>

## What bab records

bab connects three records. Each record has a different job.

| Record | Question it answers |
| --- | --- |
| GitHub issue | What changed, why, and what decisions led here? |
| Repository wiki and local rules | What names, types, behavior, and code rules define the current build? |
| Pull request (PR) | What was added, changed, or removed, and what evidence supports it? |

The wiki is a set of versioned files in the repository. A unit is one function. Its wiki page must define every parameter, type, branch, and failure result. The local rules define how to write the code. An agent must be able to rebuild the unit from those documents.

## Quick start

Use `setup → spec → sync → PR`. Run setup once per repository. Repeat the other steps for each change.

| Step | Call | Result |
| --- | --- | --- |
| 1. Prepare | `bab:setup` | Add the wiki folders, GitHub templates, workflow, and agent instructions. |
| 2. Decide | `bab:spec` | Record the proposed change in an issue and decide when work can start. |
| 3. Build | `bab:sync 12` | Write the wiki, tests, and code for decided issue #12. Then audit the result. |
| 4. Review | Review the PR | Read the changes and test evidence. Merging a PR with `Closes #12` closes issue #12. |

### Issue status

An open spec issue has one `status:*` label. This label tracks the work, while the wiki and local rules define the current code.

| Stage | GitHub issue | What happens next |
| --- | --- | --- |
| Proposed | Open + `status:proposed` | Review the change and record the decision. |
| Decided | Open + `status:decided` | `bab:sync` can start work. |
| In progress | Open + `status:in-progress` | Sync writes the wiki, tests, code, and PR evidence. |
| Completed | Closed as completed | A merged PR with `Closes #12` closes issue #12. |
| Canceled | Closed as not planned | Keep the reason in the issue history. |
| Reopened | Open + `status:proposed` | Review the spec and decide again. |

When work stops, `blocked` marks the reason. It is a separate label, not another `status:*` value. CI removes `status:*` labels from closed issues. Record the reason for each status change in an issue comment. See the [status rules](docs/guide.md#상태와-라벨) for details.

### From proposal to decision

1. Ask `bab:spec` to read the issue and its decision comments. Make sure that `Why`, `What`, `How`, `Wiki`, `Acceptance`, and one priority (`P0` to `P3`) are present.
2. If a decision is missing, answer the agent's question and update the issue. Keep `status:proposed` until you approve the spec.
3. After you approve it, ask the agent to comment with the reason. Then change `status:proposed` to `status:decided`.

Complete fields alone do not authorize a status change.

Run `bab:issues` to see open work. Run `bab:sync next` to pick the next decided issue. If you call `bab:spec` without a task, the agent asks what you want to change.

## Install

You need Git, Node.js 18 or newer, and an authenticated GitHub CLI (`gh`). The agent needs repository write access for issues, labels, PRs, and remote work claims.

### Claude Code

~~~bash
claude plugin marketplace add freevue/bab-skill
claude plugin install bab@bab-skill
~~~

Open the target repository in Claude Code. Run `/bab:setup`. If no instruction file exists, setup creates `CLAUDE.md`.

### Codex

Use a Codex CLI version that supports plugins.

~~~bash
codex plugin marketplace add freevue/bab-skill
codex plugin add bab@bab-skill
~~~

Open a new Codex chat in the target repository and select `bab:setup`. Restart Codex if the skill does not appear. Codex setup adds the bab section to `AGENTS.md`.

If you use both agents, link `AGENTS.md` and `CLAUDE.md` to the same project rules. Setup does not create code conventions or a `GEMINI.md` file.

Setup asks about Husky only when the repository has a root `package.json` and no Husky installation. It keeps existing hooks and the `prepare` script. Running `setup.mjs` directly does not ask questions or install Husky.

## Walk-through

These examples are messages for an agent in your target repository. Claude Code uses commands such as `/bab:spec`. In Codex, select the skill with the same name.

### 1. Look at the issues

~~~text
Use bab:issues to show the open issues in this repository.
~~~

The read-only result uses a table:

| State | Priority | Issue |
| --- | --- | --- |
| In progress | P1 | [#24 Add order filters](https://github.com/owner/repo/issues/24) |
| Decided | P2 | [#12 Keep page numbers in range](https://github.com/owner/repo/issues/12) |
| Proposed | P2 | [#30 Add notification settings](https://github.com/owner/repo/issues/30) |

### 2. Record a change

Here is a request for a list whose old links can point past the last page:

~~~text
Use bab:spec to create an issue for page number handling.
Numbers below 1 must show the first page.
Numbers above the last page must show the last page.
An empty list must return without an error.
Record the affected wiki pages and test cases. Set priority to P1.
Ask me about any missing decision before you create the issue.
~~~

The issue records the reason, expected result, affected wiki paths, and acceptance criteria. Assume that GitHub creates issue #12. First, ask the agent to review it:

~~~text
Use bab:spec to review issue #12 before deciding it.
Look for missing decisions in Why, What, How, Wiki, Acceptance, and Priority.
Ask me about any gap. Keep the issue Proposed until I approve it.
~~~

After you agree with the issue, approve the state change:

~~~text
I approve the page-number behavior in issue #12.
Use bab:spec to record the reason in an issue comment.
Then change its label from status:proposed to status:decided.
~~~

### 3. Build from the wiki

~~~text
Use bab:sync 12.
Write the wiki pages first, then failing tests and the code.
Audit the change. Commit and push it, then open a PR.
List added, changed, and removed pages in the PR.
For each acceptance criterion, link a wiki rule or test case to its result.
Check CI for the current PR commit.
~~~

Sync reads the decided issue. It writes exact wiki contracts before code. A test case (TC) names an observable result. For example, `page=9` becomes page 3 when a list has three pages.

If the agent can change the remote repository, sync claims the repository before it starts. A second agent cannot claim it at the same time. Sync releases the claim when work ends. A stopped agent can leave a claim behind. See the [claim recovery steps](plugins/bab/skills/sync/SKILL.md#큐-모드-next).

### 4. Review the PR

The PR template records each wiki or rule change as added, changed, or removed. It also connects each issue criterion to a TC, command, result, or CI link. Mark anything you did not run as unverified. Do not copy raw secrets or personal data into issues, wiki pages, PRs, or logs.

## Wiki and audit

The wiki index points to the exact policy, feature, unit, and type pages. Put each page in the correct section once. A unit page defines the function name, parameters, types, defaults, logic order, usage, and TCs. The [templates](plugins/bab/skills/wiki/templates/) show the required fields. There is no short form for a unit.

A feature with a user interface or asynchronous events can add state and event tables to its flow. The [UI and async pattern](plugins/bab/skills/wiki/references/ui-async-pattern.md) shows the table shape. Unit contracts stay complete.

For existing code, ask `bab:wiki` to document one selected area before you start new spec work:

~~~text
Use bab:wiki to document the public functions in src/list/.
Write their contracts, callers, and existing tests.
Mark policy inferred from code as a proposal.
~~~

Use `bab:audit` to compare an issue, wiki, local rules, code, and PR. You can also ask it to rebuild one unit from wiki and local rules alone:

~~~text
Use bab:audit on PR #20.
Compare the actual changes with the decided issue and the wiki.
Report rule violations and unverified acceptance criteria.
~~~

~~~text
Use bab:audit to rebuild clampPage from wiki/unit/list/clampPage.md
and the local rules. Do not read the old code or tests until the rebuild ends.
Run the wiki test cases, then compare the result with the old code.
~~~

The drift checker returns `status: no-target` when the wiki has no spec pages. It returns `status: pass` only after it checks at least one page. It does not run tests or judge the meaning of internal logic. Audit reports those limits separately. The [check scope](docs/guide.md#드리프트-감시) explains the rules.

## Setup and updates

From a checkout of bab, run setup in dry-run mode. Replace the target path with your repository path:

~~~bash
node plugins/bab/skills/setup/scripts/setup.mjs /path/to/target --instructions AGENTS.md --skip-labels --dry-run
~~~

The result shows the plugin version, differences in existing files, and the `uses` and `bab-ref` values in the CI workflow. Setup keeps custom instructions and templates. Apply the changes you want after you review them.

A repository that uses the reusable GitHub workflow must set both values to `v0.9.0`. See the [workflow template](plugins/bab/skills/setup/assets/workflows/bab.yml).

If you pinned the Claude Code marketplace to an old tag, add the new tag at the same installation scope. Then update the plugin:

~~~bash
claude plugin marketplace add 'freevue/bab-skill#v0.9.0' --scope local
claude plugin update bab@bab-skill --scope local
~~~

If you pinned the Codex marketplace to an old tag, replace that marketplace entry. Then add the plugin again:

~~~bash
codex plugin marketplace remove bab-skill
codex plugin marketplace add freevue/bab-skill --ref v0.9.0
codex plugin add bab@bab-skill
~~~

Use your original Claude Code scope if it was `user` or `project`. The [Korean update guide](README.ko.md#업데이트) has more detail.

## Skill and document index

| Skill | Use |
| --- | --- |
| [setup](plugins/bab/skills/setup/SKILL.md) | Prepare a repository and compare installed instructions. |
| [issues](plugins/bab/skills/issues/SKILL.md) | Show the issue queue as a table. |
| [spec](plugins/bab/skills/spec/SKILL.md) | Record and decide a domain change. |
| [wiki](plugins/bab/skills/wiki/SKILL.md) | Write policy, feature, unit, type, and TC pages. |
| [sync](plugins/bab/skills/sync/SKILL.md) | Build a decided issue and collect PR evidence. |
| [audit](plugins/bab/skills/audit/SKILL.md) | Compare records and rebuild a unit from documentation. |
| [simple-english](plugins/bab/skills/simple-english/SKILL.md) | Write clear English documentation. |

Read the [workflow guide](docs/workflow.md) for the step order and the [full guide](docs/guide.md) for rules and limits. The [parsePriority unit](wiki/unit/issue/parsePriority.md) and its [rebuild record](docs/verification/parse-priority.md) show a complete example.

To run the repository tests, use Node.js 20:

~~~bash
node --test
~~~
