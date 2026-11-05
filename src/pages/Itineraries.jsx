import { t } from '../i18n/runtime.js'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from '../i18n/router.jsx'
import { PRODUCTS } from '../data/products.js'
import PaymentPanel from '../components/PaymentPanel.jsx'
import SoftImage from '../components/SoftImage.jsx'
import './Itineraries.css'

function MetaIcon({ type }) {
  if (type === 'star') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M12 3.6l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18.5l.9-5.4L4.2 9.3l5.4-.8L12 3.6z"
        />
      </svg>
    )
  }
  if (type === 'clock') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </svg>
    )
  }
  if (type === 'mountain') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 19h18L14.5 7.5 11 13 8.5 9.5 3 19z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9.5" r="2.2" />
      <path d="M3.5 19c1-3 3-4.5 5.5-4.5S14 16 15 19" />
      <path d="M14 15c1.4-.6 2.8-.4 4.2.5 1 .7 1.8 1.8 2.3 3.5" />
    </svg>
  )
}

function DayBlock({ day }) {
  const activities = day.activities || []
  return (
    <article className="itin-day">
      <div className="itin-day__badge">{t(`Day ${day.day}`)}</div>
      <h4 className="font-serif">{t(day.title)}</h4>
      {(day.summary || day.description) && <p>{t(day.summary || day.description)}</p>}
      {activities.length > 0 && (
        <ul>
          {activities.map((act, idx) =>
            typeof act === 'string' ? (
              <li key={idx}>{t(act)}</li>
            ) : (
              <li key={idx}>
                {act.time ? <strong>{t(act.time)}: </strong> : null}
                {t(act.title)}
                {t(act.description ? ` — ${act.description}` : '')}
              </li>
            ),
          )}
        </ul>
      )}
    </article>
  )
}

export default function Itineraries() {
  const [selected, setSelected] = useState(null)
  const [products, setProducts] = useState(PRODUCTS)
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const paidBanner = searchParams.get('paid')
  const paidProvider = searchParams.get('provider')

  useEffect(() => {
    if (paidBanner == null) return
    const sessionId = searchParams.get('session_id')
    if (paidBanner === '1' && paidProvider === 'stripe' && sessionId) {
      fetch('/api/stripe-confirm.php', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(() => {})
    }
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      next.delete('paid')
      next.delete('provider')
      next.delete('session_id')
      setSearchParams(next, { replace: true })
    }, 8000)
    return () => clearTimeout(t)
  }, [paidBanner, paidProvider, searchParams, setSearchParams])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/products.php', { headers: { Accept: 'application/json' } })
        const json = await res.json().catch(() => ({}))
        if (!cancelled && res.ok && Array.isArray(json.products) && json.products.length > 0) {
          setProducts(json.products)
        }
      } catch {
        // keep static fallback
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selected) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setSelected(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [selected])

  return (
    <div className="itin-page">
      <section className="itin-hero">
        <div className="section">
          <div className="eyebrow">{t("Private Journeys")}</div>
          <h1 className="font-serif">{t("Travel through what you do, ")}<span className="text-gold">{t("not what you see")}</span>.
          </h1>
          <p>{t("We design private journeys that connect travelers with China's people, landscapes, and living cultures.")}</p>
        </div>
      </section>

      <section className="itin-grid-wrap">
        <div className="section itin-grid">
          {paidBanner === '1' && (
            <p className="itin-pay-banner is-ok">
              {t(paidProvider === 'stripe' ? 'Stripe' : 'Payment')}{t(" received — we will contact you shortly.")}</p>
          )}
          {paidBanner === '0' && (
            <p className="itin-pay-banner">{t("Checkout was cancelled. You can try again anytime.")}</p>
          )}
          {loading && products.length === 0 && <p className="itin-loading">{t("Loading itineraries…")}</p>}
          {!loading && products.length === 0 && (
            <p className="itin-loading">{t("No published itineraries yet.")}</p>
          )}
          {products.map((item) => (
            <article key={item.id} className="itin-card">
              <div className="itin-card__media">
                <SoftImage src={item.image} alt={t(item.title)} loading="lazy" />
                <div className="itin-card__price">{t(item.price)}</div>
              </div>
              <div className="itin-card__body">
                <div className="itin-card__meta">
                  {item.rating != null && (
                    <span>
                      <MetaIcon type="star" />
                      {t(item.rating)}
                    </span>
                  )}
                  {item.duration && (
                    <span>
                      <MetaIcon type="clock" />
                      {t(item.duration)}
                    </span>
                  )}
                  {item.max_altitude && (
                    <span>
                      <MetaIcon type="mountain" />
                      {t(item.max_altitude)}
                    </span>
                  )}
                  {item.group_size && (
                    <span>
                      <MetaIcon type="people" />
                      {t(item.group_size)}
                    </span>
                  )}
                </div>
                <h3 className="font-serif">{t(item.title)}</h3>
                {item.subtitle && <p className="itin-card__subtitle">{t(item.subtitle)}</p>}
                <p className="itin-card__desc">{t(item.description)}</p>
                {item.highlights?.length > 0 && (
                  <div className="itin-card__tags">
                    {item.highlights.slice(0, 3).map((tag) => (
                      <span key={tag}>{t(tag)}</span>
                    ))}
                  </div>
                )}
                <button type="button" className="btn btn-gold itin-card__btn" onClick={() => setSelected(item)}>{t("View Full Itinerary →")}</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="itin-cta">
        <div className="section">
          <h2 className="font-serif">{t("Ready to Start Your ")}<span className="text-gold">{t("Adventure")}</span>?
          </h2>
          <p>{t("Tell us what you want to experience — we'll design a private journey around you.")}</p>
          <div className="itin-cta__actions">
            <Link to="/traveler/contact" className="btn btn-gold">{t("Book A Consultation ")}<span aria-hidden>✦</span>
            </Link>
            <Link to="/traveler/itineraries" className="btn btn-outline">{t("Browse Itineraries")}</Link>
          </div>
        </div>
      </section>

      {selected && (
        <div className="itin-modal" role="dialog" aria-modal="true" aria-label={t(selected.title)}>
          <button type="button" className="itin-modal__backdrop" aria-label={t("Close")} onClick={() => setSelected(null)} />
          <div className="itin-modal__panel">
            <button type="button" className="itin-modal__close" onClick={() => setSelected(null)}>
              ×
            </button>
            <div className="itin-modal__hero">
              <SoftImage src={selected.image} alt={t("")} loading="eager" />
              <div className="itin-modal__hero-text">
                <div className="itin-modal__price">{t(selected.price)}</div>
                <h2 className="font-serif">{t(selected.title)}</h2>
                {selected.subtitle && <p>{t(selected.subtitle)}</p>}
              </div>
            </div>
            <div className="itin-modal__content">
              <div className="itin-card__meta itin-modal__meta">
                {selected.rating != null && (
                  <span>
                    <MetaIcon type="star" />
                    {t(selected.rating)}
                    {t(selected.review_count ? ` (${selected.review_count})` : '')}
                  </span>
                )}
                {selected.duration && (
                  <span>
                    <MetaIcon type="clock" />
                    {t(selected.duration)}
                  </span>
                )}
                {selected.max_altitude && (
                  <span>
                    <MetaIcon type="mountain" />
                    {t(selected.max_altitude)}
                  </span>
                )}
                {selected.group_size && (
                  <span>
                    <MetaIcon type="people" />
                    {t(selected.group_size)}
                  </span>
                )}
              </div>

              <p className="itin-modal__lead">{t(selected.long_description || selected.description)}</p>

              {selected.highlights?.length > 0 && (
                <div className="itin-modal__block">
                  <h3 className="font-serif">{t("Highlights")}</h3>
                  <div className="itin-card__tags">
                    {selected.highlights.map((tag) => (
                      <span key={tag}>{t(tag)}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.itinerary?.length > 0 ? (
                <div className="itin-modal__block">
                  <h3 className="font-serif">{t("Day by Day")}</h3>
                  <div className="itin-days">
                    {selected.itinerary.map((day) => (
                      <DayBlock key={day.day} day={day} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="itin-modal__block">
                  <h3 className="font-serif">{t("Day by Day")}</h3>
                  <p className="itin-modal__empty">{t("Detailed day plan for this package is being finalized. Contact us or try the planner for a sample Sichuan adventure.")}</p>
                </div>
              )}

              {(selected.inclusions?.length > 0 || selected.exclusions?.length > 0) && (
                <div className="itin-modal__cols">
                  {selected.inclusions?.length > 0 && (
                    <div>
                      <h3 className="font-serif">{t("Included")}</h3>
                      <ul>
                        {selected.inclusions.map((x) => (
                          <li key={x}>{t(x)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selected.exclusions?.length > 0 && (
                    <div>
                      <h3 className="font-serif">{t("Not Included")}</h3>
                      <ul>
                        {selected.exclusions.map((x) => (
                          <li key={x}>{t(x)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="itin-modal__actions">
                <Link to="/traveler/contact" className="btn btn-gold" onClick={() => setSelected(null)}>{t("Inquire About This Trip")}</Link>
              </div>

              <PaymentPanel product={selected} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
