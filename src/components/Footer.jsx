import { Link } from 'react-router-dom'
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
  return (
    <footer className={`site-footer ${dark ? 'is-dark' : ''}`}>
      <div className="section site-footer__grid">
        <div>
          <div className="brand footer-brand">
            <SoftImage src="/lumichan-logo.png" alt="" className="brand__mark" loading="lazy" width={40} height={40} />
            <span className="brand__name text-gold">Lumichan</span>
          </div>
          <div className="footer-socials">
            {SOCIALS.map(({ label, url, Icon }) => (
              <a
                key={label}
                href={url}
                className="footer-social"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
              >
                <Icon />
              </a>
            ))}
          </div>
          <p className="footer-contact">
            <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
            {SITE.address ? (
              <>
                <br />
                <span>{SITE.address}</span>
              </>
            ) : null}
          </p>
        </div>

        <div>
          <h3>Company</h3>
          <Link to="/traveler/about">About Us</Link>
          <Link to="/traveler/about#partnerships">Travel Partnerships</Link>
          <Link to="/traveler/contact">Contact Us</Link>
          <Link to="/traveler/careers">Careers</Link>
        </div>

        <div>
          <h3>Support</h3>
          <Link to="/traveler/booking-terms">Booking Terms and Conditions</Link>
          <Link to="/traveler/privacy">Privacy Policy</Link>
          <Link to="/traveler/terms">Terms of Use</Link>
        </div>

        <div>
          <h3>Explore</h3>
          <Link to="/traveler#how">How it works</Link>
          <Link to="/traveler/itineraries">Itineraries</Link>
          <Link to="/guide">Become a Guide</Link>
        </div>
      </div>
      <div className="section site-footer__bottom">
        <p>© {new Date().getFullYear()} Lumichan. All rights reserved.</p>
        <p>Crafted with care for adventurous souls worldwide</p>
      </div>
    </footer>
  )
}
