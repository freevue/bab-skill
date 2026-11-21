import { normalizeText } from '../../skills/audit/scripts/frontmatter.mjs'

export const CREATE_LIMIT = 10
const RESOLVED_PREFIX = '<!-- bab-drift-resolved -->\n'
const MARKER_PATTERN = /<!-- bab-drift: (.+?) -->/
const FINDINGS_PATTERN = /^<!-- bab-drift-findings:start -->\n[\s\S]*?^<!-- bab-drift-findings:end -->$/m

const buildFindings = (items) =>
  [
    '<!-- bab-drift-findings:start -->',
    '',
    '| 종류 | 내용 |',
    '| --- | --- |',
    ...items.map(({ kind, message }) => `| ${kind} | ${message} |`),
    '',
    '<!-- bab-drift-findings:end -->',
  ].join('\n')

const updateFindings = (body, items) => {
  const activeBody = body.startsWith(RESOLVED_PREFIX) ? body.slice(RESOLVED_PREFIX.length) : body
  const findings = buildFindings(items)
  if (FINDINGS_PATTERN.test(activeBody)) return activeBody.replace(FINDINGS_PATTERN, () => findings)
  return `${activeBody}\n\n## 현재 드리프트 검사 결과\n\n${findings}\n`
}

/** 실제 위반을 기록하는 드리프트 이슈 본문을 만듭니다. @see wiki/unit/drift/buildBody.md */
export function buildBody(target, items) {
  const wikiPath = target.startsWith('wiki/') ? target : 'wiki/index.md'
  return [
    `<!-- bab-drift: ${target} -->`,
    '# Type',
    '',
    '드리프트',
    '',
    '# Why',
    '',
    `\`${target}\`의 명세와 코드가 어긋났습니다. bab 드리프트 감시가 등록한 이슈입니다.`,
    '',
    '# What',
    '',
    buildFindings(items),
    '',
    '# How',
    '',
    '방향을 고른 뒤 확정합니다. 사람이 해도 되고 에이전트가 해도 됩니다.',
    '',
    '- [ ] 코드를 wiki에 맞춤',
    '- [ ] wiki를 바꿈 (스펙 변경. 이유를 코멘트로 남겨 주세요)',
    '',
    '# Priority',
    '',
    'P2 (다음 주기)',
    '',
    '# Wiki',
    '',
    wikiPath,
    '',
    '# Acceptance',
    '',
    `\`drift-check\`에서 \`${target}\` 항목이 0건`,
    '',
  ].join('\n')
}

/** 검사 완료 범위에서만 이슈 동기화 계획을 만듭니다. @see wiki/unit/drift/planActions.md */
export function planActions(items, openIssues, scope = {}) {
  const blocked = new Set(scope.protectedTargets ?? [])
  const checked = scope.checkedTargets && new Set(scope.checkedTargets)
  const eligible = (target) => !blocked.has(target) && (!checked || checked.has(target))
  const issues = openIssues.map((issue) => ({ ...issue, body: normalizeText(issue.body) }))
    .filter((issue) => eligible(issue.body?.match(MARKER_PATTERN)?.[1]))
  const groups = items.filter(({ target }) => eligible(target)).reduce(
    (grouped, driftItem) =>
      grouped.set(driftItem.target, [...(grouped.get(driftItem.target) ?? []), driftItem]),
    new Map()
  )
  const byTarget = new Map(
    issues
      .map((issue) => [issue.body?.match(MARKER_PATTERN)?.[1], issue])
      .filter(([target]) => target)
  )
  const upserts = [...groups.entries()].map(([target, group]) => {
    const issue = byTarget.get(target)
    if (!issue) return { type: 'create', target, body: buildBody(target, group) }
    const body = updateFindings(issue.body, group)
    return issue.body === body
      ? { type: 'keep', target, number: issue.number }
      : { type: 'update', target, number: issue.number, body }
  })
  const creates = upserts.filter((action) => action.type === 'create')
  const limited = new Set(creates.slice(CREATE_LIMIT))
  const resolved = [...byTarget.entries()]
    .filter(([target]) => !groups.has(target))
    .map(([target, issue]) => {
      const labels = issue.labels.map((label) => label.name)
      if (labels.includes('status:proposed')) {
        const statusLabels = labels.filter((label) => label.startsWith('status:'))
        return { type: 'close', target, number: issue.number, statusLabels }
      }
      if (issue.body.startsWith(RESOLVED_PREFIX))
        return { type: 'keep', target, number: issue.number }
      return {
        type: 'mark',
        target,
        number: issue.number,
        body: `${RESOLVED_PREFIX}${issue.body}`,
      }
    })
  return [
    ...upserts.map((action) => (limited.has(action) ? { ...action, type: 'skip' } : action)),
    ...resolved,
  ]
}
