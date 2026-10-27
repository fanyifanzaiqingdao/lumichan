import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE, whatsappUrl } from '../config/site.js'
import defaultHomepage from '../data/homepage.js'
import { canonicalServiceId } from '../lib/servicesPage.js'
import './Contact.css'

const CONTACT_API = import.meta.env.VITE_CONTACT_API || '/api/contact.php'

const waHref = whatsappUrl()

const INFO = {
  email: SITE.contactEmail,
  phone: SITE.phoneDisplay || (SITE.whatsappNumber
    ? `+${String(SITE.whatsappNumber).replace(/\D/g, '')}`
    : ''),
  address: SITE.address,
}

const SOCIALS = [
  { label: 'TikTok', handle: 'lumichan67', url: 'https://www.tiktok.com/@lumichan67' },
  { label: 'Facebook', handle: 'LumichanTravel', url: 'https://www.facebook.com/profile.php?id=61585245772437' },
  { label: 'Instagram', handle: 'lumichan_travel', url: 'https://instagram.com/lumichan_travel' },
  ...(waHref ? [{ label: 'WhatsApp', handle: INFO.phone, url: waHref }] : []),
  { label: 'WeChat', handle: SITE.wechatHandle },
]

export default function Contact() {
  const { state, search } = useLocation()
  const requested = canonicalServiceId(new URLSearchParams(search).get('service') || '')
  const requestedService = defaultHomepage.services.find((item) => item.id === requested)
  const guideName = state?.guide
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferred_service: requestedService?.id || '',
    subject: guideName ? `Guide inquiry: ${guideName}` : state?.subject || (requestedService ? `Service inquiry: ${requestedService.title}` : ''),
    message: guideName
      ? `Hi, I'd like to inquire about booking guide ${guideName}.\n\nDates:\nGroup size:\nNotes:\n`
      : '',
    website: '',
  })

  useEffect(() => {
    setForm((previous) => ({ ...previous, preferred_service: requestedService?.id || '', subject: state?.subject || (guideName ? `Guide inquiry: ${guideName}` : requestedService ? `Service inquiry: ${requestedService.title}` : previous.subject) }))
  }, [requestedService?.id, state?.subject, guideName])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch(CONTACT_API, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json.ok) {
        throw new Error(json.error || '发送失败，请稍后重试。')
      }

      setForm({
        name: '',
        email: '',
        phone: '',
        preferred_service: '',
        subject: '',
        message: '',
        website: '',
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || '发送失败，请稍后重试。')
    }
  }

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="section">
          <h1 className="font-serif">
            Book A <span className="text-gold">Consultation</span>
          </h1>
          <p>Tell us about your trip — we&apos;ll help you plan a private journey that fits your pace.</p>
        </div>
      </section>

      <section className="contact-body section">
        <div className="contact-layout">
          <aside className="contact-aside">
            <h2 className="font-serif">Contact Information</h2>
            <div className="contact-info-list">
              <a className="contact-info-card" href={`mailto:${INFO.email}`}>
                <div className="contact-info-card__icon" aria-hidden>
                  ✉
                </div>
                <div>
                  <div className="contact-info-card__label">Email</div>
                  <div className="contact-info-card__value">{INFO.email}</div>
                </div>
              </a>
              <a
                className="contact-info-card"
                href={waHref || `tel:${String(SITE.phoneDisplay || '').replace(/\s/g, '')}`}
              >
                <div className="contact-info-card__icon" aria-hidden>
                  ☎
                </div>
                <div>
                  <div className="contact-info-card__label">{waHref ? 'Phone / WhatsApp' : 'Phone'}</div>
                  <div className="contact-info-card__value">{INFO.phone}</div>
                </div>
              </a>
              {INFO.address ? (
                <div className="contact-info-card">
                  <div className="contact-info-card__icon" aria-hidden>
                    ⌖
                  </div>
                  <div>
                    <div className="contact-info-card__label">Office</div>
                    <div className="contact-info-card__value">{INFO.address}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <h3 className="font-serif contact-aside__sub">Follow Us</h3>
            <div className="contact-socials">
              {SOCIALS.map((item) => {
                const SocialItem = item.url ? 'a' : 'div'
                return <SocialItem
                  key={item.label}
                  href={item.url}
                  target={item.url?.startsWith('http') ? '_blank' : undefined}
                  rel={item.url?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="contact-social"
                >
                  <div className="contact-social__label">{item.label}</div>
                  <div className="contact-social__handle">{item.handle}</div>
                </SocialItem>
              })}
            </div>
          </aside>

          <div className="contact-form-panel">
            {status === 'success' ? (
              <div className="contact-success" role="status">
                <h2 className="font-serif">Message Sent</h2>
                <p>Thanks! Your message has been sent. We will get back to you soon.</p>
                <button type="button" className="btn btn-gold" onClick={() => setStatus('idle')}>
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form-rich" onSubmit={handleSubmit}>
                <h2 className="font-serif">Send us a Message</h2>

                <div className="contact-form-rich__row">
                  <label>
                    Name *
                    <input
                      name="name"
                      required
                      placeholder="Your name"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                    />
                  </label>
                  <label>
                    Email *
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="your@email.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                    />
                  </label>
                </div>

                <label>
                  Phone (Optional)
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+1 234 567 890"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                  />
                </label>

                <label>
                  Preferred service (Optional)
                  <select name="preferred_service" value={form.preferred_service} onChange={(event) => {
                    const id = event.target.value
                    const selected = defaultHomepage.services.find((item) => item.id === id)
                    setForm((previous) => ({ ...previous, preferred_service: id, subject: !previous.subject || previous.subject.startsWith('Service inquiry:') ? (selected ? `Service inquiry: ${selected.title}` : '') : previous.subject }))
                  }}>
                    <option value="">Not sure yet</option>
                    {defaultHomepage.services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
                  </select>
                </label>

                <label>
                  Subject *
                  <input
                    name="subject"
                    required
                    placeholder="How can we help?"
                    value={form.subject}
                    onChange={(e) => update('subject', e.target.value)}
                  />
                </label>

                <label>
                  Message *
                  <textarea
                    name="message"
                    rows={5}
                    required
                    placeholder="Tell us about your travel plans or questions..."
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                  />
                </label>

                <label className="hp-field" aria-hidden="true">
                  Website
                  <input
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => update('website', e.target.value)}
                  />
                </label>

                {status === 'error' && (
                  <p className="contact-form-error" role="alert">
                    {errorMsg}
                  </p>
                )}

                <button type="submit" className="btn btn-gold contact-form-rich__submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
