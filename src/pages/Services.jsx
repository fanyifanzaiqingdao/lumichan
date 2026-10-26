import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { track } from '../lib/analytics.js'
import defaultHomepage from '../data/homepage.js'
import { normalizeHomepage } from '../lib/homepageContent.js'
import BookingPolicy from '../components/BookingPolicy.jsx'
import './Services.css'

const defaultServices = [
  {
    id: 'planning-support',
    number: '01',
    title: 'Journey Planning & Local Support',
    tagline: 'Plan it yourself. Travel with a local expert in your pocket.',
    price: 'From USD 99 / trip',
    priceDetail: '1-5 days: USD 99 · 6-10 days: USD 199',
    description:
      'Already know where you want to go, but not sure how everything works in China? We help turn your ideas into a practical trip and stay available when you need local help along the way.',
    included: [
      'Personalized itinerary planning',
      'Digital travel planning booklet',
      'Hotel and local transportation recommendations',
      'Support with payments, mobile connectivity and pre-trip preparation',
      'Guidance on travel insurance and other practical questions',
      'Online assistance during your journey',
      'Local recommendations when plans change',
    ],
    perfectFor:
      'Independent travelers who want a trusted local contact, more freedom, fewer mistakes and better value without hiring a full-time guide.',
    support: 'Before your trip 08:00-16:00 China Time. During your trip 08:00-23:00 China Time.',
    goodToKnow: 'Third-party costs are quoted separately and confirmed before booking.',
    booking: 'Changes and cancellation terms are confirmed before booking.',
  },
  {
    id: 'private-road-trip',
    number: '02',
    title: 'Private Road Trip',
    tagline: 'Your own car. Your own pace. No tour-bus timetable.',
    price: 'From USD 299 / day / vehicle',
    priceDetail: 'Recommended for up to 4 travelers',
    description:
      'Want the freedom of independent travel without worrying about transportation, routes or local logistics? We arrange your journey, private vehicle and English-speaking driver, while our local team supports you throughout the trip.',
    included: [
      'Personalized itinerary planning and pre-trip travel support',
      'Private vehicle throughout the journey',
      'English-speaking driver',
      'Comfortable vehicle selected for the route and group needs',
      'Local hotel and restaurant recommendations',
      'Booking assistance and travel support during the journey',
      'Travel insurance included',
      'One Lumichan welcome meal and welcome gift',
    ],
    perfectFor:
      'Western Sichuan and routes where private transport makes travel easier; family travel, including journeys with children; travelers with limited vacation time; flexible pacing without a fixed group-tour schedule.',
    support: 'Local support during the confirmed journey schedule.',
    goodToKnow: 'Accommodation and meals are not included unless stated in your quotation.',
    booking: 'Changes and cancellation terms are confirmed before booking.',
  },
  {
    id: 'signature-private-journey',
    includedHeading: 'Your journey may include',
    number: '03',
    title: 'Signature Private Journey',
    tagline: 'Designed around you - not around a standard itinerary.',
    price: 'From USD 699 / day / vehicle',
    priceDetail: 'Final pricing depends on the itinerary and service requirements',
    description:
      "This is Lumichan's fully customized travel experience for guests who want deeper access, more personal service and greater flexibility.",
    included: [
      'One-to-one journey planning and travel concierge',
      'Private vehicle with English-speaking driver',
      'Professional guide and interpreter when required',
      'Carefully selected hotels and restaurants',
      'Personalized cultural experiences',
      'Local experts, artists, craftspeople or cultural specialists',
      'Business, institutional or professional visits where available',
      'Special-interest travel designed around your personal goals',
      'Travel insurance included',
      'Priority support, welcome meal and welcome gift',
    ],
    perfectFor:
      'Guests who value privacy, flexibility and deeper experiences, or have specific interests that require strong local knowledge and coordination.',
    support: 'Priority support before and during the confirmed journey.',
    goodToKnow: 'Accommodation, meals and special experiences are quoted separately unless included in your confirmed package.',
    booking: 'Changes and cancellation terms are confirmed before booking.',
  },
  {
    id: 'educational-cultural-journeys',
    includedHeading: 'Programs may include',
    audienceHeading: 'Designed for',
    number: '04',
    title: 'Educational & Cultural Journeys',
    tagline: 'Travel that goes beyond visiting - into learning, exchange and understanding.',
    price: 'Price depends on program',
    priceDetail: 'Minimum 6 travelers · Institutional and organizational bookings',
    description:
      'Lumichan designs customized educational journeys in China for universities, schools, cultural organizations and corporate groups.',
    included: [
      'Customized study-tour curriculum development',
      'Cooperation with universities and educational institutions',
      'Chinese language and intercultural learning programs',
      'Academic or specialist-led experiences',
      'Traditional arts and heritage experiences',
      'Company and institutional visits',
      'Cultural expert exchanges',
      'Private transportation with English-speaking driver',
      'Accommodation and dining coordination',
      'Dedicated journey management from preparation to completion',
    ],
    perfectFor:
      'University and student groups; Chinese-language learning programs; international cultural exchange programs; corporate learning and study visits; institutions looking for customized China programs.',
    support: 'Dedicated program management from preparation to completion.',
    goodToKnow: 'Program cancellation and date-change terms are confirmed in writing before booking.',
    booking: 'Program cancellation and date-change terms are confirmed before booking.',
    legalPending: true,
  },
]

export default function Services() {
  const [configured, setConfigured] = useState(defaultHomepage.services)
  const [policyVersion, setPolicyVersion] = useState(defaultHomepage.bookingPolicyVersion)
  useEffect(() => {
    let active = true
    fetch('/api/homepage.php')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unavailable')))
      .then((data) => {
        if (active) {
          const homepage = normalizeHomepage(data.homepage)
          setConfigured(homepage.services)
          setPolicyVersion(homepage.bookingPolicyVersion)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])
  const services = defaultServices.map((service) => {
    const saved = configured.find((item) => item.id === service.id || item.href?.endsWith('#' + service.id))
    const details = saved?.details || {}
    return {
      ...service,
      bookingPolicy: saved?.bookingPolicy,
      bookingApproved: saved?.bookingApproved,
      serviceId: saved?.id,
      title: saved?.title || service.title,
      price: saved ? [saved.price, saved.unit].filter(Boolean).join(' ') : service.price,
      booking: saved?.bookingApproved && policyVersion ? saved.booking : service.booking,
      tagline: details.tagline || saved?.summary || service.tagline,
      description: details.description || service.description,
      included: Array.isArray(details.included) && details.included.length ? details.included : service.included,
      perfectFor: details.perfectFor || service.perfectFor,
      support: details.support || service.support,
      goodToKnow: details.goodToKnow || service.goodToKnow,
      priceDetail: details.priceDetail || saved?.priceNote || service.priceDetail,
    }
  })
  return (
    <div className="services-page">
      <section className="section section-pad services-page__hero">
        <div className="eyebrow">Services</div>
        <h1 className="font-serif">Choose the Right Support for Your Journey.</h1>
        <p>Compare Lumichan&apos;s four service types, then tell us what feels most useful for your trip.</p>
      </section>

      <div className="section services-page__layout">
        <aside className="services-nav" aria-label="Service navigation">
          {services.map((service) => (
            <a key={service.id} href={`#${service.id}`}>
              <span>{service.number}</span>
              {service.title}
            </a>
          ))}
        </aside>

        <div className="services-detail-list">
          {services.map((service) => (
            <article id={service.id} key={service.id} className="service-detail">
              <div className="service-detail__top">
                <div>
                  <span className="service-detail__number">{service.number}</span>
                  <h2 className="font-serif">{service.title}</h2>
                  <p className="service-detail__tagline">{service.tagline}</p>
                </div>
                <div className="service-detail__price">
                  <strong>{service.price}</strong>
                  <span>{service.priceDetail}</span>
                </div>
              </div>

              <p className="service-detail__description">{service.description}</p>

              <div className="service-detail__grid">
                <section>
                  <h3>{service.includedHeading || "What's Included"}</h3>
                  <ul>
                    {service.included.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
                <section>
                  <h3>{service.audienceHeading || 'Perfect for You If'}</h3>
                  <p>{service.perfectFor}</p>
                  <h3>Support Hours / Good to Know</h3>
                  <p>{service.support}</p>
                  <p>{service.goodToKnow}</p>
                </section>
              </div>

              <BookingPolicy service={service} version={policyVersion} />

              <Link to={`/traveler?service=${service.serviceId}#inquiry`} className="btn btn-gold" onClick={() => track('cta_click', { label: 'Plan my journey', destination: '/traveler#inquiry', section: service.id })}>Plan my journey</Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
