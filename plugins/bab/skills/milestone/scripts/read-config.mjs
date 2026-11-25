import { lstatSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repositoryPattern = /^[a-z0-9][a-z0-9_.-]*\/[a-z0-9][a-z0-9_.-]*$/i

/** 선택형 마일스톤 설정을 검사합니다. @see wiki/unit/milestone/readMilestoneConfig.md */
export function readMilestoneConfig(repoRoot) {
  const disabled = { enabled: false, current: null }
  const directory = lstatSync(join(repoRoot, '.bab'), { throwIfNoEntry: false })
  if (!directory) return disabled
  if (!directory.isDirectory()) throw new Error('.bab은 일반 폴더여야 합니다')
  const path = join(repoRoot, '.bab/milestones.json')
  const file = lstatSync(path, { throwIfNoEntry: false })
  if (!file) return disabled
  if (!file.isFile()) throw new Error('milestones.json은 일반 파일이어야 합니다')
  const config = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))
  if (!config || Array.isArray(config) || typeof config !== 'object' || config.version !== 1) {
    throw new Error('마일스톤 설정 version은 1이어야 합니다')
  }
  if (typeof config.repository !== 'string' || !repositoryPattern.test(config.repository)) {
    throw new Error('마일스톤 repository는 owner/repo 형식이어야 합니다')
  }
  if (config.current !== null && (!Number.isSafeInteger(config.current) || config.current < 1)) {
    throw new Error('마일스톤 current는 양의 안전한 정수 또는 null이어야 합니다')
  }
  return { enabled: true, repository: config.repository, current: config.current }
}
