#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { COPY_TARGETS, appendSection, copyAsset, ensureWikiFolders, syncLabels } from './steps.mjs'

const ASSETS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets')
const USAGE = 'node setup.mjs <저장소 루트> [--skip-labels] [--dry-run]'

/**
 * 명령행 인자를 저장소 경로와 옵션으로 바꿉니다.
 */
export function parseArgs(argv) {
  const flags = argv.filter((arg) => arg.startsWith('--'))
  const [repoArg] = argv.filter((arg) => !arg.startsWith('--'))
  return {
    repoRoot: repoArg ? resolve(repoArg) : undefined,
    skipLabels: flags.includes('--skip-labels'),
    dryRun: flags.includes('--dry-run'),
  }
}

/**
 * 셋업 단계를 차례로 실행하고 단계별 결과 목록을 돌려줍니다.
 */
export function runSetup({ repoRoot, skipLabels, dryRun }) {
  const files = COPY_TARGETS.map(copyAsset(ASSETS_ROOT, repoRoot, dryRun))
  const folders = ensureWikiFolders(repoRoot, dryRun)
  const section = appendSection(ASSETS_ROOT, repoRoot, dryRun)
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
  if (!options.repoRoot || !existsSync(join(options.repoRoot, '.git'))) {
    process.stderr.write(`git 저장소 루트를 지정하세요.\n사용법: ${USAGE}\n`)
    return 2
  }
  const steps = runSetup(options)
  process.stdout.write(`${formatTable(steps)}\n`)
  return steps.some(({ result }) => result.startsWith('실패')) ? 1 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run(process.argv.slice(2))
}
