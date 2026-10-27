import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SoftImage from '../components/SoftImage.jsx'
import defaultHomepage from '../data/homepage.js'
import { track } from '../lib/analytics.js'
import InquiryForm from './InquiryForm.jsx'
import BookingPolicy from '../components/BookingPolicy.jsx'
import JourneyGallery from '../components/JourneyGallery.jsx'
import JourneyStories from '../components/JourneyStories.jsx'
import servicesPageSeed, { safeServiceLink } from '../lib/servicesPage.js'
import { ChevronDown } from 'lucide-react'
import { journeyPriceBadge, normalizeHomepage, publishedReviews, serviceImage } from '../lib/homepageContent.js'
import './HomeBase.css'

const ReviewPreview = (import.meta.env.MODE === 'staging' || import.meta.env.DEV)
  ? lazy(() => import('../components/ReviewPreview.jsx'))
  : null

function HeadingText({ text, accent }) {
  const index = text.indexOf(accent)
  if (index < 0) return text
  return <>{text.slice(0, index)}<span className="heading-accent">{accent}</span>{text.slice(index + accent.length)}</>
}

function safeList(items, fallback) {
  return Array.isArray(items) ? items : fallback
}

function SentenceLines({ text }) {
  return String(text).split(/\n+|(?<=[.!?])\s+/).map((line, index) => (
    <span className="sentence-line" key={index}>{index > 0 && ' '}{line}</span>
  ))
}

function ReviewQuote({ item }) {
  const [expanded, setExpanded] = useState(false)
  const long = item.quote.length > 280
  return <blockquote>
    <SoftImage src={item.image} alt={item.imageAlt} style={{ objectPosition: item.imageFocalPoint || '50% 50%' }} loading="lazy" width={1600} height={1000} />
    <div className="review-card__body">
    <p>“{long && !expanded ? `${item.quote.slice(0, 277)}…` : item.quote}”</p>
    {long && <button type="button" className="review-expand" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? 'Show less' : 'Read more'}</button>}
    <footer>{item.guestDisplayName} · {item.tripContext}</footer>
    </div>
  </blockquote>
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0)
  const [content, setContent] = useState(defaultHomepage)
  const [serviceDetails, setServiceDetails] = useState(servicesPageSeed.services)
  const [serviceMediaReady, setServiceMediaReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/services-page.php').then((res) => res.ok ? res.json() : Promise.reject()).then((json) => { if (!cancelled && json.page?.services) setServiceDetails(json.page.services) }).catch(() => {})
    fetch('/api/homepage.php', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Homepage API unavailable'))))
      .then((json) => {
        if (!cancelled && json.homepage) {
          setContent(normalizeHomepage(json.homepage))
          setServiceMediaReady(true)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const seo = content.seo || defaultHomepage.seo
    if (seo.title) document.title = seo.title
    for (const [selector, value] of [
      ['meta[name="description"]', seo.description],
      ['meta[property="og:title"]', seo.title],
      ['meta[property="og:description"]', seo.description],
    ]) {
      const element = document.head.querySelector(selector)
      if (element && value) element.setAttribute('content', value)
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: safeList(content.faqs, defaultHomepage.faqs).map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    })
    document.head.appendChild(script)
    return () => script.remove()
  }, [content])

  const hero = { ...defaultHomepage.hero, ...content.hero }
  const copy = Object.fromEntries(Object.entries(defaultHomepage.copy).map(([key, value]) => [key, { ...value, ...content.copy?.[key] }]))
  const services = safeList(content.services, defaultHomepage.services)
  const journeys = safeList(content.journeys, defaultHomepage.journeys)
  const whyItems = safeList(content.whyItems, defaultHomepage.whyItems)
  const steps = safeList(content.process?.steps, defaultHomepage.process.steps).slice().sort((a, b) => a.order - b.order)
  const faqs = safeList(content.faqs, defaultHomepage.faqs)
  const reviews = publishedReviews(safeList(content.reviews, []))

  return (
    <div className="home home--reference home--v22">
      <section className="home-hero">
        <div className="home-hero__media" aria-hidden="true">
          <picture>{hero.mobileImage && <source media="(max-width: 767px)" srcSet={hero.mobileImage} />}<SoftImage src={hero.image || defaultHomepage.hero.image} style={{ objectPosition: hero.imageFocalPoint || "50% 50%" }} alt="" loading="eager" fetchPriority="high" width={1920} height={1080} /></picture>
        </div>
        <div className="section home-hero__content">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 className="font-serif"><SentenceLines text={hero.title} /></h1>
          <p className="home-hero__subtitle">{hero.subtitle}</p>
          <div className="home-hero__actions">
            <Link to={hero.primaryCta?.href || '/traveler#inquiry'} className="btn btn-gold" onClick={() => track('cta_click', { label: 'Plan my journey', destination: '/traveler#inquiry', section: 'hero' })}>{hero.primaryCta?.label || 'Plan my journey'}</Link>
            <Link to={hero.secondaryCta?.href || '/traveler/services'} className="btn btn-ghost" onClick={() => track('cta_click', { label: 'Explore services', destination: '/traveler/services', section: 'hero' })}>{hero.secondaryCta?.label || 'Explore services'}</Link>
          </div>
          <ul className="home-hero__trust">
            {safeList(hero.trustPoints, defaultHomepage.hero.trustPoints).map((point) => <li key={point}>{point}</li>)}
          </ul>
        </div>
      </section>

      <section className="home-services section-pad" id="services">
        <div className="section">
        <div className="section-head">
          <p className="eyebrow">{copy.services.eyebrow}</p>
          <h2 className="font-serif"><HeadingText text={copy.services.title} accent="Your Way" /></h2>
          <p>{copy.services.intro}</p>
        </div>
        <div className="service-feature-list">
          {[...services].sort((a, b) => ["road-trip", "planning", "signature", "education"].indexOf(a.id) - ["road-trip", "planning", "signature", "education"].indexOf(b.id)).map((service, index) => {
            const image = serviceMediaReady ? serviceImage(service) : null
            const imageAlt = service.imageAlt || service.title
            const detail = serviceDetails.find((item) => item.id === service.id)
            const href = safeServiceLink(service.detailPageUrl || service.href)
            const linkedTitle = service.id !== 'education' && service.titleLinkEnabled !== false
            const linkedImage = service.id !== 'education' && service.imageLinkEnabled !== false
            const Visual = linkedImage ? Link : 'div'
            return (
            <article className={`service-feature service-feature--${service.id}${serviceMediaReady && !image ? ' service-feature--text-only' : ''}`} key={service.id}>
              <div className="service-feature__copy">
                <h3 className="font-serif">{linkedTitle ? <Link to={href}>{service.title}</Link> : service.title}</h3>
                <p>{service.summary}</p>
                <ul className="service-feature__highlights">{safeList(service.includedHighlights, []).map((item) => <li key={item}>{item}</li>)}</ul>
                <div className="service-feature__price"><strong>{service.price}</strong><span>{service.unit}</span></div>
                <p className="service-feature__price-note">{service.priceNote}</p>
                <details className="service-feature__policy">
                  <summary>Service and booking details <ChevronDown size={18} aria-hidden="true" /></summary>
                  {detail && <ul className="home-service-inclusions">{detail.included.map((item) => <li key={item}>{item}</li>)}</ul>}
                  <BookingPolicy service={service} version={content.bookingPolicyVersion} summary />
                </details>
                <div className="service-feature__actions">
                  <Link to={`/traveler/contact?service=${encodeURIComponent(service.id)}`} className="btn btn-gold" onClick={() => track('cta_click', { service_id: service.id, section: 'services' })}>Plan my journey <span aria-hidden="true">→</span></Link>

                </div>
              </div>
              {(!serviceMediaReady || image) && <Visual to={linkedImage ? href : undefined} aria-label={linkedImage ? `View ${service.title}` : undefined} className="service-feature__visual">
                {image && <SoftImage src={image} alt={imageAlt} style={{ objectPosition: service.imageFocalPoint || '50% 50%' }} loading="lazy" width={800} height={900} />}
                <span className="service-feature__number" aria-hidden="true">{service.number || String(index + 1).padStart(2, '0')}</span>
                {service.media?.aiGenerated && <span className="ai-image-label">AI-generated illustration</span>}

              </Visual>}
            </article>
          )})}
        </div>
        <div className="services-footer">
          <div><strong>{copy.services.reassurance}</strong><p>{copy.services.disclaimer} <Link to="/traveler/booking-terms">Booking Terms</Link></p></div>
          <Link to="/traveler/services" className="btn btn-forest" onClick={() => track('cta_click', { label: 'Explore all services', destination: '/traveler/services', section: 'services' })}>Explore all services <span aria-hidden="true">→</span></Link>
        </div>
        </div>
      </section>

      <section className="home-journeys section-pad" id="journeys">
        <div className="section">
          <div className="section-head">
            <p className="eyebrow">{copy.journeys.eyebrow}</p>
            <h2 className="font-serif"><HeadingText text={copy.journeys.title} accent="Journeys" /></h2>
            <p>{copy.journeys.intro}</p>
          </div>
          <div className="journey-grid">
            {journeys.filter((journey) => journey.published !== false).map((journey) => (
              <article className="journey-card" key={journey.slug}>
                <div className="journey-card__media">
                  <SoftImage src={journey.image} alt={journey.imageAlt || journey.title} loading="lazy" width={640} height={480} />
                  {journey.showHomepagePrice === true && journeyPriceBadge(journey) && <span>{journeyPriceBadge(journey)}</span>}
                </div>
                <div className="journey-card__body">
                  <h3 className="font-serif">{journey.title}</h3>
                  <p>{journey.summary}</p>
                  <div className="journey-card__tags">{safeList(journey.tags, []).map((tag) => <span key={tag}>{tag}</span>)}</div>
                  {journey.showHomepagePrice === true && journey.priceApproved && journey.price && journey.groupBasis && !/\[|placeholder|RMB\s*[—-]/i.test(`${journey.price} ${journey.groupBasis}`) ? (
                    <div className="journey-card__price"><strong>{journey.price}</strong><small>{journey.groupBasis}</small></div>
                  ) : null}
                  <Link to={`/traveler/journeys/${journey.slug}`} className="text-gold-link" onClick={() => track('journey_view', { journey_slug: journey.slug, placeholder: false })}>View journey <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </div>
          <div className="section-cta"><Link to="/traveler#inquiry" className="btn btn-forest">Plan my journey <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <section className="home-why section section-pad" id="why">
        <div className="home-why__media"><JourneyGallery images={content.whyGallery || defaultHomepage.whyGallery} /></div>
        <div className="home-why__copy">
          <p className="eyebrow">{copy.why.eyebrow}</p>
          <h2 className="font-serif"><HeadingText text={copy.why.title} accent="Travel Plan" /></h2>
          <p>{copy.why.intro}</p>
          <div className="home-why__items">
            {whyItems.slice(0, 4).map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}
          </div>
          <div className="home-why__cta"><Link to="/traveler#inquiry" className="btn btn-gold">Plan my journey <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <section className="home-process section-pad" id="how">
        <div className="section">
          <div className="section-head">
            <p className="eyebrow">{copy.process.eyebrow}</p>
            <h2 className="font-serif"><HeadingText text={copy.process.title} accent="Lumichan" /></h2>
            <p>{copy.process.intro}</p>
          </div>
          <ol className="home-timeline">
            {steps.map(({ number, title, body, reassurance }) => <li key={number}><span className="home-timeline__number">{number}</span><div><h3>{title}</h3><p>{body}</p><small>{reassurance}</small></div></li>)}
          </ol>
          <JourneyStories stories={content.storySequences || defaultHomepage.storySequences} copy={copy.stories} />
        </div>
      </section>

      <section className="home-reviews section section-pad" id="reviews" aria-labelledby="reviews-heading">
        <div className="section-head"><p className="eyebrow">{copy.reviews.eyebrow}</p><h2 id="reviews-heading" className="font-serif"><SentenceLines text={copy.reviews.title} /></h2><p>{copy.reviews.intro}</p></div>
        {reviews.length > 0
          ? <div className="review-grid">{reviews.map((item) => <ReviewQuote key={item.id} item={item} />)}</div>
          : ReviewPreview ? <Suspense fallback={null}><ReviewPreview /></Suspense> : <p className="home-review-empty">Traveler stories will appear here once their sources and photo permissions have been verified.</p>}
      </section>

      <section className="home-faq section-pad" id="faq">
        <div className="section">
        <div className="section-head"><p className="eyebrow">{copy.faq.eyebrow}</p><h2 className="font-serif"><HeadingText text={copy.faq.title} accent="Questions" /></h2><p>{copy.faq.intro || defaultHomepage.copy.faq.intro}</p></div>
        <div className="faq-list">{faqs.map(([question, answer], index) => {
          const isOpen = openFaq === index
          return <div className="faq-item" key={question}>
            <h3><button type="button" aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => { setOpenFaq(isOpen ? -1 : index); if (!isOpen) track('faq_open', { faq_id: index + 1 }) }}><span>{question}</span><span aria-hidden="true">{isOpen ? '−' : '+'}</span></button></h3>
            <div id={`faq-answer-${index}`} hidden={!isOpen}><p>{answer}</p></div>
          </div>
        })}</div>
        </div>
      </section>

      <section className="home-inquiry section-pad" id="inquiry">
        <div className="section home-inquiry__layout">
        <div className="home-inquiry__intro">
          <p className="eyebrow">{copy.inquiry.eyebrow}</p>
          <h2 id="inquiry-heading" tabIndex={-1} className="font-serif"><HeadingText text={copy.inquiry.title} accent="Starts Here" /></h2>
          <p><SentenceLines text={copy.inquiry.intro} /></p>
          <p><SentenceLines text={copy.inquiry.reassurance} /></p>
        </div>
        <InquiryForm services={services} track={track} config={{ ...defaultHomepage.formConfig, ...content.formConfig }} />
        </div>
      </section>
    </div>
  )
}
