import { t } from '../i18n/runtime.js'
import { Link } from '../i18n/router.jsx'
import './AiPlanner.css'

const DAYS = [
  {
    day: 1,
    title: 'Arrival & City Exploration',
    items: ['Airport pickup', 'Hotel check-in', 'Local market visit', 'Welcome dinner'],
  },
  {
    day: 2,
    title: 'Culture & Highlands',
    items: ['Morning temple visit', 'Scenic drive', 'Village walk', 'Tea tasting'],
  },
  {
    day: 3,
    title: 'Nature Immersion',
    items: ['Trail hike', 'Lake viewpoint', 'Picnic lunch', 'Sunset photography'],
  },
]

export default function AiPlanner() {
  return (
    <div className="planner">
      <section className="planner-hero section">
        <div className="badge badge-gold">{t("✦ AI-Powered Trip Planning")}</div>
        <h1 className="font-serif">{t("Plan Your ")}<span className="text-gold">{t("Dream Trip")}</span>
        </h1>
        <p>{t("Tell us your preferences and explore a sample itinerary. This demo page shows the flow without live AI generation.")}</p>

        <div className="steps" aria-label={t("Planning steps")}>
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`step ${step < 4 ? 'is-done' : 'is-current'}`}>
              <span>{t(step < 4 ? '✓' : step)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section planner-result">
        <div className="ready-badge">{t("Your itinerary is ready!")}</div>
        <h2 className="font-serif">{t("Sichuan Adventure")}</h2>
        <p className="meta">{t("5 Days · Est. $2,000")}</p>

        <div className="day-list">
          {DAYS.map((day) => (
            <article key={day.day} className="day-card">
              <div className="day-card__num">{t(day.day)}</div>
              <div>
                <h3 className="font-serif">{t(day.title)}</h3>
                <ul>
                  {day.items.map((item) => (
                    <li key={item}>{t(item)}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="planner-actions">
          {/* <Link to="/traveler/guides" className="btn btn-gold">
            Find a Guide
          </Link> */}
          <Link to="/traveler/contact" className="btn btn-ghost">{t("Contact Us")}</Link>
        </div>
      </section>
    </div>
  )
}
