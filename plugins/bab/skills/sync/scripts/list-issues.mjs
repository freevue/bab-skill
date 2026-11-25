import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

const collectIssues = async (lines) => {
  const issues = []
  for await (const line of lines) {
    if (!line.trim()) continue
    const issue = JSON.parse(line)
    if (issue.pull_request) continue
    issues.push({
      number: issue.number, title: issue.title, body: issue.body,
      labels: issue.labels.map(({ name }) => ({ name })),
      milestone: issue.milestone ? { number: issue.milestone.number } : null,
    })
  }
  return issues
}

/** 이슈를 한 건씩 읽고 전체 조회 성공을 확인합니다. @see wiki/unit/sync/listIssues.md */
export async function listIssues(label, repository) {
  const child = spawn('gh', [
    'api', '--paginate', '--jq', '.[] | @json',
    `repos/${repository}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=100`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] })
  const lines = createInterface({ input: child.stdout.setEncoding('utf8'), crlfDelay: Infinity })
  let stderr = ''
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr = `${stderr}${chunk}` })
  const completion = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.stdout.once('error', reject)
    child.stderr.once('error', reject)
    child.once('close', (code, signal) => {
      if (code === 0) return resolve()
      reject(new Error(`gh 이슈 조회 실패 (${signal ?? code}): ${stderr.trim()}`))
    })
  })
  try {
    const [issues] = await Promise.all([collectIssues(lines), completion])
    return issues
  } catch (error) {
    child.kill()
    throw error
  } finally {
    lines.close()
  }
}
