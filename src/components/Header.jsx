import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './Header.css'

const NAV = [
  { name: 'Home', path: '/traveler' },
  // { name: 'AI Planning', path: '/traveler/ai-planner' }, // temporarily hidden
  { name: 'Find Guides', path: '/traveler/guides' },
  { name: 'Itineraries', path: '/traveler/itineraries' },
  { name: 'Contact', path: '/traveler/contact' },
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
          <img src="/lumichan-logo.png" alt="" className="brand__mark" />
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
        </nav>

        {/* Start Planning CTA temporarily hidden
        <Link to="/traveler/ai-planner" className="btn btn-gold header-cta" onClick={() => setOpen(false)}>
          <span aria-hidden>✦</span>
          Start Planning
        </Link>
        */}

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
