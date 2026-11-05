import { LOCALES, localeFor } from './locales.js'
export const PUBLIC_PATHS = ['/', '/traveler/services', '/journeys', '/journeys/cultural-gateway', '/journeys/western-sichuan-private-road-trip', '/journeys/deep-cultural-journey', '/traveler/about', '/traveler/itineraries', '/traveler/contact', '/traveler/careers', '/traveler/booking-terms', '/traveler/privacy', '/traveler/terms', '/guide']
export function stripLanguage(pathname = '/') { const prefix=LOCALES.find(locale=>locale.prefix && (pathname === '/'+locale.prefix || pathname.startsWith('/'+locale.prefix+'/')))?.prefix; return prefix ? pathname.slice(prefix.length+1) || '/' : pathname }
export function isPublicPath(pathname) { const path = stripLanguage(pathname); return path === '/' || path === '/traveler' || path.startsWith('/traveler/') || path === '/guide' || path === '/journeys' || path.startsWith('/journeys/') }
export function pathLanguage(pathname) { return LOCALES.find(locale=>locale.prefix && (pathname === '/'+locale.prefix || pathname.startsWith('/'+locale.prefix+'/')))?.code || 'en' }
export function localizedPath(to, language) {
  if (typeof to !== 'string') {
    if (!to?.pathname) return to
    return { ...to, pathname: localizedPath(to.pathname, language) }
  }
  if (!to.startsWith('/') || to.startsWith('//')) return to
  const match = to.match(/^([^?#]*)(.*)$/)
  let path = stripLanguage(match[1])
  if (!isPublicPath(path)) return to
  if (path === '/traveler' || path === '/traveler/') path = '/'
  path = path.replace(/^\/traveler\/journeys(?=\/|$)/, '/journeys').replace(/^\/journeys\/chengdu-cultural-gateway(?=\/|$)/, '/journeys/cultural-gateway')
  if (path !== '/') path = path.replace(/\/$/, '')
  const prefix = localeFor(language).prefix
  return (prefix ? '/' + prefix + (path === '/' ? '/' : path) : path) + match[2]
}
// Static HTML entrances are directories on Nginx. Use their trailing-slash URL
// for canonical/hreflang/sitemaps to avoid pointing search engines at redirects.
export function canonicalPath(to, language) {
  const localized = localizedPath(to, language)
  const match = localized.match(/^([^?#]*)(.*)$/)
  return match[1].replace(/\/$/, '') + '/' + match[2]
}
