import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Tag, Users, Compass, CarFront, MessageSquare, ClipboardList, BadgeDollarSign, CalendarCheck, ShieldCheck, Headphones, ChevronLeft, ChevronRight, X } from 'lucide-react'
import defaultHomepage from '../data/homepage.js'
import { normalizeHomepage } from '../lib/homepageContent.js'
import { normalizeServicesPage, safeServiceLink, servicesPreview, visibleServiceMedia } from '../lib/servicesPage.js'
import BookingPolicy from '../components/BookingPolicy.jsx'
import { track } from '../lib/analytics.js'
import './Services.css'

const whyIcons = [Tag, Users, Compass, CarFront]
const pricingIcons = [MessageSquare, ClipboardList, BadgeDollarSign, CalendarCheck]
const vehicleIcons = [CarFront, Users, ShieldCheck, Headphones]
const icons = (list, index) => { const Icon = list[index % list.length]; return <Icon aria-hidden="true" strokeWidth={1.5} /> }

function ServiceImage({ image, className = '', eager = false }) {
  const media = visibleServiceMedia(image)
  if (!media) return <div className={'sp-image-empty ' + className} aria-hidden="true"><Compass /></div>
  return <div className={'sp-image ' + className}>
    <img src={media.src} alt={media.alt} style={{ objectPosition: media.focalPoint }} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} />
    {media.aiGenerated && <span className="sp-image-label">AI illustration</span>}
  </div>
}
function SectionHead({ module, centered = false }) {
  return <div className={'sp-section-head' + (centered ? ' is-centered' : '')}>
    {module.eyebrow && <p className="eyebrow">{module.eyebrow}</p>}
    <h2>{module.title}</h2>{module.body && <p>{module.body}</p>}
  </div>
}
function Action({ label = 'Plan My Journey', to = '/traveler/contact', section, className = '' }) {
  const href = safeServiceLink(to)
  return <Link to={href} className={'btn btn-gold ' + className} onClick={() => track('cta_click', { label, destination: href, section })}>{label}</Link>
}

export default function Services() {
  const [content, setContent] = useState(() => normalizeServicesPage())
  const [home, setHome] = useState(defaultHomepage)
  const [previewReviews, setPreviewReviews] = useState([])
  const [fullImage, setFullImage] = useState(null)
  const dialog = useRef(null)
  const opener = useRef(null)
  const gallery = useRef(null)
  const location = useLocation()
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/services-page.php', { signal: controller.signal }).then((r) => r.ok ? r.json() : Promise.reject()).then((data) => setContent(normalizeServicesPage(data.page))).catch(() => {})
    fetch('/api/homepage.php', { signal: controller.signal }).then((r) => r.ok ? r.json() : Promise.reject()).then((data) => setHome(normalizeHomepage(data.homepage))).catch(() => {})
    if (servicesPreview) import('../data/serviceReviewPreview.js').then(({ default: reviews }) => { if (!controller.signal.aborted) setPreviewReviews(reviews) })
    const previousTitle = document.title
    document.title = 'Travel Services | Lumichan'
    return () => { controller.abort(); document.title = previousTitle }
  }, [])
  useEffect(() => {
    // Preserve existing links from homepage and older shared URLs.
    if (location.hash !== '#educational-cultural-journeys') return
    document.getElementById('educational-cultural-journeys')?.scrollIntoView()
  }, [location.hash, content])
  useEffect(() => {
    if (!fullImage) return
    const element = dialog.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    return () => { element.close(); document.body.style.overflow = overflow; opener.current?.focus() }
  }, [fullImage])
  function moveGallery(direction) {
    const element = gallery.current
    element?.scrollBy({ left: direction * element.clientWidth * 0.75, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  const reviews = content.reviews.length ? content.reviews : servicesPreview ? previewReviews : []
  const moduleCta = (module) => <div className="sp-section-cta"><Action label={module.ctaLabel} to={module.ctaUrl} section={module.id} /></div>
  const render = {
    hero: (m) => <section className="sp-hero" aria-labelledby="sp-title">
      <ServiceImage image={m.image} className="sp-hero-image" eager />
      <div className="sp-container sp-hero-copy"><p className="eyebrow">{m.eyebrow}</p><h1 id="sp-title">{m.title.split('\n').map((line, i) => <span key={i} className={i ? 'text-gold' : ''}>{line}</span>)}</h1><p className="sp-lead">{m.body}</p><p className="sp-hero-note">{m.note}</p><Link className="btn btn-outline" to={safeServiceLink(m.ctaUrl, "/traveler/services#services")}>{m.ctaLabel}</Link></div>
    </section>,
    why: (m) => <section className="sp-section sp-why"><div className="sp-container"><SectionHead module={m} centered /><div className="sp-four-grid">{m.items.map((item, i) => <article key={i}>{icons(whyIcons, i)}<h3>{item.title}</h3><p>{item.body}</p></article>)}</div></div></section>,
    services: (m) => <section className="sp-section sp-services" id="services"><div className="sp-container"><SectionHead module={m} /><div className="sp-service-list">{content.services.filter((s) => s.visible).map((service, i) => {
      const shared = home.services.find((item) => item.id === service.id)
      const price = shared?.price || ''
      const note = service.id === 'planning' ? shared?.priceNote : shared?.unit && shared.unitApproved === true ? shared.unit : 'Starting reference · pricing basis confirmed in your written quote'
      return <article key={service.id} id={service.anchor} className="sp-service">
        <ServiceImage image={service.image} className="sp-service-image" />
        <div className="sp-service-copy"><div className="sp-number">{String(i + 1).padStart(2, '0')}<span /></div><h3>{service.title}</h3><p>{service.subtitle}</p><ul className="sp-points">{service.points.map((item) => <li key={item}>{item}</li>)}</ul>
          <details><summary>See what&apos;s included</summary><div className="sp-detail-body"><ul>{service.included.map((item) => <li key={item}>{item}</li>)}</ul><p><strong>Best for:</strong> {service.bestFor}</p></div></details>
          <details><summary>Flexible booking</summary><div className="sp-detail-body"><BookingPolicy service={{...shared, title:service.title}} version={home.bookingPolicyVersion} plain /><p>Refund calculations, date cut-offs and any non-refundable third-party costs are confirmed in your written agreement.</p><Link to="/traveler/booking-terms">Read Booking Terms →</Link></div></details>
        </div><div className="sp-price"><span>From</span><strong>{price.replace(/^From\s+/i, '')}</strong><p>{note}</p><Action label={service.ctaLabel} to={service.ctaUrl} section={service.id} /></div>
      </article>
    })}</div><p className="sp-note sp-price-note">{m.note.replace(/USD (?:99|299|699)\b/g, (amount) => {
      const id = { 'USD 99':'planning', 'USD 299':'road-trip', 'USD 699':'signature' }[amount]
      return (home.services.find((service) => service.id === id)?.price || amount).replace(/^From\s+/i, '')
    })}</p><p className="sp-education" id="educational-cultural-journeys">Planning an educational or cultural group journey? <Link to="/traveler/contact?service=education">Discuss a tailored program →</Link></p></div></section>,
    pricing: (m) => <section className="sp-section sp-pricing"><div className="sp-container"><SectionHead module={m} centered /><ol className="sp-four-grid sp-pricing-steps">{m.items.map((item, i) => <li key={i}><span className="sp-step-icon">{icons(pricingIcons, i)}</span><h3>{item.title}</h3><p>{item.body}</p></li>)}</ol><div className="sp-direct"><div><ShieldCheck aria-hidden="true" /><div><strong>{m.stripTitle}</strong><p>{m.stripBody}</p></div></div><Action label={m.ctaLabel} to={m.ctaUrl} section="pricing" /></div></div></section>,
    vehicles: (m) => <section className="sp-section sp-vehicles"><div className="sp-container"><SectionHead module={m} centered /><div className="sp-four-grid sp-vehicle-points">{m.points.map((point, i) => <div key={point}>{icons(vehicleIcons, i)}<span>{point}</span></div>)}</div><div className="sp-gallery-wrap"><button type="button" className="sp-gallery-arrow is-prev" aria-label="Previous vehicle images" onClick={() => moveGallery(-1)}><ChevronLeft /></button><div ref={gallery} className="sp-gallery" tabIndex={0} role="region" aria-label="Vehicle and journey illustrations" onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); moveGallery(event.key === 'ArrowLeft' ? -1 : 1) } }}>{content.gallery.filter((image) => visibleServiceMedia(image)).map((image, i) => <ServiceImage key={i} image={image} />)}</div><button type="button" className="sp-gallery-arrow is-next" aria-label="Next vehicle images" onClick={() => moveGallery(1)}><ChevronRight /></button></div><p className="sp-note">{m.note}</p>{moduleCta(m)}</div></section>,
    idea: (m) => <section className="sp-section sp-idea"><ServiceImage image={m.image} className="sp-idea-image" /><div className="sp-container"><SectionHead module={m} /><div className="sp-idea-steps">{m.items.map((item, i) => <article key={i}>{icons(pricingIcons, i)}<div><h3>{item.title}</h3><p>{item.body}</p></div></article>)}</div>{moduleCta(m)}</div></section>,
    reviews: (m) => <section className="sp-section sp-reviews"><div className="sp-container"><SectionHead module={m} />{!content.reviews.length && servicesPreview && <p className="sp-sample-notice">{m.note}</p>}<div className="sp-review-grid">{reviews.map((review, i) => <article key={i}>{visibleServiceMedia(review.image) && <button className="sp-review-image" aria-label={`View full ${content.reviews.length ? 'traveler photo' : 'illustration'} ${i + 1}`} onClick={(event) => { opener.current = event.currentTarget; setFullImage(review.image) }}><ServiceImage image={review.image} /></button>}<div>{!content.reviews.length && <strong className="sp-sample-label">AI SAMPLE · NOT A REAL REVIEW</strong>}<blockquote>“{review.text}”</blockquote>{content.reviews.length > 0 && review.displayName && <p>{review.displayName}</p>}</div></article>)}</div>{!reviews.length && <p className="sp-review-empty">{m.emptyText}</p>}</div></section>,
    final: (m) => <section className="sp-section sp-final"><div className="sp-container"><h2>{m.title.split(/(Adventure)/).map((part, i) => <span key={i} className={part === 'Adventure' ? 'text-gold' : ''}>{part}</span>)}</h2><p>{m.body}</p><div><Action label={m.primaryLabel} to={m.primaryUrl} section="services_final" /><Link className="btn btn-outline" to={safeServiceLink(m.secondaryUrl, '/traveler/itineraries')}>{m.secondaryLabel}</Link></div></div></section>,
  }
  return <div className="services-page sp-page">{content.modules.filter((m) => m.visible).map((module) => <div key={module.id} data-service-module={module.id}>{render[module.id]?.(module)}</div>)}
    {servicesPreview && <p className="sp-prototype-note">Service page design preview. Images marked AI are illustrative concepts.</p>}
    <dialog ref={dialog} className="sp-lightbox" aria-label="Full travel image" onCancel={(event) => { event.preventDefault(); setFullImage(null) }} onClick={(event) => { if (event.target === event.currentTarget) setFullImage(null) }}><button type="button" aria-label="Close full image" onClick={() => setFullImage(null)}><X /></button>{fullImage && <img src={fullImage.src} alt={fullImage.alt} />}{fullImage?.aiGenerated && <p>AI illustration · not a customer photograph</p>}</dialog>
  </div>
}
