import en from './en.json' with { type: 'json' }
import { dynamicText } from './dynamic.js'
import { localeFor, isLanguage } from './locales.js'
export { LOCALES } from './locales.js'

export const LANGUAGE_KEY = 'lumichan-language'
export function readLanguage() {
  try { const saved=localStorage.getItem(LANGUAGE_KEY);return isLanguage(saved) ? saved : 'en' } catch { return 'en' }
}
let language = readLanguage()
export const getLanguage = () => language
export function setLanguage(value) {
  language = isLanguage(value) ? value : 'en'
  try { localStorage.setItem(LANGUAGE_KEY, language) } catch { /* Private browsing may disable storage. */ }
  document.documentElement.lang = localeFor(language).html
}
const catalogs = { en }
const loading = new Map()
const loaders = {
  zh: () => import('./zh.json', { with: { type: 'json' } }),
  ja: () => import('./ja.json'), es: () => import('./es.json'), 'zh-TW': () => import('./zh-TW.json'),
  ko: () => import('./ko.json'), fr: () => import('./fr.json'), de: () => import('./de.json'), it: () => import('./it.json'),
}
export const hasCatalog = code => !!catalogs[code]
export const getCatalog = code => catalogs[code] || {}
export const getDateLocale = () => localeFor(language).date
export function loadLanguage(code) {
  if (catalogs[code] || !loaders[code]) return Promise.resolve()
  if (!loading.has(code)) loading.set(code,loaders[code]().then(module=>{catalogs[code]=module.default}).catch(error=>{loading.delete(code);throw error}))
  return loading.get(code)
}
let overrides = Object.create(null)
export function setOverrides(entries) {
  overrides = Object.create(null)
  for (const entry of entries) if (entry.enabled && typeof entry.source === 'string') overrides[entry.source] = entry
}
// Translate display strings only. Never mutate CMS records, identifiers or form values.
export function t(value) {
  if (Array.isArray(value)) return value.map(t)
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  const custom = overrides[value] || overrides[trimmed]
  if (custom?.[language]) return value.replace(trimmed, () => custom[language])
  if (language === 'en') {
    if (en[trimmed]) return value.replace(trimmed, () => en[trimmed])
    const deletion = trimmed.match(/^确定删除(向导|线索)?「([\s\S]*)」？(此操作不可撤销。)?$/)
    if (deletion) return `Delete ${deletion[1] === '向导' ? 'guide ' : deletion[1] === '线索' ? 'lead ' : ''}“${deletion[2]}”?${deletion[3] ? ' This cannot be undone.' : ''}`
    return value
  }
  const dictionary=catalogs[language] || {}
  const result = dictionary[trimmed] || dictionary[trimmed.replace(/\s+/g, ' ')]
  if (result) return value.replace(trimmed, () => result)
  if (trimmed.includes('\n')) return value.split('\n').map(t).join('\n')
  if (language !== 'zh') return dynamicText(value, language, t)
  const account = trimmed.match(/^Enter your (.+) account\.$/)
  if (account) return `请输入你的 ${t(account[1])} 账号。`
  const day = trimmed.match(/^Day (\d+)$/)
  if (day) return `第 ${day[1]} 天`
  const image = trimmed.match(/^Show image (\d+)$/)
  if (image) return `显示第 ${image[1]} 张图片`
  const slide = trimmed.match(/^(\d+) of (\d+)$/)
  if (slide) return `第 ${slide[1]} 张，共 ${slide[2]} 张`
  if (trimmed.startsWith('View ')) return '查看' + t(trimmed.slice(5))
  if (trimmed.endsWith(' booking policy')) return t(trimmed.slice(0, -15)) + '预订政策'
  return value.replace(/\bFrom USD\s*([\d,]+)/g, 'USD $1 起').replace(/\bUSD\s*([\d,]+)\s*\/\s*trip/g, 'USD $1 / 次行程').replace(/\b(\d+) days?\b/gi, '$1 天').replace(/\b(\d+) years?\b/gi, '$1 年').replace(/\b(\d+(?:[-–]\d+)?) (?:people|travelers)\b/g, '$1 人')
}
