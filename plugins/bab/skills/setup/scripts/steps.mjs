import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SECTION_HEADING = '## bab (SDD/AIDD)'
const WIKI_FOLDERS = ['policy', 'feature', 'unit', 'type']
export const INSTRUCTION_FILES = ['CLAUDE.md', 'AGENTS.md']

export const COPY_TARGETS = [
  ['ISSUE_TEMPLATE/spec.md', '.github/ISSUE_TEMPLATE/spec.md'],
  ['pull_request_template.md', '.github/pull_request_template.md'],
  ['wiki/index.md', 'wiki/index.md'],
  ['wiki/log.md', 'wiki/log.md'],
  ['workflows/bab.yml', '.github/workflows/bab.yml'],
]

const step = (target, result) => ({ target, result })
const fileEntry = (path) => lstatSync(path, { throwIfNoEntry: false })

/**
 * 설치를 시작하기 전에 경로마다 폴더와 파일의 종류를 확인합니다.
 */
export function findUnsafeTarget(repoRoot, fileName) {
  const targets = [
    ...COPY_TARGETS.map(([, target]) => target),
    ...WIKI_FOLDERS.map((folder) => `wiki/${folder}/.gitkeep`),
    fileName,
  ]
  for (const target of targets) {
    const parts = target.split('/')
    for (const [index] of parts.entries()) {
      const localPath = parts.slice(0, index + 1).join('/')
      const entry = fileEntry(join(repoRoot, localPath))
      if (!entry) break
      const valid = index === parts.length - 1 ? entry.isFile() : entry.isDirectory()
      if (!valid) return localPath
    }
  }
  return undefined
}

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
  return INSTRUCTION_FILES.find((fileName) => fileEntry(join(repoRoot, fileName))) ?? 'CLAUDE.md'
}

/**
 * 지침 파일 끝에 bab 섹션을 추가합니다. 기존 섹션은 비교만 합니다.
 */
export function appendSection(assetsRoot, repoRoot, dryRun, fileName) {
  const filePath = join(repoRoot, fileName)
  const current = existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
  const section = readFileSync(join(assetsRoot, 'claude-section.md'), 'utf8')
  const start = current.search(/^## bab \(SDD\/AIDD\)[ \t]*$/m)
  if (start !== -1) {
    const next = current.slice(start + SECTION_HEADING.length).search(/^## /m)
    const end = next === -1 ? current.length : start + SECTION_HEADING.length + next
    const installed = current.slice(start, end).trim()
    return step(fileName, installed === section.trim() ? '건너뜀' : '차이 있음 (유지)')
  }
  if (dryRun) return step(fileName, current ? '섹션 추가 예정' : '생성 예정')
  writeFileSync(filePath, current ? `${current.trimEnd()}\n\n${section}` : section)
  return step(fileName, current ? '섹션 추가' : '생성')
}

/** 기존 CI 호출이 현재 플러그인 버전을 가리키는지 읽기 전용으로 확인합니다. */
export function workflowVersion(repoRoot, version) {
  const path = join(repoRoot, '.github/workflows/bab.yml')
  if (!existsSync(path)) return step('CI 호출 버전', '새 워크플로 생성 대상')
  const source = readFileSync(path, 'utf8')
  const used = source.match(/^[ \t]*uses:[ \t]*freevue\/bab-skill\/\.github\/workflows\/bab-guard\.yml@([^\s#]+)/m)?.[1]
  const reference = source.match(/^[ \t]*bab-ref:[ \t]*([^\s#]+)/m)?.[1]
  const expected = `v${version}`
  const result = used === expected && reference === expected
    ? `일치 (${expected})`
    : `차이 있음 (유지): uses ${used ?? '없음'}, bab-ref ${reference ?? '없음'} → ${expected}`
  return step('CI 호출 버전', result)
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
