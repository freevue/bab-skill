#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { readMilestoneConfig } from './read-config.mjs'

const readRemote = (endpoint) => JSON.parse(execFileSync('gh', ['api', endpoint], {
  encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'],
}))
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }
const count = (value) => Number.isSafeInteger(value) && value >= 0

/** 현재 저장소의 마일스톤을 읽습니다. @see wiki/unit/milestone/inspectMilestones.md */
export function inspectMilestones(repoRoot, repository, request = readRemote) {
  const config = readMilestoneConfig(repoRoot)
  if (!config.enabled) return config
  requireValue(typeof repository === 'string' && repository.toLowerCase() === config.repository.toLowerCase(),
    '마일스톤 설정과 대상 저장소가 다릅니다. GH_REPO=OWNER/REPO를 확인하세요')
  if (config.current === null) return config
  const milestone = request(`repos/${repository}/milestones/${config.current}`)
  requireValue(milestone && milestone.number === config.current, '마일스톤 응답 번호가 잘못됐습니다')
  requireValue(['open', 'closed'].includes(milestone.state), '마일스톤 응답 상태가 잘못됐습니다')
  requireValue(typeof milestone.title === 'string' && milestone.title.trim(), '마일스톤 제목이 비어 있습니다')
  requireValue(milestone.description === null || typeof milestone.description === 'string', '마일스톤 설명이 잘못됐습니다')
  requireValue(typeof milestone.html_url === 'string'
    && ['http:', 'https:'].includes(new URL(milestone.html_url).protocol), '마일스톤 주소가 잘못됐습니다')
  requireValue(count(milestone.open_issues) && count(milestone.closed_issues), '마일스톤 항목 수가 잘못됐습니다')
  return { enabled: true, repository: config.repository, current: {
    number: milestone.number, title: milestone.title, description: milestone.description ?? '',
    state: milestone.state, url: milestone.html_url,
    openIssues: milestone.open_issues, closedIssues: milestone.closed_issues,
  } }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    requireValue(process.argv.length === 3, '사용법: GH_REPO=OWNER/REPO node read-milestones.mjs <저장소 루트>')
    process.stdout.write(`${JSON.stringify(inspectMilestones(process.argv[2], process.env.GH_REPO), null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`마일스톤 조회 오류: ${error.message}\n`)
    process.exitCode = 2
  }
}
