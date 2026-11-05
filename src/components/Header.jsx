import { t } from '../i18n/runtime.js'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from '../i18n/router.jsx'
import SoftImage from './SoftImage.jsx'
import { track } from '../lib/analytics.js'
import './Header.css'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const NAV = [
  { name: 'Home', path: '/traveler' },
  { name: 'About', path: '/traveler/about' },
  // { name: 'AI Planning', path: '/traveler/ai-planner' }, // temporarily hidden
  // { name: 'Find Guides', path: '/traveler/guides' }, // temporarily hidden
  { name: 'Services', path: '/traveler/services' },
  { name: 'Journeys', path: '/journeys' },
  // { name: 'Contact', path: '/traveler/contact' }, // temporarily hidden
  { name: 'Become a Guide', path: '/guide' },
]

export default function Header({ transparent = false, dark = false }) {
  const [open, setOpen] = useState(false)
  const servicePage = useLocation().pathname === '/traveler/services'
  const inquiryHref = servicePage ? '/traveler/contact' : '/traveler#inquiry'
  const menuRef = useRef(null)
  const toggleRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const menu = menuRef.current
    const focusables = Array.from(menu?.querySelectorAll('a, button') || [])
    focusables[0]?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
      if (event.key === 'Tab' && focusables.length) {
        const first = focusables[0]
        const last = focusables.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

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
          <SoftImage src="/lumichan-logo.png" alt={t("")} className="brand__mark" loading="eager" width={40} height={40} />
          <span className="brand__name text-gold">{t("Lumichan")}</span>
        </Link>

        <nav ref={menuRef} id="primary-navigation" className={`nav ${open ? 'is-open' : ''}`} aria-label={t("Main navigation")}>
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/traveler'}
              className={({ isActive }) => (isActive ? 'nav__link is-active' : 'nav__link')}
              onClick={() => setOpen(false)}
            >
              {t(item.name)}
            </NavLink>
          ))}
          <Link
            to={inquiryHref}
            className="btn btn-gold nav__cta-mobile"
            onClick={() => { setOpen(false); track('cta_click', { label: 'Plan My Journey', destination: inquiryHref, section: 'mobile_menu' }) }}
          >{t("Plan My Journey")}</Link>
        </nav>

        <Link to={inquiryHref} className="btn btn-gold header-cta" aria-label={t("Plan My Journey")} onClick={() => { setOpen(false); track('cta_click', { label: 'Plan My Journey', destination: inquiryHref, section: 'header' }) }}>
          <span className="header-cta__full">{t("Plan My Journey")}</span>
          <span className="header-cta__short">{t("Plan trip")}</span>
        </Link>

        <LanguageSwitcher />
        <button
          ref={toggleRef}
          type="button"
          className="nav-toggle"
          aria-label={t("Toggle menu")}
          aria-expanded={open}
          aria-controls="primary-navigation"
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
