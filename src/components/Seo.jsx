import { publicContent } from '../lib/publicContent.js'
import { t } from '../i18n/runtime.js'
import { useLanguage } from '../i18n/LanguageProvider.jsx'
import { useEffect, useState } from 'react'
import { useLocation } from '../i18n/router.jsx'
import { DEFAULT_SEO as DEFAULT, SEO_ROUTES as ROUTES } from '../i18n/seo.js'
import { LOCALES, localeFor } from '../i18n/locales.js'
import { canonicalPath } from '../i18n/routes.js'
import { SITE } from '../config/site.js'

function setMeta(name, content, attr = 'name') {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
  document.head.querySelectorAll(`meta[${attr}="${name}"]`).forEach(other => { if (other !== el) other.remove() })
}

function setCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

export default function Seo() {
  const { pathname } = useLocation()
  const { language, revision } = useLanguage()

  const [journeysPage, setJourneysPage] = useState(null)
  const journeyPage = pathname === '/journeys' || pathname.startsWith('/journeys/')
  useEffect(() => {
    if (!journeyPage) return
    const controller = new AbortController()
    publicContent('/api/journeys.php', {signal:controller.signal}).then(r => r.ok ? r.json() : Promise.reject()).then(data => { if (Array.isArray(data.page?.journeys)) setJourneysPage(data.page) }).catch(() => {})
    return () => controller.abort()
  }, [journeyPage])
  useEffect(() => {
    const slug = pathname.startsWith('/journeys/') ? pathname.split('/')[2] : null
    const journey = journeysPage?.journeys.find(item => item.slug === slug)
    const unavailable = !!(slug && journeysPage && !journey)
    const page = journey ? {title:journey.seoTitle,description:journey.seoDescription} : ROUTES[pathname] || (
      pathname.startsWith('/journeys/')
        ? { title: 'Private China Journey | Lumichan', description: 'Discover a customizable private journey in China with Lumichan.' }
        : DEFAULT
    )
    const url = `${SITE.siteUrl}${canonicalPath(pathname, language)}`

    document.title = t(page.title)
    setMeta('description', t(page.description))
    setMeta('og:site_name', 'Lumichan', 'property')
    setMeta('twitter:title', t(page.title))
    setMeta('twitter:description', t(page.description))
    setMeta('og:title', t(page.title), 'property')
    setMeta('og:description', t(page.description), 'property')
    setMeta('og:url', url, 'property')
    setCanonical(url)
    document.head.querySelectorAll('link[data-lumichan-alternate]').forEach(el => el.remove())
    const publicPage = pathname === '/' || pathname.startsWith('/traveler') || pathname === '/guide' || journeyPage
    if (publicPage) for (const locale of [...LOCALES,{code:'en',html:'x-default'}]) {
      const link = document.createElement('link')
      link.rel = 'alternate'; link.hreflang = locale.html
      link.href = SITE.siteUrl + canonicalPath(pathname, locale.code)
      link.dataset.lumichanAlternate = 'true'; document.head.appendChild(link)
    }
    setMeta('og:locale', localeFor(language).og, 'property')
    setMeta('robots', unavailable || pathname.startsWith('/admin') || pathname.startsWith('/support') || import.meta.env.MODE !== 'production' || !['lumichan.com.cn', 'www.lumichan.com.cn'].includes(window.location.hostname) ? 'noindex,nofollow' : 'index,follow')
  }, [pathname, language, revision, journeysPage, journeyPage])

  return null
}
