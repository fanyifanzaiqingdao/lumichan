import { t } from '../i18n/runtime.js'
import { Link } from '../i18n/router.jsx'
import { ABOUT_INTRO, ABOUT_TEAM, ABOUT_VISION, ABOUT_EXPERTISE } from '../data/about.js'
import SoftImage from '../components/SoftImage.jsx'
import './About.css'

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="section about-hero__inner">
          <div className="about-split__copy">
            <p className="eyebrow">{t(ABOUT_INTRO.eyebrow)}</p>
            <h1 className="font-serif">{t(ABOUT_INTRO.title)}</h1>
            <div className="about-prose">
              {ABOUT_INTRO.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{t(p)}</p>
              ))}
            </div>
          </div>
          <div className="about-split__media">
            <SoftImage
              src="/about/intro.jpg"
              alt={t("A traveler walking through a temple corridor lined with red pillars")}
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="about-vision section-block">
        <div className="section about-vision__inner">
          <div className="about-split__copy">
            <p className="eyebrow">{t(ABOUT_VISION.eyebrow)}</p>
            <h2 className="font-serif">{t(ABOUT_VISION.title)}</h2>
            <div className="about-prose">
              {ABOUT_VISION.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{t(p)}</p>
              ))}
            </div>
          </div>
          <div className="about-split__media">
            <SoftImage
              src="/about/vision.jpg"
              alt={t("Winding mountain road through a snowy forest landscape")}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="about-expertise section-block" aria-labelledby="expertise-heading">
        <div className="section">
          <p className="eyebrow">{t("Local Expertise")}</p>
          <h2 id="expertise-heading" className="font-serif">{t("More than a travel itinerary.")}</h2>
          <div className="about-facts-grid">{ABOUT_EXPERTISE.map(([title, body]) => <article key={title}><h3>{t(title)}</h3><p>{t(body)}</p></article>)}</div>
        </div>
      </section>

      <section className="about-team section-block" id="team">
        <div className="section">
          <div className="about-team__head">
            <p className="eyebrow">{t("Our Team")}</p>
            <h2 className="font-serif">{t("The people behind the journey.")}</h2>
          </div>
          <div className="about-team__grid">
            {ABOUT_TEAM.map((member) => (
              <article key={member.name} className="about-member">
                <div className={`about-member__avatar${member.photo ? ' has-photo' : ''}`}>
                  {member.photo ? (
                    <img src={member.photo} alt={t(member.name)} loading="lazy" decoding="async" />
                  ) : (
                    <span aria-hidden>{t(initials(member.name))}</span>
                  )}
                </div>
                <h3 className="font-serif">{t(member.name)}</h3>
                <p className="about-member__role">{t(member.role)}</p>
                <div className="about-member__bio">
                  {member.bio.map((p) => (
                    <p key={p.slice(0, 40)}>{t(p)}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta section">
        <div className="about-cta__inner">
          <h2 className="font-serif">{t("Ready to start a conversation?")}</h2>
          <p>{t("Tell us what draws you to China — a local planner will help shape the journey.")}</p>
          <Link to="/traveler/contact" className="btn btn-gold">{t("Book A Consultation ")}<span aria-hidden>✦</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
