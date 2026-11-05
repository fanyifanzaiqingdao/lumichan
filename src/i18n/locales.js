import locales from '../../public/api/data/locales.json' with { type:'json' }
export const LOCALES = locales
export const localeFor = code => locales.find(locale=>locale.code === code) || locales[0]
export const isLanguage = code => locales.some(locale=>locale.code === code)
export const LANGUAGE_PREFIXES = locales.map(locale=>locale.prefix).filter(Boolean)
