import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="section site-footer__grid">
        <div>
          <div className="brand footer-brand">
            <img src="/lumichan-logo.png" alt="" className="brand__mark" />
            <span className="brand__name">Lumichan</span>
          </div>
          <p className="footer-copy">
            Experience the world with confidence. Our AI-verified itineraries and local experts ensure
            every journey is seamless, authentic, and unforgettable.
          </p>
          <p className="footer-contact">
            <a href="mailto:hello@lumichan.com">hello@lumichan.com</a>
            <br />
            <a href="tel:+1234567890">+1 (234) 567-890</a>
          </p>
        </div>

        <div>
          <h3>Company</h3>
          <a href="#about">About Us</a>
          <a href="#how">How It Works</a>
          <a href="#team">Our Team</a>
          <a href="#careers">Careers</a>
        </div>

        <div>
          <h3>Support</h3>
          <Link to="/traveler/contact">Contact Us</Link>
          <a href="#faq">FAQs</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
        </div>

        <div>
          <h3>Explore</h3>
          <Link to="/traveler">Home</Link>
          <Link to="/traveler/guides">Find Guides</Link>
          <Link to="/traveler/itineraries">Itineraries</Link>
          <Link to="/guide">Become a Guide</Link>
        </div>
      </div>
      <div className="section site-footer__bottom">
        <p>© 2025 Lumichan. All rights reserved.</p>
        <p>Crafted with care for adventurous souls worldwide</p>
      </div>
    </footer>
  )
}
