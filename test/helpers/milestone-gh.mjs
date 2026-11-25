#!/usr/bin/env node
import { appendFileSync, readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const data = JSON.parse(readFileSync(process.env.BAB_MILESTONE_FIXTURE, 'utf8'))
appendFileSync(process.env.BAB_MILESTONE_CALLS, `${JSON.stringify(args)}\n`)
const endpoint = args.find((argument) => argument.startsWith('repos/'))
if (args[0] === 'repo' && args[1] === 'view') {
  process.stdout.write('example/app\n')
} else if (args[0] === 'api' && endpoint?.includes('/milestones/')) {
  if (data.milestoneError) {
    process.stderr.write('원격 조회 실패\n')
    process.exitCode = 1
  } else process.stdout.write(JSON.stringify(data.milestone))
} else if (args[0] === 'api' && endpoint?.includes('/issues?')) {
  const label = new URL(`https://api.github.com/${endpoint}`).searchParams.get('labels')
  const pages = label === 'status:decided' ? data.decided : data.inProgress
  const selected = args.includes('--paginate') ? pages : pages.slice(0, 1)
  const failure = data.failure?.label === label ? data.failure : null
  const emitted = failure ? selected.slice(0, failure.page) : selected
  let output = args.includes('--jq')
    ? emitted.flat().map((entry) => JSON.stringify(entry)).join('\n')
    : JSON.stringify(args.includes('--slurp') ? emitted : emitted[0])
  if (data.finalNewline !== false) output = `${output}\n`
  if (data.invalidJsonLabel === label) output = `${output}{잘못된 JSON}\n`
  if (data.chunkBytes) {
    const bytes = Buffer.from(output)
    for (let offset = 0; offset < bytes.length; offset += data.chunkBytes) {
      process.stdout.write(bytes.subarray(offset, offset + data.chunkBytes))
    }
  } else process.stdout.write(output)
  if (failure) {
    process.stderr.write('후속 페이지 조회 실패\n')
    process.exitCode = 1
  }
} else {
  process.stderr.write('지원하지 않는 테스트 호출\n')
  process.exitCode = 1
}
