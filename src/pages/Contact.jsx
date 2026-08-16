import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE, whatsappUrl } from '../config/site.js'
import './Contact.css'

const CONTACT_API = import.meta.env.VITE_CONTACT_API || '/api/contact.php'

const waHref = whatsappUrl()

const INFO = {
  email: 'lijunjie1988927@qq.com',
  phone: SITE.whatsappNumber
    ? `WhatsApp: +${String(SITE.whatsappNumber).replace(/\D/g, '')}`
    : 'WhatsApp: Junjie Li',
  address: '中国 四川省成都市高新区世纪城路298号附14号',
  hours: '24/7 Available',
}

const SOCIALS = [
  { label: 'TikTok', handle: 'lumichan67', url: 'https://www.tiktok.com/@lumichan67' },
  { label: 'Facebook', handle: 'LumichanTravel', url: 'https://facebook.com/LumichanTravel' },
  { label: 'Instagram', handle: 'lumichantravel', url: 'https://instagram.com/lumichantravel' },
  { label: 'WhatsApp', handle: 'Junjie Li', url: waHref || '#' },
  { label: 'WeChat', handle: 'lumichan_travel', url: '#' },
]

export default function Contact() {
  const { state } = useLocation()
  const guideName = state?.guide
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: guideName ? `Guide inquiry: ${guideName}` : '',
    message: guideName
      ? `Hi, I'd like to inquire about booking guide ${guideName}.\n\nDates:\nGroup size:\nNotes:\n`
      : '',
    website: '',
  })

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
            Get in <span className="text-gold">Touch</span>
          </h1>
          <p>Have questions? We&apos;d love to hear from you. Our team is available 24/7.</p>
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
              <a className="contact-info-card" href="#">
                <div className="contact-info-card__icon" aria-hidden>
                  ☎
                </div>
                <div>
                  <div className="contact-info-card__label">Phone / WhatsApp</div>
                  <div className="contact-info-card__value">{INFO.phone}</div>
                </div>
              </a>
              <div className="contact-info-card">
                <div className="contact-info-card__icon" aria-hidden>
                  ⌖
                </div>
                <div>
                  <div className="contact-info-card__label">Office</div>
                  <div className="contact-info-card__value">{INFO.address}</div>
                </div>
              </div>
            </div>

            <h3 className="font-serif contact-aside__sub">Follow Us</h3>
            <div className="contact-socials">
              {SOCIALS.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target={item.url.startsWith('http') ? '_blank' : undefined}
                  rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="contact-social"
                >
                  <div className="contact-social__label">{item.label}</div>
                  <div className="contact-social__handle">{item.handle}</div>
                </a>
              ))}
            </div>

            <div className="contact-hours">
              <h3 className="font-serif">Office Hours</h3>
              <div className="contact-hours__row">
                <span>Monday - Sunday</span>
                <strong>{INFO.hours}</strong>
              </div>
              <p>* We are available around the clock — reach out any time.</p>
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
