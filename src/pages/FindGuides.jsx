import { t } from '../i18n/runtime.js'
import { useEffect, useMemo, useState } from 'react'
import { Link } from '../i18n/router.jsx'
import { GUIDES as FALLBACK_GUIDES, GUIDE_FILTERS } from '../data/guides.js'
import './FindGuides.css'

const PAGE_SIZE = 6
const GUIDES_API = '/api/guides.php'

function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'G'
  )
}

export default function FindGuides() {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(GUIDES_API, { headers: { Accept: 'application/json' } })
        const json = await res.json().catch(() => ({}))
        if (!cancelled && res.ok && json.ok && Array.isArray(json.guides)) {
          setGuides(json.guides)
          return
        }
      } catch {
        /* fall through */
      }
      if (!cancelled) setGuides(FALLBACK_GUIDES)
    })().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return guides.filter((guide) => {
      const matchText =
        !q ||
        (guide.full_name || '').toLowerCase().includes(q) ||
        (guide.location || '').toLowerCase().includes(q)
      const matchFilter =
        filter === 'All' ||
        (guide.specialties || []).some((item) => item.toLowerCase().includes(filter.toLowerCase()))
      return matchText && matchFilter
    })
  }, [guides, query, filter])

  const shown = filtered.slice(0, visible)
  const hasMore = filtered.length > visible

  return (
    <div className="guides-page">
      <section className="guides-hero">
        <div className="section">
          <h1 className="font-serif">{t("Find Your ")}<span className="text-gold">{t("Local Guide")}</span>
          </h1>
          <p>{t("Connect with verified local guides and drivers who know every hidden gem")}</p>

          <div className="guides-search">
            <div className="guides-search__field">
              <span className="guides-search__icon" aria-hidden>
                ⌕
              </span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setVisible(PAGE_SIZE)
                }}
                placeholder={t("Search by name or location...")}
                aria-label={t("Search guides")}
              />
            </div>
            <button
              type="button"
              className={`btn btn-outline guides-search__filters${filtersOpen ? ' is-active' : ''}`}
              onClick={() => setFiltersOpen((v) => !v)}
            >{t("Filters")}</button>
          </div>

          {filtersOpen && (
            <div className="guides-chips">
              {GUIDE_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={filter === item ? 'is-active' : ''}
                  onClick={() => {
                    setFilter(item)
                    setVisible(PAGE_SIZE)
                  }}
                >
                  {t(item)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="guides-results">
        <div className="section">
          <p className="guides-count">
            {t(loading
              ? 'Loading guides…'
              : `Showing ${shown.length} of ${filtered.length} guides`)}
          </p>

          {!loading && filtered.length === 0 ? (
            <p className="guides-empty">{t("No guides found matching your criteria")}</p>
          ) : (
            <div className="guides-grid">
              {shown.map((guide) => (
                <article key={guide.id} className="guide-card">
                  <div className="guide-card__avatar-wrap">
                    {guide.photo_url ? (
                      <img
                        src={guide.photo_url}
                        alt={t(guide.full_name)}
                        className="guide-card__avatar"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="guide-card__avatar guide-card__avatar--fallback">
                        {t(initials(guide.full_name))}
                      </div>
                    )}
                    <span className="guide-card__verified" title={t("Verified")}>
                      ✓
                    </span>
                  </div>

                  <div className="guide-card__body">
                    <div className="guide-card__top">
                      <div>
                        <h3 className="font-serif">{t(guide.full_name)}</h3>
                        <p className="guide-card__location">📍 {t(guide.location)}</p>
                      </div>
                      {guide.price_per_day != null && (
                        <div className="guide-card__price">
                          ${t(guide.price_per_day)}
                          <span>{t("/day")}</span>
                        </div>
                      )}
                    </div>

                    <div className="guide-card__meta">
                      <span>
                        ★ {t(Number(guide.rating || 0).toFixed(1))} ({t(guide.reviews_count || 0)}{t(" reviews)")}</span>
                      {guide.experience && <span>{t(guide.experience)}{t(" exp.")}</span>}
                    </div>

                    {guide.languages?.length > 0 && (
                      <p className="guide-card__langs">🗣 {t(guide.languages.join(', '))}</p>
                    )}

                    {guide.has_vehicle && guide.vehicle_type && (
                      <p className="guide-card__vehicle">🚗 {t(guide.vehicle_type)}</p>
                    )}

                    {guide.bio && <p className="guide-card__bio">{t(guide.bio)}</p>}

                    <div className="guide-card__tags">
                      {(guide.specialties || []).map((tag) => (
                        <span key={tag}>{t(tag)}</span>
                      ))}
                    </div>

                    <Link
                      to="/traveler/contact"
                      className="btn btn-gold guide-card__cta"
                      state={{ guide: guide.full_name }}
                    >{t("Contact Guide")}</Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="guides-more">
              <button type="button" className="btn btn-outline" onClick={() => setVisible((n) => n + PAGE_SIZE)}>{t("Load More Guides")}</button>
            </div>
          )}

          <div className="guides-become">
            <p>{t("Want to offer tours yourself?")}</p>
            <Link to="/guide" className="btn btn-outline">{t("Become a Guide")}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
