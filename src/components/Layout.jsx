import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const id = decodeURIComponent(hash.slice(1))
    const timer = window.setTimeout(() => {
      const target = document.getElementById(id)
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      if (id === 'inquiry') document.getElementById('inquiry-heading')?.focus({ preventScroll: true })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [pathname, hash])
  const isHome = pathname === '/traveler' || pathname === '/traveler/'
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
    <div className={`page ${dark ? 'theme-dark' : ''}`}>
      <Header transparent={isHome} dark={dark} />
      <main className="page-main">
        <Outlet />
      </main>
      <Footer dark={dark} />
    </div>
  )
}
