import { extname } from 'node:path'
import { toList } from '../../skills/audit/scripts/frontmatter.mjs'

const LANGUAGES = new Map([
  ...['js', 'mjs', 'cjs', 'jsx'].map((extension) => [extension, 'javascript']),
  ...['ts', 'mts', 'cts', 'tsx'].map((extension) => [extension, 'typescript']),
  ['rs', 'rust'],
])
const LABELS = new Map([
  ...['js', 'javascript', 'jsx'].map((label) => [label, 'javascript']),
  ...['ts', 'typescript', 'tsx'].map((label) => [label, 'typescript']),
  ['rs', 'rust'], ['rust', 'rust'],
])

/** 언어 판정과 코드 해석의 미검증 근거를 반환합니다. @see wiki/unit/drift/inspectLanguage.md */
export function inspectLanguage(page) {
  const code = toList(page.frontmatter.code)
  const shape = ['unit', 'type'].includes(page.type)
  if (!shape && (page.type !== 'feature' || code.length === 0)) return { canParse: true, items: [], unverified: [] }
  const target = `wiki/${page.name}`
  const items = []
  const unverified = []
  const extensions = code.map((path) => extname(path).trim().toLowerCase())
  const languages = extensions.map((extension) => LANGUAGES.get(extension.slice(1)))
  const known = [...new Set(languages.filter(Boolean))]
  const heading = page.type === 'type' ? '정의' : '시그니처'
  const section = page.text.split(new RegExp(`^##\\s+${heading}\\s*$`, 'm'))[1]?.split(/^##\s/m)[0]
  const block = shape ? section?.match(/```([^\n]*)\n[\s\S]*?```/) : undefined
  const label = block?.[1].trim().toLowerCase() ?? ''
  const declared = label ? LABELS.get(label) : known.length === 1 ? known[0] : undefined
  const message = `확장자: ${extensions.map((extension) => extension || '(없음)').join(', ')} / 언어 표기: ${label || '(없음)'}`
  const pending = (reason) => unverified.push({ target, code, reason, message })
  if (code.length === 0) items.push({ target, kind: '코드에 없음', message: 'code 경로가 없습니다' })
  if (shape && !block) items.push({ target, kind: page.type === 'type' ? '타입 정의 없음' : '시그니처 없음', message: `\`## ${heading}\`에 코드 블록이 없습니다` })
  if (code.length > 0 && languages.some((language) => !language)) pending('unknown-language')
  if (known.length > 1) pending('mixed-language')
  if (shape && block && label && !declared) pending('unknown-language')
  if (known.includes('rust')) pending('unsupported-language')
  if (shape && block && known.length === 1 && declared && declared !== known[0]) {
    items.push({ target, kind: '언어 표기 불일치', message })
    pending('language-conflict')
  }
  return { canParse: items.length === 0 && unverified.length === 0, items, unverified }
}
