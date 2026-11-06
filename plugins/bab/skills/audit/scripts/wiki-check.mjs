#!/usr/bin/env node
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { normalizeText, readFrontmatter } from './frontmatter.mjs'

const REQUIRED_SECTIONS = {
  unit: ['시그니처', '내부 로직', '사용법', '사용처', 'TC'],
  feature: ['구성 유닛', '흐름', '관련 정책', 'TC'],
  policy: ['규칙', '적용 기능'],
  type: ['정의', '필드', '사용처'],
}
const SPECIAL_PAGES = ['index.md', 'log.md']
const LINK_PATTERN = /\[[^\]]*\]\(([^)\s]+)\)/g
const TC_ROW_PATTERN = /^\|\s*((?:UT|FT|POL)-[\w-]+-\d+)\s*\|/gm
const FENCE_PATTERN = /```[\s\S]*?```/g

/**
 * 폴더 아래의 markdown 파일 경로를 차례로 내보냅니다.
 */
export function* walkMarkdown(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) yield* walkMarkdown(fullPath)
    else if (entry.isFile() && entry.name.endsWith('.md')) yield fullPath
  }
}

/**
 * 코드 블록을 뺀 본문에서 로컬 링크 대상을 모읍니다.
 */
export function readLocalLinks(text) {
  const prose = text.replace(FENCE_PATTERN, '')
  return [...prose.matchAll(LINK_PATTERN)]
    .map((match) => match[1].split('#')[0])
    .filter((target) => target && !/^[a-z]+:/i.test(target))
}

/**
 * 페이지 하나를 읽어 검사에 필요한 정보로 바꿉니다.
 */
export const readPage = (wikiRoot) => (filePath) => {
  const text = normalizeText(readFileSync(filePath, 'utf8'))
  const frontmatter = readFrontmatter(text)
  return {
    filePath,
    name: relative(wikiRoot, filePath),
    text,
    type: frontmatter.type,
    frontmatter,
    links: readLocalLinks(text),
    headings: [...text.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim()),
    tcIds: [...text.matchAll(TC_ROW_PATTERN)].map((match) => match[1]),
  }
}

const issue = (severity, kind, page, message) => ({ severity, kind, page, message })

/**
 * 링크 대상 파일이 없는 경우를 찾습니다.
 */
export function checkBrokenLinks(pages) {
  return pages.flatMap((page) =>
    page.links
      .filter((target) => !existsSync(resolve(dirname(page.filePath), target)))
      .map((target) => issue('High', 'link', page.name, `깨진 링크 ${target}`))
  )
}

/**
 * index.md에서 링크되지 않은 페이지를 찾습니다.
 */
export function checkOrphans(pages, wikiRoot) {
  const indexPage = pages.find((page) => page.name === 'index.md')
  if (!indexPage) return [issue('High', 'index', 'index.md', 'index.md 없음')]
  const indexed = new Set(indexPage.links.map((target) => resolve(wikiRoot, target)))
  return pages
    .filter((page) => !SPECIAL_PAGES.includes(page.name))
    .filter((page) => !indexed.has(resolve(page.filePath)))
    .map((page) => issue('Medium', 'index', page.name, 'index.md에 없는 페이지'))
}

/**
 * type에 따른 필수 섹션 누락을 찾습니다.
 */
export function checkSections(pages) {
  return pages
    .filter((page) => !SPECIAL_PAGES.includes(page.name))
    .flatMap((page) => {
      const required = REQUIRED_SECTIONS[page.type]
      if (!required) return [issue('Medium', 'type', page.name, `알 수 없는 type: ${page.type}`)]
      return required
        .filter((section) => !page.headings.includes(section))
        .map((section) => issue('Medium', 'section', page.name, `필수 섹션 없음: ${section}`))
    })
}

/**
 * wiki 전체에서 중복된 TC ID를 찾습니다.
 */
export function checkDuplicateTc(pages) {
  const owners = new Map()
  for (const page of pages) {
    for (const tcId of page.tcIds) owners.set(tcId, [...(owners.get(tcId) ?? []), page.name])
  }
  return [...owners.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([tcId, names]) => issue('High', 'tc', names.join(', '), `TC ID 중복 ${tcId}`))
}

/**
 * wiki 폴더 전체를 검사해 위반 목록을 돌려줍니다.
 */
export function checkWiki(wikiRoot) {
  const root = resolve(wikiRoot)
  const pages = [...walkMarkdown(root)].map(readPage(root))
  return [
    ...checkBrokenLinks(pages),
    ...checkOrphans(pages, root),
    ...checkSections(pages),
    ...checkDuplicateTc(pages),
  ]
}

const formatIssue = ({ severity, kind, page, message }) =>
  `${severity}\t${kind}\t${page}\t${message}\n`

const run = (wikiRoot) => {
  if (!wikiRoot || !existsSync(wikiRoot)) {
    process.stderr.write(`사용법: node wiki-check.mjs <wiki 폴더>\n`)
    return 2
  }
  const issues = checkWiki(wikiRoot)
  if (issues.length === 0) {
    process.stdout.write('위반 없음\n')
    return 0
  }
  process.stdout.write(issues.map(formatIssue).join(''))
  return 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href)
  process.exitCode = run(process.argv[2])
