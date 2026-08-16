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

const EXPERIENCES = [
  {
    number: '01',
    title: 'A Day with a Nomadic Family',
    place: 'Tagong Grassland',
    text: 'Share butter tea, learn how tsampa is made and listen to the stories behind daily life on the plateau.',
    detail: 'Local life · Food · Conversation',
    image: '/images/experiences/tagong-nomadic-family.jpg',
    alt: 'A Tibetan host pouring hot water into a traditional vessel inside a family home on Tagong Grassland',
    href: '/traveler/guides',
  },
  {
    number: '02',
    title: 'Walk the Living Paths of Taoism',
    place: 'Mount Qingcheng',
    text: 'Move slowly through forest paths and mountain temples with context that brings Taoist ideas into view.',
    detail: 'Heritage · Walking · Reflection',
    image: '/images/experiences/qingcheng-brush-writing-card.jpg',
    alt: 'A hand using a brush to copy Chinese characters during a quiet cultural practice',
    href: '/traveler/itineraries',
  },
  {
    number: '03',
    title: 'Taste Chengdu Beyond the Menu',
    place: 'Chengdu',
    text: 'Follow the rhythm of teahouses, markets and neighbourhood kitchens with someone who knows the city personally.',
    detail: 'Food · Teahouses · City life',
    image: '/images/experiences/chengdu-teahouse-card.jpg',
    alt: 'Guests sharing time in a traditional Chengdu teahouse filled with bamboo chairs',
    href: '/traveler/itineraries',
  },
]

const DESTINATIONS = [
  {
    title: 'Chengdu & Mount Qingcheng',
    text: 'Teahouse rhythms, remarkable food and the quiet heritage of a Taoist mountain.',
    image: '/images/destinations/qingcheng-forest-walk-card.jpg',
    alt: 'A traveler walking up a stone path through the deep green forest of Mount Qingcheng',
    size: 'wide',
    href: '/traveler/itineraries',
  },
  {
    title: 'Kangding, Tagong & Danba',
    text: 'Tibetan communities, sacred places, grasslands and mountain roads.',
    image: '/images/destinations/kangding-tagong-danba-card.jpg',
    alt: 'A woman in traditional dress standing on the exterior steps of a stone house in Danba',
    size: 'tall',
    href: '/traveler/itineraries',
  },
  {
    title: 'Mount Siguniang',
    text: 'Alpine valleys, village stays and trails for walking at your own pace.',
    image: '/images/destinations/mount-siguniang-card.jpg',
    alt: 'Snow-covered peaks and golden autumn forest reflected in a lake at Mount Siguniang',
    size: 'small',
    href: '/traveler/itineraries',
  },
  {
    title: 'Jiuzhaigou & Huanglong',
    text: 'Forests, luminous lakes and a highland landscape shaped by water.',
    image: '/images/destinations/jiuzhaigou-huanglong-card.jpg',
    alt: 'Turquoise travertine pools cascading through the Huanglong landscape',
    size: 'small',
    href: '/traveler/itineraries',
  },
]

const JOURNEYS = [
  {
    eyebrow: '5 DAYS · PRIVATE',
    title: 'People & Peaks of Western Sichuan',
    text: 'Chengdu · Wolong · Mount Siguniang · Danba · Tagong · Kangding',
    tags: ['Culture', 'Nature', 'Local life'],
    image: '/images/journeys/western-sichuan-card.jpg',
    alt: 'Misty mountain valley and winding river at Mount Siguniang',
    href: '/traveler/itineraries',
  },
  {
    eyebrow: '4 DAYS · PRIVATE',
    title: 'Taoist Mountains & Chengdu Life',
    text: 'Chengdu · Dujiangyan · Mount Qingcheng',
    tags: ['Heritage', 'Food', 'Slow travel'],
    image: '/images/journeys/taoist-mountains-chengdu-card.jpg',
    alt: 'Misty forest, lake and Taoist buildings at Mount Qingcheng',
    href: '/traveler/itineraries',
  },
  {
    eyebrow: '6 DAYS · PRIVATE',
    title: 'Valleys & Waters of Northern Sichuan',
    text: 'Chengdu · Jiuzhaigou · Huanglong',
    tags: ['Nature', 'Photography', 'Family'],
    image: '/images/journeys/northern-sichuan-waters-card.jpg',
    alt: 'Aerial view of turquoise lakes in Jiuzhaigou Valley',
    href: '/traveler/itineraries',
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
    <div className="home">
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero__media" aria-hidden="true">
          <img
            src="/images/home/hero-yala-prayer-flags.jpg"
            alt="Prayer flags overlooking snow-covered Mount Yala in Western Sichuan"
          />
        </div>
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__copy">
          <p className="eyebrow light">AI-Powered Travel Planning</p>
          <h1 id="hero-title" className="font-serif">
            Travel with
            <br />
            Confidence
          </h1>
          <p className="hero__description">
            Every step verified. Every detail confirmed. Experience the world&apos;s first AI-verified
            travel platform.
          </p>
          <div className="hero__actions">
            <Link to="/traveler/contact" className="button button-light">
              Plan My Trip <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/traveler/guides" className="text-link light-link">
              Find a Guide <span aria-hidden="true">↓</span>
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
        <div className="hero__note" aria-hidden="true">
          <span>31.08° N</span>
          <span>SICHUAN · CHINA</span>
        </div>
      </section>

      <section className="stats shell">
        <div className="stats__grid">
          {STATS.map((item) => (
            <div key={item.label} className="stats__item">
              <div className="stats__value font-serif">{item.value}</div>
              <div className="stats__label">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 1 — Experiences */}
      <section className="experiences section-block" id="experiences" aria-labelledby="experiences-title">
        <div className="shell">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Signature Experiences</p>
              <h2 id="experiences-title" className="font-serif">
                Come home with more than photographs.
              </h2>
            </div>
            <p>
              Meet people, try something with your own hands and understand the places you pass through —
              with time for genuine connection.
            </p>
          </div>

          <div className="experience-grid">
            {EXPERIENCES.map((item, index) => (
              <article key={item.number} className={`experience-card experience-${index + 1}`}>
                <div className="experience-image">
                  <img src={item.image} alt={item.alt} loading="lazy" />
                </div>
                <div className="experience-copy">
                  <div className="experience-meta">
                    <span>{item.number}</span>
                    <span>{item.place}</span>
                  </div>
                  <h3 className="font-serif">{item.title}</h3>
                  <p>{item.text}</p>
                  <div className="experience-footer">
                    <span>{item.detail}</span>
                    <Link to={item.href} aria-label={`Explore ${item.title}`}>
                      ↗
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 2 — Destinations */}
      <section className="destinations section-block" id="destinations" aria-labelledby="destinations-title">
        <div className="shell">
          <div className="section-heading destinations-heading">
            <p className="eyebrow">Explore Sichuan</p>
            <h2 id="destinations-title" className="font-serif">
              One province.
              <br />
              <em>Many living cultures.</em>
            </h2>
            <p className="heading-note">
              Look beyond the scenery — from Chengdu&apos;s teahouses and Mount Qingcheng&apos;s Taoist
              heritage to Tibetan communities and highland roads.
            </p>
          </div>

          <div className="destination-mosaic">
            {DESTINATIONS.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className={`destination-tile ${item.size}`}
              >
                <img src={item.image} alt={item.alt} loading="lazy" />
                <span className="destination-shade" aria-hidden="true" />
                <span className="destination-content">
                  <span className="destination-title font-serif">{item.title}</span>
                  <span className="destination-text">{item.text}</span>
                </span>
                <span className="destination-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Journeys */}
      <section className="journeys section-block" id="journeys" aria-labelledby="journeys-title">
        <div className="shell">
          <div className="section-heading horizontal">
            <div>
              <p className="eyebrow">Signature Journeys</p>
              <h2 id="journeys-title" className="font-serif">
                Designed to take you deeper.
              </h2>
            </div>
            <Link to="/traveler/contact" className="text-link">
              Plan a journey <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="journey-list">
            {JOURNEYS.map((journey, index) => (
              <article key={journey.title} className="journey-card">
                <div className="journey-number">0{index + 1}</div>
                <div className="journey-image">
                  <img src={journey.image} alt={journey.alt} loading="lazy" />
                </div>
                <div className="journey-copy">
                  <p className="eyebrow">{journey.eyebrow}</p>
                  <h3 className="font-serif">{journey.title}</h3>
                  <p>{journey.text}</p>
                  <div className="tag-list">
                    {journey.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <Link
                  className="circle-link"
                  to={journey.href}
                  aria-label={`View ${journey.title}`}
                >
                  ↗
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="features section-block">
        <div className="shell">
          <div className="section-head">
            <p className="eyebrow">Why Choose Lumichan</p>
            <h2 className="font-serif">
              Travel Smarter<span className="em-accent">, Not Harder</span>
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

      <section className="cta-band shell">
        <div className="cta-band__inner">
          <p className="eyebrow light">Ready When You Are</p>
          <h2 className="font-serif">
            Ready to Start Your <em>Adventure</em>?
          </h2>
          <p>
            Let our AI plan your perfect journey or connect with local guides who know the hidden gems.
          </p>
          <div className="hero__actions hero__actions--center">
            <Link to="/traveler/contact" className="button button-light">
              Plan My Trip <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/traveler/itineraries" className="text-link light-link">
              Browse Itineraries
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
