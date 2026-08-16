import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/traveler' || pathname === '/traveler/'

  return (
    <div className="page theme-paper">
      <Header floating={isHome} />
      <main className="page-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
