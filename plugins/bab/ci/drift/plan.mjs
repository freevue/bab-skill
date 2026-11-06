export const CREATE_LIMIT = 10
const RESOLVED_MARKER = '<!-- bab-drift-resolved -->'
const MARKER_PATTERN = /<!-- bab-drift: (.+?) -->/

/**
 * 드리프트 대상 하나에 대한 이슈 본문을 만듭니다. 같은 입력이면 같은 본문입니다.
 */
export function buildBody(target, items) {
  const rows = items.map(({ kind, message }) => `| ${kind} | ${message} |`)
  const wikiPath = target.startsWith('wiki/') ? target : 'wiki/index.md'
  return [
    `<!-- bab-drift: ${target} -->`,
    '### 종류',
    '',
    '드리프트',
    '',
    '### 왜',
    '',
    `\`${target}\`의 명세와 코드가 어긋났습니다. bab 드리프트 감시가 등록한 이슈입니다.`,
    '',
    '### 무엇을',
    '',
    '| 종류 | 내용 |',
    '| --- | --- |',
    ...rows,
    '',
    '### 어떻게',
    '',
    '방향을 하나 고른 뒤 `status:decided`를 붙여 주세요.',
    '',
    '- [ ] 코드를 wiki에 맞춤',
    '- [ ] wiki를 바꿈 (스펙 변경. 이유를 코멘트로 남겨 주세요)',
    '',
    '### 중요도',
    '',
    'P2 (다음 주기)',
    '',
    '### 관련 wiki',
    '',
    wikiPath,
    '',
    '### 검증 기준',
    '',
    `\`drift-check\`에서 \`${target}\` 항목이 0건`,
    '',
  ].join('\n')
}

/**
 * 드리프트 항목과 열린 drift 이슈를 비교해 할 일(생성, 갱신, 종료, 해소 표시)을 계산합니다.
 */
export function planActions(items, openIssues) {
  const groups = items.reduce(
    (grouped, driftItem) =>
      grouped.set(driftItem.target, [...(grouped.get(driftItem.target) ?? []), driftItem]),
    new Map()
  )
  const byTarget = new Map(
    openIssues
      .map((issue) => [issue.body?.match(MARKER_PATTERN)?.[1], issue])
      .filter(([target]) => target)
  )
  const upserts = [...groups.entries()].map(([target, group]) => {
    const body = buildBody(target, group)
    const issue = byTarget.get(target)
    if (!issue) return { type: 'create', target, body }
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
      if (labels.includes('status:proposed')) return { type: 'close', target, number: issue.number }
      if (issue.body.includes(RESOLVED_MARKER))
        return { type: 'keep', target, number: issue.number }
      return {
        type: 'mark',
        target,
        number: issue.number,
        body: `${RESOLVED_MARKER}\n${issue.body}`,
      }
    })
  return [
    ...upserts.map((action) => (limited.has(action) ? { ...action, type: 'skip' } : action)),
    ...resolved,
  ]
}
