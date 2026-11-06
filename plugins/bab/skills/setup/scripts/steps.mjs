import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SECTION_HEADING = '## bab (SDD/AIDD)'
const WIKI_FOLDERS = ['policy', 'feature', 'unit']

export const COPY_TARGETS = [
  ['ISSUE_TEMPLATE/spec.yml', '.github/ISSUE_TEMPLATE/spec.yml'],
  ['pull_request_template.md', '.github/pull_request_template.md'],
  ['wiki/index.md', 'wiki/index.md'],
  ['wiki/log.md', 'wiki/log.md'],
  ['workflows/bab.yml', '.github/workflows/bab.yml'],
]

const step = (target, result) => ({ target, result })

/**
 * 원본 파일을 대상 경로에 복사합니다. 대상이 있으면 덮어쓰지 않고 내용 비교 결과만 돌려줍니다.
 */
export const copyAsset =
  (assetsRoot, repoRoot, dryRun) =>
  ([source, target]) => {
    const sourcePath = join(assetsRoot, source)
    const targetPath = join(repoRoot, target)
    if (existsSync(targetPath)) {
      const same = readFileSync(sourcePath, 'utf8') === readFileSync(targetPath, 'utf8')
      return step(target, same ? '건너뜀' : '차이 있음 (유지)')
    }
    if (dryRun) return step(target, '생성 예정')
    mkdirSync(dirname(targetPath), { recursive: true })
    copyFileSync(sourcePath, targetPath)
    return step(target, '생성')
  }

/**
 * wiki 분류 폴더와 .gitkeep을 만듭니다.
 */
export const ensureWikiFolder = (repoRoot, dryRun) => (folder) => {
  const keepPath = join(repoRoot, 'wiki', folder, '.gitkeep')
  const target = `wiki/${folder}/`
  if (existsSync(join(repoRoot, 'wiki', folder))) return step(target, '건너뜀')
  if (dryRun) return step(target, '생성 예정')
  mkdirSync(dirname(keepPath), { recursive: true })
  writeFileSync(keepPath, '')
  return step(target, '생성')
}

/**
 * wiki 분류 폴더 전체를 만듭니다.
 */
export const ensureWikiFolders = (repoRoot, dryRun) =>
  WIKI_FOLDERS.map(ensureWikiFolder(repoRoot, dryRun))

/**
 * 로컬 에이전트 지침 파일을 고릅니다. CLAUDE.md, AGENTS.md 순서이며 둘 다 없으면 CLAUDE.md입니다.
 */
export function pickInstructionFile(repoRoot) {
  if (existsSync(join(repoRoot, 'CLAUDE.md'))) return 'CLAUDE.md'
  if (existsSync(join(repoRoot, 'AGENTS.md'))) return 'AGENTS.md'
  return 'CLAUDE.md'
}

/**
 * 지침 파일 끝에 bab 섹션을 추가합니다. 같은 제목이 있으면 건너뜁니다.
 */
export function appendSection(assetsRoot, repoRoot, dryRun) {
  const fileName = pickInstructionFile(repoRoot)
  const filePath = join(repoRoot, fileName)
  const current = existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
  if (current.includes(SECTION_HEADING)) return step(fileName, '건너뜀')
  if (dryRun) return step(fileName, current ? '섹션 추가 예정' : '생성 예정')
  const section = readFileSync(join(assetsRoot, 'claude-section.md'), 'utf8')
  writeFileSync(filePath, current ? `${current.trimEnd()}\n\n${section}` : section)
  return step(fileName, current ? '섹션 추가' : '생성')
}

/**
 * gh로 라벨을 만들거나 색과 설명을 맞춥니다. 실패한 라벨은 오류 메시지를 결과에 남깁니다.
 */
export function syncLabels(assetsRoot, repoRoot, dryRun) {
  const labels = JSON.parse(readFileSync(join(assetsRoot, 'labels.json'), 'utf8'))
  return labels.map(({ name, color, description }) => {
    const target = `label ${name}`
    if (dryRun) return step(target, '생성 예정')
    try {
      const args = [
        'label',
        'create',
        name,
        '--color',
        color,
        '--description',
        description,
        '--force',
      ]
      execFileSync('gh', args, { cwd: repoRoot, stdio: 'pipe' })
      return step(target, '생성·갱신')
    } catch (error) {
      const reason = String(error.stderr ?? error.message)
        .trim()
        .split('\n')[0]
      return step(target, `실패: ${reason}`)
    }
  })
}
