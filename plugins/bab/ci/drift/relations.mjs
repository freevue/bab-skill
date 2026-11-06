import { posix } from 'node:path'
import { toList } from '../../skills/audit/scripts/frontmatter.mjs'

const IMPORT_PATTERN = /import\s*(?:type\s+)?\{([^}]*)\}\s*from/g
const CALL_PATTERN = /([A-Za-z_$][\w$]*)\s*\(/g
const JSX_PATTERN = /<([A-Z][\w$]*)/g
const LINK_PATTERN = /\[[^\]]*\]\(([^)\s#]+)[^)]*\)/g

const item = (target, kind, message) => ({ target, kind, message })

/**
 * 코드에서 import, 호출, JSX로 사용한 이름을 모읍니다. import 별칭은 원래 이름으로 셉니다.
 */
export function extractUsedNames(text) {
  const imported = [...text.matchAll(IMPORT_PATTERN)].flatMap(([, specifiers]) =>
    specifiers
      .split(',')
      .map(
        (specifier) =>
          specifier
            .trim()
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)[0]
      )
      .filter(Boolean)
  )
  const called = [...text.matchAll(CALL_PATTERN)].map((match) => match[1])
  const rendered = [...text.matchAll(JSX_PATTERN)].map((match) => match[1])
  return new Set([...imported, ...called, ...rendered])
}

/**
 * 페이지의 특정 `##` 섹션 안에 있는 링크를 wiki 기준 경로로 풀어 돌려줍니다.
 */
export function sectionLinks(page, heading) {
  const section = page.text.split(new RegExp(`^##\\s+${heading}\\s*$`, 'm'))[1]
  if (!section) return []
  const body = section.split(/^##\s/m)[0]
  return [...body.matchAll(LINK_PATTERN)].map(([, target]) =>
    posix.normalize(posix.join(posix.dirname(page.name), target))
  )
}

const pagesOfType = (pages, type) => pages.filter((page) => page.type === type)

/**
 * 기능의 구성 유닛과 기능 code 파일의 실제 사용을 대조합니다.
 */
export function checkFeatureComposition(pages, readSource) {
  const units = pagesOfType(pages, 'unit')
  const unitNameByPage = new Map(units.map((unit) => [unit.name, unit.frontmatter.name]))
  const documentedNames = new Set(unitNameByPage.values())
  return pagesOfType(pages, 'feature').flatMap((feature) => {
    const code = toList(feature.frontmatter.code)
    if (code.length === 0) return []
    const used = new Set(code.flatMap((path) => [...extractUsedNames(readSource(path) ?? '')]))
    const listed = sectionLinks(feature, '구성 유닛')
      .map((path) => unitNameByPage.get(path))
      .filter(Boolean)
    const target = `wiki/${feature.name}`
    const unused = listed
      .filter((name) => !used.has(name))
      .map((name) =>
        item(target, '구성 유닛 미사용', `\`${name}\`을 \`${code.join(', ')}\`에서 쓰지 않습니다`)
      )
    const missing = [...used]
      .filter((name) => documentedNames.has(name) && !listed.includes(name))
      .map((name) =>
        item(target, '구성 유닛 누락', `코드가 \`${name}\`을 쓰지만 구성 유닛에 없습니다`)
      )
    return [...unused, ...missing]
  })
}

/**
 * 기능의 구성 유닛과 유닛의 사용처가 서로 링크하는지 대조합니다.
 */
export function checkUsageConsistency(pages) {
  const featurePages = new Set(pagesOfType(pages, 'feature').map((page) => page.name))
  const unitPages = new Set(pagesOfType(pages, 'unit').map((page) => page.name))
  const composed = pagesOfType(pages, 'feature').flatMap((feature) =>
    sectionLinks(feature, '구성 유닛')
      .filter((path) => unitPages.has(path))
      .map((unit) => `${feature.name}>${unit}`)
  )
  const usedBy = pagesOfType(pages, 'unit').flatMap((unit) =>
    sectionLinks(unit, '사용처')
      .filter((path) => featurePages.has(path))
      .map((feature) => `${feature}>${unit.name}`)
  )
  const usedBySet = new Set(usedBy)
  const composedSet = new Set(composed)
  const toItem = (message) => (pair) => {
    const [feature, unit] = pair.split('>')
    return item(`wiki/${unit}`, '사용처 불일치', message(feature))
  }
  return [
    ...composed
      .filter((pair) => !usedBySet.has(pair))
      .map(toItem((feature) => `\`${feature}\`의 구성 유닛인데 사용처에 없습니다`)),
    ...usedBy
      .filter((pair) => !composedSet.has(pair))
      .map(toItem((feature) => `사용처에 \`${feature}\`이 있지만 그 기능의 구성 유닛에 없습니다`)),
  ]
}
