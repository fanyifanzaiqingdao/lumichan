import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from '../i18n/router.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname, hash, search, key, state } = useLocation()
  const firstNavigation=useRef(true)
  useEffect(() => {
    const initial=firstNavigation.current
    firstNavigation.current=false
    if (!hash || (!initial && state?.localeSwitch)) return
    const id = decodeURIComponent(hash.slice(1))
    const timer = window.setTimeout(() => {
      if (document.activeElement?.closest('.language-switcher') || document.activeElement?.matches('input,textarea,select')) return
      const target = document.getElementById(id)
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      if (id === 'inquiry') {
        const focusTarget = new URLSearchParams(search).has('service')
          ? document.querySelector('.inquiry-form input[name="name"]')
          : document.getElementById('inquiry-heading')
        focusTarget?.focus({ preventScroll: true })
      }
    }, 80)
    return () => window.clearTimeout(timer)
  }, [pathname, hash, search, key])
  const isHome = pathname === '/' || pathname === '/traveler' || pathname === '/traveler/'
  const dark =
    isHome ||
    pathname.includes('ai-planner') ||
    pathname.includes('/guide') ||
    pathname.includes('/services') ||
    pathname.includes('/journeys') ||
    pathname.includes('/itineraries') ||
    pathname.includes('/guides') ||
    pathname.includes('/contact') ||
    pathname.includes('/about') ||
    pathname.includes('/careers') ||
    pathname.includes('/booking-terms') ||
    pathname.includes('/privacy') ||
    pathname.includes('/terms')

  return (
    <div className={`page ${dark ? 'theme-dark' : ''} ${isHome ? 'page--homepage' : ''}`}>
      <Header transparent={isHome} dark={dark} />
      <main className="page-main">
        <Outlet />
      </main>
      <Footer dark={dark} />
    </div>
  )
}
