import { Link } from 'react-router-dom'
import { WHY_CHOOSE } from '../data/about.js'
import SoftImage from '../components/SoftImage.jsx'
import './Home.css'

const CULTURE = [
  { src: '/culture/tibetan-monastery.jpg', alt: 'Tibetan Monastery', label: 'Tibetan Heritage', tall: true },
  { src: '/culture/sichuan-teahouse.jpg', alt: 'Sichuan Teahouse', label: 'Tea Culture' },
  { src: '/culture/yunnan-festival.jpg', alt: 'Ethnic costumes beneath snow mountains', label: 'Ethnic Festivals' },
  { src: '/culture/calligraphy.jpg', alt: 'Chinese Calligraphy', label: 'Calligraphy Art' },
  { src: '/culture/sichuan-hotpot.jpg', alt: 'Sichuan Hot Pot', label: 'Sichuan Cuisine' },
  { src: '/culture/panda.jpg', alt: 'Giant Panda', label: 'Giant Pandas' },
  { src: '/culture/lantern-festival.jpg', alt: 'Snow-capped mountain peaks', label: 'Alpine Landscapes', tall: true },
  { src: '/culture/rice-terraces.jpg', alt: 'Chengdu twin towers at dusk', label: 'Modern Cities' },
  { src: '/culture/sichuan-opera.jpg', alt: 'Traditional Chinese warrior figure', label: 'Sichuan Opera' },
  { src: '/culture/zhangjiajie-bridge.jpg', alt: 'Old Chengdu doorway view', label: 'Local Heritage' },
]

const DESTINATIONS = [
  {
    name: 'BiPeng Valley',
    location: 'Western Sichuan',
    duration: '3-4 Days',
    rating: 4.9,
    image: '/home/bipeng-valley.jpg',
  },
  {
    name: 'Shuangqiao Valley',
    location: 'Siguniang Mountain',
    duration: '5 Days',
    rating: 4.8,
    image: '/home/shuangqiao-valley.jpg',
  },
  {
    name: 'Tagong Grassland',
    location: 'Kangding, Tibet',
    duration: '7-8 Days',
    rating: 4.9,
    image: '/home/tagong-grassland.jpg',
  },
  {
    name: 'Kangding City',
    location: 'Sichuan Province',
    duration: '2-3 Days',
    rating: 4.7,
    image: '/home/kangding.jpg',
  },
]

const TRUST = ['No Hidden Fees', 'Free Cancellation', '24/7 Support']

export default function Home() {
  return (
    <div className="home home--dark">
      <section className="hero">
        <div className="hero__media" aria-hidden="true">
          <SoftImage
            src="/home/hero-sichuan.jpg"
            alt=""
            loading="eager"
            fetchPriority="high"
          />
        </div>
        <div className="hero__veil" aria-hidden="true" />
        <div className="hero__content section">
          <div className="hero__badge">✦ Private Journeys</div>
          <h1 className="font-serif hero__title">
            Travel through what you do,
            <br />
            <span className="text-gold">not what you see</span>.
          </h1>
          <p className="hero__subtitle">
            We design private journeys that connect travelers with China&apos;s people, landscapes, and
            living cultures.
          </p>
          <div className="hero__actions">
            <Link to="/traveler/contact" className="btn btn-gold">
              Book A Consultation <span aria-hidden>✦</span>
            </Link>
            {/* <Link to="/traveler/guides" className="btn btn-ghost">
              Find a Guide
            </Link> */}
          </div>
          <ul className="hero__trust">
            {TRUST.map((item) => (
              <li key={item}>
                <span aria-hidden>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="why-choose">
        <div className="section section-pad why-choose__grid">
          <div className="why-choose__copy">
            <div className="why-choose__icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M16 24.5l5 5 11-12"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="eyebrow">{WHY_CHOOSE.eyebrow}</div>
            <h2 className="font-serif">
              Travel deeper. <span className="text-gold">Connect with culture.</span>
            </h2>
            {WHY_CHOOSE.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
            <p className="why-choose__closing">{WHY_CHOOSE.closing}</p>
            <div className="why-choose__actions">
              <Link to="/traveler/contact" className="btn btn-gold">
                Book A Consultation
              </Link>
              <Link to="/traveler/about" className="btn btn-outline">
                Find out more
              </Link>
            </div>
          </div>
          <div className="why-choose__media">
            <SoftImage
              src="/home/why-choose-travelers.jpg"
              alt="Travelers enjoying a mountain journey in Western Sichuan"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="culture">
        <div className="section section-pad">
          <div className="section-head section-head--center">
            <div className="eyebrow">Cultural Highlights</div>
            <h2 className="font-serif">
              Experience <span className="text-gold">Authentic China</span>
            </h2>
            <p>
              From ancient traditions to breathtaking landscapes, immerse yourself in the rich cultural
              tapestry of China
            </p>
          </div>
          <div className="culture__grid">
            {CULTURE.map((item) => (
              <figure
                key={item.label}
                className={`culture__card${item.tall ? ' culture__card--tall' : ''}`}
              >
                <SoftImage src={item.src} alt={item.alt} loading="lazy" width={640} height={800} />
                <figcaption>{item.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="destinations">
        <div className="section section-pad">
          <div className="destinations__top">
            <div>
              <div className="eyebrow">Featured Destinations</div>
              <h2 className="font-serif">
                Discover <span className="text-gold">Western Sichuan</span>
              </h2>
            </div>
            <Link to="/traveler/itineraries" className="btn btn-outline destinations__all">
              View All Itineraries →
            </Link>
          </div>
          <div className="destinations__grid">
            {DESTINATIONS.map((item) => (
              <Link
                key={item.name}
                to="/traveler/itineraries"
                className="dest-card"
              >
                <div className="dest-card__media">
                  <SoftImage src={item.image} alt={item.name} loading="lazy" />
                </div>
                <div className="dest-card__body">
                  <div className="dest-card__rating">★ {item.rating}</div>
                  <h3 className="font-serif">{item.name}</h3>
                  <p>{item.location}</p>
                  <span>{item.duration}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="section cta-band__inner">
          <h2 className="font-serif">
            Ready to Start Your <span className="text-gold">Adventure</span>?
          </h2>
          <p>Tell us what you want to experience — we&apos;ll design a private journey around you.</p>
          <div className="hero__actions">
            <Link to="/traveler/contact" className="btn btn-gold">
              Book A Consultation <span aria-hidden>✦</span>
            </Link>
            <Link to="/traveler/itineraries" className="btn btn-outline">
              Browse Itineraries
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
