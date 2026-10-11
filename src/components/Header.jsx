import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import SoftImage from './SoftImage.jsx'
import './Header.css'

const NAV = [
  { name: 'Home', path: '/traveler' },
  { name: 'About', path: '/traveler/about' },
  // { name: 'AI Planning', path: '/traveler/ai-planner' }, // temporarily hidden
  // { name: 'Find Guides', path: '/traveler/guides' }, // temporarily hidden
  { name: 'Itineraries', path: '/traveler/itineraries' },
  // { name: 'Contact', path: '/traveler/contact' }, // temporarily hidden
  { name: 'Become a Guide', path: '/guide' },
]

export default function Header({ transparent = false, dark = false }) {
  const [open, setOpen] = useState(false)

  return (
    <header
      className={[
        'site-header',
        transparent ? 'is-transparent' : '',
        dark ? 'is-dark' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="site-header__inner section">
        <Link to="/traveler" className="brand" onClick={() => setOpen(false)}>
          <SoftImage src="/lumichan-logo.png" alt="" className="brand__mark" loading="eager" width={40} height={40} />
          <span className="brand__name text-gold">Lumichan</span>
        </Link>

        <nav className={`nav ${open ? 'is-open' : ''}`}>
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/traveler'}
              className={({ isActive }) => (isActive ? 'nav__link is-active' : 'nav__link')}
              onClick={() => setOpen(false)}
            >
              {item.name}
            </NavLink>
          ))}
          <Link
            to="/traveler/contact"
            className="btn btn-gold nav__cta-mobile"
            onClick={() => setOpen(false)}
          >
            Plan My Trip
          </Link>
        </nav>

        <Link to="/traveler/contact" className="btn btn-gold header-cta" onClick={() => setOpen(false)}>
          Plan My Trip
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
