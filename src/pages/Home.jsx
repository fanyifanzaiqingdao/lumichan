import { Link } from 'react-router-dom'
import './Home.css'

const STATS = [
  { value: '98%', label: 'Trip Accuracy Rate' },
  { value: '50K+', label: 'Happy Travelers' },
  { value: '100+', label: 'Destinations' },
  { value: '24/7', label: 'Support Available' },
]

const FEATURES = [
  {
    title: 'AI-Verified Itineraries',
    text: 'Every detail validated in real-time. Flight times, venue hours, restaurant availability - all confirmed with timestamp verification.',
    icon: 'shield',
  },
  {
    title: 'Smart Alternatives',
    text: 'Weather changes? Venue closed? Our AI instantly provides backup plans, ensuring your trip stays on track no matter what.',
    icon: 'refresh',
  },
  {
    title: 'Local Expert Network',
    text: 'Connect with certified guides, local experts, and community hosts who bring authentic experiences to your journey.',
    icon: 'users',
  },
  {
    title: 'Seamless Booking',
    text: 'One platform for flights, hotels, tours, and transportation. Book everything with a single click and offline access.',
    icon: 'check',
  },
]

const CULTURE = [
  { src: '/culture/tibetan-monastery.jpg', alt: 'Tibetan Monastery', label: 'Tibetan Heritage', tall: true },
  { src: '/culture/sichuan-teahouse.jpg', alt: 'Sichuan Teahouse', label: 'Tea Culture' },
  { src: '/culture/yunnan-festival.jpg', alt: 'Yunnan Festival', label: 'Ethnic Festivals' },
  { src: '/culture/calligraphy.jpg', alt: 'Chinese Calligraphy', label: 'Calligraphy Art' },
  { src: '/culture/sichuan-hotpot.jpg', alt: 'Sichuan Hot Pot', label: 'Sichuan Cuisine' },
  { src: '/culture/panda.jpg', alt: 'Giant Panda', label: 'Giant Pandas' },
  { src: '/culture/lantern-festival.jpg', alt: 'Lantern Festival', label: 'Lantern Festival', tall: true },
  { src: '/culture/rice-terraces.jpg', alt: 'Rice Terraces', label: 'Rice Terraces' },
  { src: '/culture/sichuan-opera.jpg', alt: 'Sichuan Opera', label: 'Sichuan Opera' },
  { src: '/culture/zhangjiajie-bridge.jpg', alt: 'Zhangjiajie', label: 'Natural Wonders' },
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

function FeatureIcon({ name }) {
  if (name === 'shield') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    )
  }
  if (name === 'refresh') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M21 12a9 9 0 1 1-2.6-6.3" />
        <path d="M21 3v6h-6" />
      </svg>
    )
  }
  if (name === 'users') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="9" cy="8" r="3.2" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M3.5 19c1.2-3 3.4-4.5 5.5-4.5S13.3 16 14.5 19" />
        <path d="M14 14.5c1.5-.7 3-.6 4.5.2 1.2.7 2 1.9 2.5 4.3" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  )
}

export default function Home() {
  return (
    <div className="home home--dark">
      <section className="hero">
        <div className="hero__media" aria-hidden="true">
          <img src="/home/hero-sichuan.jpg" alt="" />
        </div>
        <div className="hero__veil" aria-hidden="true" />
        <div className="hero__content section">
          <div className="hero__badge">✦ AI-Powered Travel Planning</div>
          <h1 className="font-serif hero__title">
            Travel with
            <br />
            <span className="text-gold">Confidence</span>
          </h1>
          <p className="hero__subtitle">
            Every step verified. Every detail confirmed. Experience the world&apos;s first AI-verified
            travel platform.
          </p>
          <div className="hero__actions">
            <Link to="/traveler/ai-planner" className="btn btn-gold">
              AI Trip Planning <span aria-hidden>✦</span>
            </Link>
            <Link to="/traveler/guides" className="btn btn-ghost">
              Find a Guide
            </Link>
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

      <section className="stats">
        <div className="section stats__grid">
          {STATS.map((item) => (
            <div key={item.label} className="stats__item">
              <div className="stats__value text-gold">{item.value}</div>
              <div className="stats__label">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="features">
        <div className="section section-pad">
          <div className="section-head">
            <div className="eyebrow">Why Choose Lumichan</div>
            <h2 className="font-serif">
              Travel Smarter<span className="text-gold">, Not Harder</span>
            </h2>
          </div>
          <div className="features__grid">
            {FEATURES.map((item) => (
              <article key={item.title} className="feature-card">
                <div className="feature-card__icon">
                  <FeatureIcon name={item.icon} />
                </div>
                <h3 className="font-serif">{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
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
                <img src={item.src} alt={item.alt} loading="lazy" width={640} height={800} />
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
                  <img src={item.image} alt={item.name} loading="lazy" />
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
          <p>
            Let our AI plan your perfect journey or connect with local guides who know the hidden gems.
          </p>
          <div className="hero__actions">
            <Link to="/traveler/ai-planner" className="btn btn-gold">
              Start AI Planning <span aria-hidden>✦</span>
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
