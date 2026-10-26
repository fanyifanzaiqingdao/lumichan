import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import SoftImage from '../components/SoftImage.jsx'
import { track } from '../lib/analytics.js'
import defaultHomepage from '../data/homepage.js'
import { journeyPriceBadge, normalizeHomepage } from '../lib/homepageContent.js'
import './Journeys.css'
import './JourneysExtras.css'

const defaultJourneys = [
  {
    slug: 'chengdu-cultural-gateway',
    title: 'Chengdu Cultural Gateway',
    duration: '1 day',
    image: '/images/experiences/chengdu-teahouse-card.jpg',
    summary: "Pandas, local food, tea houses and a taste of Chengdu's easygoing lifestyle.",
    highlights: ['Panda and Chengdu city culture', 'Tea house rhythm and local food', 'Easy introduction to Sichuan life'],
    flow: [],
    included: ['Private planning support', 'Local route guidance', 'Recommended stops and timing'],
    notIncluded: ['Final attraction tickets until proposal', 'Meals unless quoted', 'Personal expenses'],
    idealFor: 'First-time visitors, short Chengdu stays and travelers who want a soft landing before a longer China journey.',
    note: 'Designed as an easy-paced city day. Final route depends on date, opening hours and traveler preferences.',
  },
  {
    slug: 'western-sichuan-private-road-trip',
    title: 'Western Sichuan Private Road Trip',
    duration: '5 days',
    image: '/images/journeys/western-sichuan-card.jpg',
    summary: 'Mountain roads, open grasslands and local cultural encounters.',
    highlights: ['Private vehicle pacing', 'Mountain and grassland landscapes', 'Flexible stops and practical road support'],
    flow: [],
    included: ['Private route design', 'Vehicle and English-speaking driver scope in proposal', 'Travel support during the journey'],
    notIncluded: ['Accommodation unless quoted', 'Meals unless quoted', 'Special experiences until confirmed'],
    idealFor: 'Families, small private groups and travelers who want Western Sichuan without a fixed tour-bus schedule.',
    note: 'Some areas involve altitude and long drives. Pacing and preparation must be confirmed before booking.',
  },
  {
    slug: 'deep-cultural-journey',
    title: 'Deep Cultural Journey',
    duration: '7-10 days',
    image: '/culture/tibetan-monastery.jpg',
    summary: 'A slower journey into landscapes, communities and living traditions.',
    highlights: ['Slower cultural pacing', 'Living traditions and landscape context', 'Custom encounters with local specialists where available'],
    flow: [],
    included: ['Custom journey planning', 'Cultural experience coordination', 'Local support and specialist recommendations'],
    notIncluded: ['Specialist fees until quoted', 'Hotels and meals unless quoted', 'Insurance terms until approved'],
    idealFor: 'Travelers seeking depth, context and a more personal way to understand places beyond sightseeing.',
    note: 'Detailed daily itinerary remains draft until Lumichan confirms route access, permissions and final service scope.',
  },
]

function JourneyDetail({ journey }) {
  const approvedDetails = journey.detailsApproved ? journey.details || {} : {}
  const flow = Array.isArray(approvedDetails.flow) ? approvedDetails.flow : []
  const gallery = Array.isArray(approvedDetails.gallery) ? approvedDetails.gallery : []
  return (
    <article className="journey-detail" id={journey.slug}>
      <div className="journey-detail__hero">
        <SoftImage src={journey.image} alt={journey.imageAlt || journey.title} loading="lazy" width={960} height={640} />
        <div>
          <span>{journey.duration}</span>
          <h2 className="font-serif">The Journey</h2>
          <p>{journey.summary}</p>
          {journeyPriceBadge(journey) && <p><strong>{journeyPriceBadge(journey)}</strong></p>}
          {journey.priceApproved && journey.price && journey.groupBasis
            ? <p>{journey.price} · {journey.groupBasis}</p>
            : <p>Price and private group basis are confirmed in your personal proposal.</p>}
          <Link to="/traveler#inquiry" className="btn btn-gold" onClick={() => track('cta_click', { label: 'Plan my journey', destination: '/traveler#inquiry', section: journey.slug })}>Plan my journey</Link>
        </div>
      </div>

      <div className="journey-detail__grid">
        <section>
          <h3>Experience Highlights</h3>
          <ul>{(approvedDetails.highlights || journey.highlights).map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section>
          <h3>Suggested Flow</h3>
          {flow.length ? <ol>{flow.map((item) => <li key={item}>{item}</li>)}</ol> : <p>Your day-by-day route is designed and confirmed with you before booking.</p>}
        </section>
        <section>
          <h3>Included</h3>
          <p>Exact inclusions are confirmed in your written proposal.</p>
        </section>
        <section>
          <h3>Not Included / Confirm Later</h3>
          <p>Any optional and third-party costs are disclosed before booking.</p>
        </section>
        <section>
          <h3>Ideal For</h3>
          <p>{approvedDetails.idealFor || journey.idealFor}</p>
        </section>
        <section>
          <h3>Pace / Altitude Note</h3>
          <p>{approvedDetails.note || journey.note}</p>
        </section>
      </div>
      {gallery.length > 0 && <section className="journey-detail__gallery" aria-label="Journey gallery">
        {gallery.map((image) => <SoftImage key={image.src} src={image.src} alt={image.alt} loading="lazy" width={640} height={480} />)}
      </section>}
    </article>
  )
}

export default function Journeys() {
  const { slug } = useParams()
  const [configured, setConfigured] = useState(defaultHomepage.journeys)
  useEffect(() => {
    let active = true
    fetch('/api/homepage.php')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unavailable')))
      .then((data) => { if (active && data.homepage) setConfigured(normalizeHomepage(data.homepage).journeys) })
      .catch(() => {})
    return () => { active = false }
  }, [])
  const journeys = defaultJourneys.map((journey) => {
    const saved = configured.find((item) => item.slug === journey.slug)
    return { ...journey, ...saved, detailsApproved: !!saved?.detailsApproved, details: saved?.details || null }
  })
  const selected = journeys.find((journey) => journey.slug === slug)
  if (slug && !selected) return <Navigate to="/traveler/journeys" replace />

  return (
    <div className="journeys-page">
      <section className="section section-pad journeys-page__hero">
        <div className="eyebrow">Journeys</div>
        <h1 className="font-serif">{selected ? selected.title : 'Popular Journeys'}</h1>
        <p>These routes are customizable starting points, not fixed group tours. Your proposal confirms the final price, inclusions and private group basis.</p>
      </section>

      {!selected && (
        <section className="section journeys-page__cards" aria-label="Journey list">
          {journeys.map((journey) => (
            <Link to={`/traveler/journeys/${journey.slug}`} key={journey.slug} className="journey-list-card">
              <SoftImage src={journey.image} alt={journey.imageAlt || journey.title} loading="lazy" width={640} height={480} />
              <div>
                <span>{journey.duration}</span>
                <h2 className="font-serif">{journey.title}</h2>
                <p>{journey.summary}</p>
                {journeyPriceBadge(journey) && <strong>{journeyPriceBadge(journey)}</strong>}
                <em>{journey.priceApproved && journey.price && journey.groupBasis ? `${journey.price} · ${journey.groupBasis}` : 'Price confirmed in your proposal'}</em>
              </div>
            </Link>
          ))}
        </section>
      )}

      {selected && <section className="section journeys-detail-list"><JourneyDetail journey={selected} /></section>}
    </div>
  )
}
