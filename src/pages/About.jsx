import { Link } from 'react-router-dom'
import { ABOUT_INTRO, ABOUT_TEAM, ABOUT_VISION, ABOUT_EXPERTISE, ABOUT_DESTINATIONS, ABOUT_CULTURAL_EXPERIENCES, ABOUT_TRAVEL_STYLES, ABOUT_PARTNERSHIPS, PARTNER_STEPS } from '../data/about.js'
import { SITE } from '../config/site.js'
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
            <p className="eyebrow">{ABOUT_INTRO.eyebrow}</p>
            <h1 className="font-serif">{ABOUT_INTRO.title}</h1>
            <div className="about-prose">
              {ABOUT_INTRO.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </div>
          <div className="about-split__media">
            <SoftImage
              src="/about/intro.jpg"
              alt="A traveler walking through a temple corridor lined with red pillars"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="about-vision section-block">
        <div className="section about-vision__inner">
          <div className="about-split__copy">
            <p className="eyebrow">{ABOUT_VISION.eyebrow}</p>
            <h2 className="font-serif">{ABOUT_VISION.title}</h2>
            <div className="about-prose">
              {ABOUT_VISION.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </div>
          <div className="about-split__media">
            <SoftImage
              src="/about/vision.jpg"
              alt="Winding mountain road through a snowy forest landscape"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="about-expertise section-block" aria-labelledby="expertise-heading">
        <div className="section">
          <p className="eyebrow">Local Expertise</p>
          <h2 id="expertise-heading" className="font-serif">More than a travel itinerary.</h2>
          <div className="about-facts-grid">{ABOUT_EXPERTISE.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div>
        </div>
      </section>

      <section className="about-culture section-block" id="cultural-experiences" aria-labelledby="culture-heading">
        <div className="section">
          <p className="eyebrow">Meaningful Cultural Experiences</p>
          <h2 id="culture-heading" className="font-serif">Beyond Sightseeing</h2>
          <p className="about-section-intro">Meaningful travel connects people with local traditions and everyday life.</p>
          <div className="about-facts-grid about-facts-grid--three about-experience-cards">
            {ABOUT_CULTURAL_EXPERIENCES.map(([title, body], index) => (
              <article key={title}>
                <span className="about-experience-number" aria-hidden="true">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-destinations section-block" aria-labelledby="destinations-heading">
        <div className="section">
          <p className="eyebrow">Destinations &amp; Journeys</p>
          <h2 id="destinations-heading" className="font-serif">Sichuan and Chongqing are our home ground.</h2>
          <div className="about-facts-grid about-facts-grid--three">{ABOUT_DESTINATIONS.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div>
          <div className="about-prose about-regional-note">
            <h3>Beyond Southwest China</h3>
            <p>Our core expertise is Sichuan, Western Sichuan and Chongqing. For other parts of China, we develop sample journeys and coordinate appropriate local resources after checking availability and service requirements.</p>
            <p>Sample journeys include Guizhou &amp; Yunnan (5 days: Guiyang, Huangguoshu, Kunming and Dali) and Southern Xinjiang (9 days: Kashgar, the Pamirs, Hotan and Aksu). These are starting points for a tailored proposal, not confirmed departures.</p>
          </div>
        </div>
      </section>

      <section className="about-flexibility section-block" id="tailored-journeys" aria-labelledby="flexibility-heading">
        <div className="section">
          <p className="eyebrow">Tailor-made Travel</p>
          <h2 id="flexibility-heading" className="font-serif">Flexibility by Design</h2>
          <p className="about-section-intro">One destination, different ways to experience it.</p>
          <div className="about-journey-example">
            <p className="about-journey-example__label">Chengdu · 3 days</p>
            <p>A three-day Chengdu journey can change with the travelers’ interests.</p>
          </div>
          <div className="about-facts-grid about-facts-grid--three about-experience-cards">
            {ABOUT_TRAVEL_STYLES.map(({ title, interests }) => (
              <article key={title}>
                <h3>{title}</h3>
                <ul className="about-interest-list">
                  {interests.map((interest) => <li key={interest}>{interest}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <Link className="btn btn-gold" to="/traveler#inquiry">Plan my journey <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="about-team section-block" id="team">
        <div className="section">
          <div className="about-team__head">
            <p className="eyebrow">Our Team</p>
            <h2 className="font-serif">The people behind the journey.</h2>
          </div>
          <div className="about-team__grid">
            {ABOUT_TEAM.map((member) => (
              <article key={member.name} className="about-member">
                <div className={`about-member__avatar${member.photo ? ' has-photo' : ''}`}>
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} loading="lazy" decoding="async" />
                  ) : (
                    <span aria-hidden>{initials(member.name)}</span>
                  )}
                </div>
                <h3 className="font-serif">{member.name}</h3>
                <p className="about-member__role">{member.role}</p>
                <div className="about-member__bio">
                  {member.bio.map((p) => (
                    <p key={p.slice(0, 40)}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-partnerships section-block" id="partnerships" aria-labelledby="partnerships-heading">
        <div className="section">
          <p className="eyebrow">B2B Partnership</p>
          <h2 id="partnerships-heading" className="font-serif">Flexible cooperation for travel professionals.</h2>
          <div className="about-facts-grid about-facts-grid--three">{ABOUT_PARTNERSHIPS.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div>
          <h3>How we work together</h3>
          <ol className="about-partner-steps">{PARTNER_STEPS.map(([title, body]) => <li key={title}><strong>{title}</strong><span>{body}</span></li>)}</ol>
          <div className="about-facts-grid">
            <article><h3>Overseas partner</h3><p>Share guest requirements, confirm the offer and manage your client relationship.</p></article>
            <article><h3>Lumichan</h3><p>Develop the local plan, confirm agreed arrangements and coordinate delivery in China.</p></article>
          </div>
          <div className="about-entity about-prose">
            <h3>Our registered entity</h3>
            <p lang="zh-CN">{SITE.legalCompanyName}</p>
            <p>Sichuan Fourth Branch of Huanyu Zongheng International Travel Agency (Chongqing) Co., Ltd.</p>
            <p>Contracting entity and operating permissions should be checked against current original registration and branch filing documents for each partnership.</p>
          </div>
          <Link className="btn btn-gold" to="/traveler/contact" state={{ subject: 'B2B partnership inquiry' }}>Discuss a partnership <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="about-cta section">
        <div className="about-cta__inner">
          <h2 className="font-serif">Ready to start a conversation?</h2>
          <p>Tell us what draws you to China — a local planner will help shape the journey.</p>
          <Link to="/traveler/contact" className="btn btn-gold">
            Book A Consultation <span aria-hidden>✦</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
