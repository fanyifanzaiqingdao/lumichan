import { publicContent } from '../lib/publicContent.js'
import { t } from '../i18n/runtime.js'
import { useEffect, useState } from 'react'
import { Link } from '../i18n/router.jsx'
import { SITE } from '../config/site.js'
import SoftImage from './SoftImage.jsx'
import './Footer.css'

/** Lucide-style icons — same as lumichan.com/traveler footer */
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function IconTikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

const SOCIALS = [
  { label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61585245772437', Icon: IconFacebook },
  { label: 'Instagram', url: 'https://instagram.com/lumichan_travel', Icon: IconInstagram },
  { label: 'TikTok', url: 'https://www.tiktok.com/@lumichan67', Icon: IconTikTok },
]

export default function Footer({ dark = false }) {
  const [contact,setContact] = useState({ contactAddress: SITE.address, email: SITE.contactEmail })
  useEffect(() => {
    const controller = new AbortController()
    publicContent('/api/homepage.php', { signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => { if (data.homepage?.footer) setContact(data.homepage.footer) }).catch(() => {})
    return () => controller.abort()
  }, [])
  return (
    <footer className={`site-footer ${dark ? 'is-dark' : ''}`}>
      <div className="section site-footer__grid">
        <div>
          <div className="brand footer-brand">
            <SoftImage src="/lumichan-logo.png" alt={t("")} className="brand__mark" loading="lazy" width={40} height={40} />
            <span className="brand__name text-gold">{t("Lumichan")}</span>
          </div>
          <div className="footer-socials">
            {SOCIALS.map(({ label, url, Icon }) => (
              <a
                key={label}
                href={url}
                className="footer-social"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(label)}
              >
                <Icon />
              </a>
            ))}
          </div>
          <p className="footer-contact">
            <a href={`mailto:${contact.email}`}>{t(contact.email)}</a>
            {contact.contactAddress ? (
              <>
                <br />
                <span>{t(contact.contactAddress)}</span>
              </>
            ) : null}
          </p>
        </div>

        <div>
          <h3>{t("Company")}</h3>
          <Link to="/traveler/about">{t("About Us")}</Link>
          <Link to="/traveler/contact">{t("Contact Us")}</Link>
          <Link to="/traveler/careers">{t("Careers")}</Link>
        </div>

        <div>
          <h3>{t("Support")}</h3>
          <Link to="/traveler/booking-terms">{t("Booking Terms and Conditions")}</Link>
          <Link to="/traveler/privacy">{t("Privacy Policy")}</Link>
          <Link to="/traveler/terms">{t("Terms of Use")}</Link>
        </div>

        <div>
          <h3>{t("Explore")}</h3>
          <Link to="/traveler#how">{t("How it works")}</Link>
          <Link to="/traveler/itineraries">{t("Itineraries")}</Link>
          <Link to="/guide">{t("Become a Guide")}</Link>
        </div>
      </div>
      <div className="section site-footer__bottom">
        <p>© {t(new Date().getFullYear())}{t(" Lumichan. All rights reserved.")}</p>
        <p>{t("Crafted with care for adventurous souls worldwide")}</p>
      </div>
    </footer>
  )
}
