import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './Header.css'

const NAV = [
  { name: 'Home', path: '/traveler' },
  { name: 'Find Guides', path: '/traveler/guides' },
  { name: 'Itineraries', path: '/traveler/itineraries' },
  { name: 'Contact', path: '/traveler/contact' },
  { name: 'Become a Guide', path: '/guide' },
]

export default function Header({ floating = false }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className={`site-header${floating ? ' is-floating' : ''}`} data-site-header>
      <Link to="/traveler" className="brand" onClick={() => setOpen(false)} translate="no">
        <img src="/lumichan-logo.png" alt="" className="brand__mark" />
        <span className="brand__name">Lumichan</span>
      </Link>

      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
      </button>

      <nav className={`site-nav${open ? ' is-open' : ''}`} id="site-menu" aria-label="Primary">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/traveler'}
            className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            onClick={() => setOpen(false)}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      <Link to="/traveler/contact" className="header-cta" onClick={() => setOpen(false)}>
        Plan My Trip <span aria-hidden="true">↗</span>
      </Link>
    </header>
  )
}
