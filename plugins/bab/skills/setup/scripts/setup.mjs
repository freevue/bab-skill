#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  COPY_TARGETS,
  INSTRUCTION_FILES,
  appendSection,
  copyAsset,
  ensureWikiFolders,
  findUnsafeTarget,
  pickInstructionFile,
  syncLabels,
} from './steps.mjs'

const ASSETS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets')
const USAGE = 'node setup.mjs <저장소 루트> [--instructions AGENTS.md|CLAUDE.md] [--skip-labels] [--dry-run]'

/**
 * 명령행 인자를 저장소 경로와 옵션으로 바꿉니다.
 */
export function parseArgs(argv) {
  const args = [...argv]
  const options = { skipLabels: false, dryRun: false }
  while (args.length > 0) {
    const arg = args.shift()
    if (arg === '--skip-labels') options.skipLabels = true
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--instructions') {
      const fileName = args.shift()
      if (options.instructions || !INSTRUCTION_FILES.includes(fileName)) return undefined
      options.instructions = fileName
    } else {
      if (!arg || arg.startsWith('-') || options.repoRoot) return undefined
      options.repoRoot = resolve(arg)
    }
  }
  return options
}

/**
 * 셋업 단계를 차례로 실행하고 단계별 결과 목록을 돌려줍니다.
 */
export function runSetup({ repoRoot, skipLabels, dryRun, instructions }) {
  const fileName = instructions ?? pickInstructionFile(repoRoot)
  if (!INSTRUCTION_FILES.includes(fileName)) {
    return [{ target: '지침 파일', result: '실패: AGENTS.md 또는 CLAUDE.md를 지정하세요' }]
  }
  const unsafeTarget = findUnsafeTarget(repoRoot, fileName)
  if (unsafeTarget) {
    return [{ target: unsafeTarget, result: '실패: 심볼릭 링크이거나 파일 종류가 올바르지 않습니다' }]
  }
  const files = COPY_TARGETS.map(copyAsset(ASSETS_ROOT, repoRoot, dryRun))
  const folders = ensureWikiFolders(repoRoot, dryRun)
  const section = appendSection(ASSETS_ROOT, repoRoot, dryRun, fileName)
  const labels = skipLabels
    ? [{ target: 'labels', result: '건너뜀 (--skip-labels)' }]
    : syncLabels(ASSETS_ROOT, repoRoot, dryRun)
  return [...files, ...folders, section, ...labels]
}

const formatTable = (steps) =>
  [
    '| 항목 | 결과 |',
    '| --- | --- |',
    ...steps.map(({ target, result }) => `| ${target} | ${result} |`),
  ].join('\n')

const run = (argv) => {
  const options = parseArgs(argv)
  if (!options?.repoRoot || !existsSync(join(options.repoRoot, '.git'))) {
    process.stderr.write(`git 저장소 루트와 올바른 옵션을 지정하세요.\n사용법: ${USAGE}\n`)
    return 2
  }
  const steps = runSetup(options)
  process.stdout.write(`${formatTable(steps)}\n`)
  return steps.some(({ result }) => result.startsWith('실패')) ? 1 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run(process.argv.slice(2))
}
