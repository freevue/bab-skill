#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { normalizeText } from '../../audit/scripts/frontmatter.mjs'

const LINK_PATH = '.bab/links.json'
const REPOSITORY = /^[a-z0-9][a-z0-9_.-]*\/[a-z0-9][a-z0-9_.-]*$/i
const oneLine = (value) => typeof value === 'string' && value.trim() && !/[\r\n]/.test(value)
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }
const parseJson = (text) => JSON.parse(normalizeText(text))

const validateCatalog = (manifest) => {
  requireValue(record(manifest) && manifest.version === 1, '연결 규약 version은 1이어야 합니다')
  requireValue(!Object.hasOwn(manifest, 'source'), '정본 참조는 한 번만 허용합니다')
  requireValue(Array.isArray(manifest.repositories) && manifest.repositories.length > 0, '저장소 목록이 비어 있습니다')
  const repositories = new Set()
  for (const entry of manifest.repositories) {
    requireValue(record(entry) && typeof entry.repository === 'string' && REPOSITORY.test(entry.repository), '저장소는 owner/repo 형식이어야 합니다')
    const identity = entry.repository.toLowerCase()
    requireValue(!repositories.has(identity), '저장소 주소가 중복됐습니다')
    repositories.add(identity)
    requireValue(oneLine(entry.responsibility) && Array.isArray(entry.contracts), '담당 영역과 계약 목록이 필요합니다')
    const contracts = new Set()
    for (const contract of entry.contracts) {
      requireValue(record(contract) && typeof contract.id === 'string' && /^[a-z][a-z0-9-]*$/.test(contract.id), '계약 식별자가 잘못됐습니다')
      requireValue(!contracts.has(contract.id), '계약 식별자가 중복됐습니다')
      contracts.add(contract.id)
      requireValue(oneLine(contract.summary) && oneLine(contract.section), '계약 설명과 섹션이 필요합니다')
      const path = contract.path
      requireValue(typeof path === 'string' && path.startsWith('wiki/') && path.endsWith('.md'), '계약 경로는 wiki 아래 Markdown이어야 합니다')
      requireValue(!/[\\?#%:\u0000-\u001f]/.test(path) && path.split('/').every((part) => part && part !== '.' && part !== '..'), '계약 경로가 잘못됐습니다')
    }
  }
  return manifest.repositories.map(({ repository, responsibility, contracts }) => ({
    repository, responsibility,
    contracts: contracts.map(({ id, summary, path, section }) => ({ id, summary, path, section })),
  }))
}

const readRemote = (repository, path) => {
  const options = { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }
  const api = (endpoint) => {
    try { return parseJson(execFileSync('gh', ['api', endpoint], options)) }
    catch { throw new Error(`원격 파일을 읽지 못했습니다: ${repository}/${path}`) }
  }
  const { sha } = api(`repos/${repository}/commits/HEAD`)
  requireValue(typeof sha === 'string' && /^[a-f0-9]{40}$/.test(sha), '원격 커밋 SHA가 잘못됐습니다')
  const encodedPath = path.split('/').map((part) => encodeURIComponent(part)).join('/')
  const file = api(`repos/${repository}/contents/${encodedPath}?ref=${sha}`)
  requireValue(file.type === 'file' && file.encoding === 'base64' && typeof file.content === 'string', '원격 응답이 일반 파일이 아닙니다')
  return { repository, path, ref: sha, text: Buffer.from(file.content, 'base64').toString('utf8') }
}

const readSection = (text, section) => {
  const lines = normalizeText(text).split('\n')
  const headings = []
  let fence
  for (const [index, line] of lines.entries()) {
    if (fence) {
      if (new RegExp(`^ {0,3}${fence.mark}{${fence.length},}\\s*$`).test(line)) fence = undefined
      continue
    }
    const opening = line.match(/^ {0,3}(\x60{3,}|~{3,})/)
    if (opening) { fence = { mark: opening[1][0], length: opening[1].length }; continue }
    const heading = line.match(/^ {0,3}(#{1,2})[ \t]+(.+)$/)
    if (heading) headings.push({ index, level: heading[1].length, title: heading[2].replace(/[ \t]+#+[ \t]*$/, '').trim() })
  }
  const matches = headings.filter((heading) => heading.level === 2 && heading.title === section)
  requireValue(matches.length === 1, '계약 섹션이 없거나 중복됐습니다')
  const start = matches[0].index
  const end = headings.find((heading) => heading.index > start)?.index ?? lines.length
  const body = lines.slice(start + 1, end).join('\n').trim()
  requireValue(body, '계약 섹션이 비어 있습니다')
  return body
}

/** 연결 목록 또는 지정한 계약 섹션을 읽습니다. @see wiki/unit/link/inspectLinks.md */
export function inspectLinks(repoRoot, selector) {
  requireValue(lstatSync(join(repoRoot, '.bab')).isDirectory(), '.bab은 일반 폴더여야 합니다')
  requireValue(lstatSync(join(repoRoot, LINK_PATH)).isFile(), 'links.json은 일반 파일이어야 합니다')
  let manifest = parseJson(readFileSync(join(repoRoot, LINK_PATH), 'utf8'))
  requireValue(record(manifest) && manifest.version === 1, '연결 규약 version은 1이어야 합니다')
  let source = { path: LINK_PATH }
  if (Object.hasOwn(manifest, 'source')) {
    requireValue(!Object.hasOwn(manifest, 'repositories') && typeof manifest.source === 'string' && REPOSITORY.test(manifest.source), '정본 참조가 잘못됐습니다')
    const remote = readRemote(manifest.source, LINK_PATH)
    source = { repository: remote.repository, path: LINK_PATH, ref: remote.ref }
    manifest = parseJson(remote.text)
  }
  const repositories = validateCatalog(manifest)
  if (selector === undefined) return { source, repositories }
  const parts = selector.split(':')
  requireValue(parts.length === 2, '계약 선택은 owner/repo:contract-id 형식이어야 합니다')
  const entry = repositories.find(({ repository }) => repository.toLowerCase() === parts[0].toLowerCase())
  const contract = entry?.contracts.find(({ id }) => id === parts[1])
  requireValue(contract, '등록된 외부 계약을 찾을 수 없습니다')
  const remote = readRemote(entry.repository, contract.path)
  return {
    repository: entry.repository, contract: contract.id, path: contract.path,
    section: contract.section, ref: remote.ref, body: readSection(remote.text, contract.section),
  }
}

const run = () => {
  try {
    requireValue(process.argv.length >= 3 && process.argv.length <= 4, '사용법: node read-links.mjs <저장소 루트> [owner/repo:contract-id]')
    process.stdout.write(`${JSON.stringify(inspectLinks(process.argv[2], process.argv[3]), null, 2)}\n`)
    return 0
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) process.exitCode = run()
