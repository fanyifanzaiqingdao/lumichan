import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SoftImage from '../components/SoftImage.jsx'
import defaultHomepage from '../data/homepage.js'
import { track } from '../lib/analytics.js'
import InquiryForm from './InquiryForm.jsx'
import './HomeBase.css'

const serviceAnchors = {
  planning: 'planning-support',
  'road-trip': 'private-road-trip',
  signature: 'signature-private-journey',
  education: 'educational-cultural-journeys',
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
    {item.photo && <SoftImage src={item.photo} alt={item.photoAlt || ''} loading="lazy" width={320} height={240} />}
    <p>“{long && !expanded ? `${item.quote.slice(0, 277)}…` : item.quote}”</p>
    {long && <button type="button" className="review-expand" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? 'Show less' : 'Read more'}</button>}
    <footer>{item.identity} · {item.tripType} · {item.tripDate}</footer>
  </blockquote>
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0)
  const [content, setContent] = useState(defaultHomepage)

  useEffect(() => {
    let cancelled = false
    fetch('/api/homepage.php', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Homepage API unavailable'))))
      .then((json) => {
        if (!cancelled && json.homepage) setContent(json.homepage)
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
  const copy = { ...defaultHomepage.copy, ...content.copy }
  const services = safeList(content.services, defaultHomepage.services)
  const journeys = safeList(content.journeys, defaultHomepage.journeys)
  const whyItems = safeList(content.whyItems, defaultHomepage.whyItems)
  const steps = safeList(content.steps, defaultHomepage.steps)
  const faqs = safeList(content.faqs, defaultHomepage.faqs)
  const vlogs = safeList(content.vlogs, []).filter((item) => item.published && item.cover && item.video && item.subtitle && item.caption && item.alt && item.consentRecord)
  const reviews = safeList(content.reviews, []).filter((item) => item.published && item.quote && item.identity && item.tripType && item.tripDate && item.sourceRecord && item.consentRecord)

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero__media" aria-hidden="true">
          <SoftImage src={hero.image || defaultHomepage.hero.image} alt="" loading="eager" fetchPriority="high" width={1920} height={1080} />
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

      <section className="home-services section section-pad" id="services">
        <div className="section-head">
          <p className="eyebrow">{copy.services.eyebrow}</p>
          <h2 className="font-serif">{copy.services.title}</h2>
          <p><SentenceLines text={copy.services.intro} /></p>
        </div>
        <div className="service-feature-list">
          {services.map((service, index) => (
            <article className="service-feature" key={service.id}>
              <div className="service-feature__copy">
                <span className="service-feature__number">{service.number || String(index + 1).padStart(2, '0')}</span>
                {index < 3 && <span className="service-feature__badge">Flexible booking</span>}
                <h3 className="font-serif">{service.title}</h3>
                <p>{service.summary}</p>
                <strong>{service.price}</strong>
                <Link to={service.href || `/traveler/services#${serviceAnchors[service.id] || 'planning-support'}`} className="text-gold-link" onClick={() => track('service_view', { service_id: service.id })}>Learn more <span aria-hidden="true">→</span></Link>
              </div>
              <div className="service-feature__visual" aria-hidden={!service.image}>
                {service.image
                  ? <SoftImage src={service.image} alt={service.imageAlt || service.title} loading="lazy" width={640} height={440} />
                  : <span>{service.title?.charAt(0)}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-journeys section-pad" id="journeys">
        <div className="section">
          <div className="section-head">
            <p className="eyebrow">{copy.journeys.eyebrow}</p>
            <h2 className="font-serif">{copy.journeys.title}</h2>
            <p>{copy.journeys.intro}</p>
          </div>
          <div className="journey-grid">
            {journeys.filter((journey) => journey.published !== false).map((journey) => (
              <article className="journey-card" key={journey.slug}>
                <div className="journey-card__media">
                  <SoftImage src={journey.image} alt={journey.imageAlt || journey.title} loading="lazy" width={640} height={480} />
                  <span>{journey.duration}</span>
                </div>
                <div className="journey-card__body">
                  <div className="journey-card__tags">{safeList(journey.tags, []).map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <h3 className="font-serif">{journey.title}</h3>
                  <p>{journey.summary}</p>
                  {journey.priceApproved && journey.price && journey.groupBasis && !/\[|placeholder|RMB\s*[—-]/i.test(`${journey.price} ${journey.groupBasis}`) ? (
                    <div className="journey-card__price"><strong>{journey.price}</strong><small>{journey.groupBasis}</small></div>
                  ) : <p className="journey-card__unpriced">Price confirmed in your proposal</p>}
                  <Link to={`/traveler/journeys/${journey.slug}`} className="text-gold-link" onClick={() => track('journey_view', { journey_slug: journey.slug, placeholder: false })}>View journey <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </div>
          <div className="section-cta"><Link to="/traveler/journeys" className="btn btn-ghost">Explore all journeys</Link></div>
        </div>
      </section>

      <section className="home-why section section-pad" id="why">
        <div className="home-why__media"><SoftImage src={content.whyImage || defaultHomepage.whyImage} alt={content.whyImageAlt || 'Travelers exploring China together'} loading="lazy" width={720} height={900} /></div>
        <div className="home-why__copy">
          <p className="eyebrow">{copy.why.eyebrow}</p>
          <h2 className="font-serif">{copy.why.title}</h2>
          <p>{copy.why.intro}</p>
          <div className="home-why__items">
            {whyItems.slice(0, 4).map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="home-process section-pad" id="how">
        <div className="section">
          <div className="section-head">
            <p className="eyebrow">{copy.process.eyebrow}</p>
            <h2 className="font-serif">{copy.process.title}</h2>
            <p>{copy.process.intro}</p>
          </div>
          <div className="home-timeline">
            {steps.map(([number, title, body, note]) => <article key={number}><span className="home-timeline__number">{number}</span><div><h3>{title}</h3><p>{body}</p><small>{note}</small></div></article>)}
          </div>
          {vlogs.length > 0 && <div className="home-vlogs">{vlogs.map((item) => <article key={item.title}><video controls preload="none" poster={item.cover} aria-label={item.alt}><source src={item.video} /><track kind="captions" src={item.subtitle} srcLang="en" label="English" default /></video><h3>{item.title}</h3><p>{item.caption}</p></article>)}</div>}
        </div>
      </section>

      <section className="home-reviews section section-pad" id="reviews" aria-labelledby="reviews-heading">
        <div className="section-head"><p className="eyebrow">GUEST STORIES</p><h2 id="reviews-heading" className="font-serif">Words From Our Travelers</h2><p>Real journeys. Real experiences. Stories worth sharing.</p></div>
        {reviews.length > 0
          ? <div className="review-grid">{reviews.map((item) => <ReviewQuote key={item.sourceRecord} item={item} />)}</div>
          : <p className="review-empty">No traveler stories have been published yet.</p>}
      </section>

      <section className="home-faq section section-pad" id="faq">
        <div className="section-head"><p className="eyebrow">{copy.faq.eyebrow}</p><h2 className="font-serif">{copy.faq.title}</h2><p>{copy.faq.intro || defaultHomepage.copy.faq.intro}</p></div>
        <div className="faq-list">{faqs.map(([question, answer], index) => {
          const isOpen = openFaq === index
          return <div className="faq-item" key={question}>
            <h3><button type="button" aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => { setOpenFaq(isOpen ? -1 : index); if (!isOpen) track('faq_open', { faq_id: index + 1 }) }}><span>{question}</span><span aria-hidden="true">{isOpen ? '−' : '+'}</span></button></h3>
            <div id={`faq-answer-${index}`} hidden={!isOpen}><p>{answer}</p></div>
          </div>
        })}</div>
      </section>

      <section className="home-inquiry section section-pad" id="inquiry">
        <div className="home-inquiry__intro">
          <p className="eyebrow">{copy.inquiry.eyebrow}</p>
          <h2 id="inquiry-heading" tabIndex={-1} className="font-serif">{copy.inquiry.title}</h2>
          <p><SentenceLines text={copy.inquiry.intro} /></p>
          <p><SentenceLines text={copy.inquiry.reassurance} /></p>
        </div>
        <InquiryForm services={services} track={track} config={{ ...defaultHomepage.formConfig, ...content.formConfig }} />
      </section>
    </div>
  )
}
