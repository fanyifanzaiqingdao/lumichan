import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/traveler' || pathname === '/traveler/'
  const dark =
    isHome ||
    pathname.includes('ai-planner') ||
    pathname.includes('/guide') ||
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
