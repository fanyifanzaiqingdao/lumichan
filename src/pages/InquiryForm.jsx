import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const INTERESTS = ['Flexibility', 'Comfort', 'Culture', 'Nature', 'Budget clarity', 'Easy planning']
const CONTACTS = ['Email', 'Ins', 'WeChat']

function ErrorText({ message, field }) {
  return message ? <span className="inquiry-error" id={`error-${field}`}>{message}</span> : null
}

export default function InquiryForm({ services, track, config }) {
  const formRef = useRef(null)
  const preferencesRef = useRef(null)
  const requestId = useRef(null)
  const started = useRef(false)
  const [contact, setContact] = useState('Email')
  const [service, setService] = useState('')
  const [children, setChildren] = useState(false)
  const [status, setStatus] = useState('idle')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const location = useLocation()
  useEffect(() => {
    const selected = services.find((item) => item.id === new URLSearchParams(location.search).get('service'))
    if (!selected) return
    setService(selected.title)
    preferencesRef.current.open = true
    formRef.current.elements.name.focus({ preventScroll: true })
  }, [location.key, location.search, services])

  function markStarted(event) {
    const field = event.target.name
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      if (field === 'preferred_service') delete next.travelers
      if (field === 'preferred_contact') delete next.contact_handle
      return next
    })
    if (!started.current) {
      started.current = true
      track('form_start', { source_section: 'homepage' })
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (status === 'sending') return
    const form = formRef.current
    const values = new FormData(form)
    const nextErrors = {}
    const name = String(values.get('name') || '').trim()
    const email = String(values.get('email') || '').trim()
    const travelers = Number(values.get('travelers'))
    const dates = String(values.get('travel_dates') || '').trim()
    const handle = String(values.get('contact_handle') || '').trim()
    if (name.length < 2 || name.length > 100) nextErrors.name = 'Enter a name between 2 and 100 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address.'
    if (contact !== 'Email' && !handle) nextErrors.contact_handle = `Enter your ${contact} account.`
    if (!Number.isInteger(travelers) || travelers < 1) nextErrors.travelers = 'Enter at least one traveler.'
    if (!dates) nextErrors.travel_dates = 'Enter dates or an approximate month.'
    if (!values.has('privacy_consent')) nextErrors.privacy_consent = 'Please agree to the Privacy Policy.'
    if (service === 'Educational & Cultural Journeys' && travelers > 0 && travelers < 6) nextErrors.travelers = 'Educational journeys require at least six travelers.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const firstInvalid = form.elements[Object.keys(nextErrors)[0]]
      if (preferencesRef.current?.contains(firstInvalid)) preferencesRef.current.open = true
      firstInvalid?.focus()
      return
    }

    if (!requestId.current) requestId.current = crypto.randomUUID()
    const params = new URLSearchParams(window.location.search)
    const payload = {
      request_id: requestId.current,
      name,
      email,
      preferred_contact: contact,
      contact_handle: contact === 'Email' ? '' : handle,
      country: String(values.get('country') || '').trim(),
      travelers,
      travel_dates: dates,
      destinations: String(values.get('destinations') || '').trim(),
      preferred_service: service || 'Not sure yet',
      traveling_with_children: children,
      child_age_band: children ? String(values.get('child_age_band') || '') : '',
      english_guide: String(values.get('english_guide') || 'Not sure'),
      interests: values.getAll('interests'),
      message: String(values.get('message') || '').trim(),
      privacy_consent: true,
      consent_version: config.consentVersion,
      source_page: '/traveler',
      utm: Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].filter((key) => params.has(key)).map((key) => [key, params.get(key)])),
      language: 'en',
      website: String(values.get('website') || ''),
    }
    setStatus('sending')
    setServerError('')
    try {
      const response = await fetch('/api/inquiry.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.ok) throw new Error(result.error || 'server_error')
      setStatus('success')
      track('form_submit', { inquiry_id: result.inquiry_id, service_type: payload.preferred_service })
      requestId.current = null
      form.reset()
      setContact('Email')
      setService('')
      setChildren(false)
      preferencesRef.current.open = false
      started.current = false
    } catch (error) {
      setStatus('error')
      setServerError(config.errorMessage)
      track('form_error', { error_code: error.message === 'Failed to fetch' ? 'network' : 'server' })
    }
  }

  return (
    <form className="inquiry-form" ref={formRef} onSubmit={submit} onChange={markStarted} noValidate>
      {status === 'success' && <div className="inquiry-success" role="status"><h3>{config.successTitle}</h3><p>{config.successBody}</p></div>}
      <label>Full name *<input name="name" autoComplete="name" maxLength={100} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'error-name' : undefined} /><ErrorText field="name" message={errors.name} /></label>
      <label>Email *<input name="email" type="email" autoComplete="email" maxLength={200} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'error-email' : undefined} /><ErrorText field="email" message={errors.email} /></label>
      <label>Number of travelers *<input name="travelers" type="number" min="1" step="1" inputMode="numeric" aria-invalid={!!errors.travelers} aria-describedby={errors.travelers ? 'error-travelers' : undefined} /><ErrorText field="travelers" message={errors.travelers} /></label>
      <label>Travel dates or month *<input name="travel_dates" placeholder="Exact dates or approximate month" maxLength={100} aria-invalid={!!errors.travel_dates} aria-describedby={errors.travel_dates ? 'error-travel_dates' : undefined} /><ErrorText field="travel_dates" message={errors.travel_dates} /></label>
      <details className="inquiry-preferences inquiry-form__wide" ref={preferencesRef}>
        <summary>More travel preferences <span>(optional)</span></summary>
        <div className="inquiry-preferences__fields">
      <label>Preferred contact<select name="preferred_contact" value={contact} onChange={(event) => setContact(event.target.value)}>{CONTACTS.map((option) => <option key={option}>{option}</option>)}</select></label>
      {contact !== 'Email' && <label>{contact} account *<input name="contact_handle" autoComplete="off" maxLength={80} aria-invalid={!!errors.contact_handle} aria-describedby={errors.contact_handle ? 'error-contact_handle' : undefined} /><ErrorText field="contact_handle" message={errors.contact_handle} /></label>}
      <label>Country / region<input name="country" autoComplete="country-name" maxLength={100} /></label>
      <label>Destinations<input name="destinations" placeholder="Not sure yet" maxLength={200} /></label>
      <label>Preferred service<select name="preferred_service" value={service} onChange={(event) => setService(event.target.value)}><option value="">Not sure yet</option>{services.map((item) => <option key={item.id}>{item.title}</option>)}</select></label>
      <label>Traveling with children<select name="traveling_with_children" value={children ? 'yes' : 'no'} onChange={(event) => setChildren(event.target.value === 'yes')}><option value="no">No</option><option value="yes">Yes</option></select></label>
      {children && <label>Children's age range (optional)<select name="child_age_band"><option value="">Prefer not to say</option><option>0-5</option><option>6-12</option><option>13-17</option></select></label>}
      <label>English-speaking guide<select name="english_guide"><option>Not sure</option><option>Yes</option><option>No</option></select></label>
      <fieldset className="inquiry-form__wide"><legend>What matters most</legend><div className="inquiry-interests">{INTERESTS.map((interest) => <label key={interest}><input type="checkbox" name="interests" value={interest} />{interest}</label>)}</div></fieldset>
      <label className="inquiry-form__wide">What would you love to experience in China?<textarea name="message" rows={5} maxLength={1000} /></label>
        </div>
      </details>
      <label className="inquiry-form__consent inquiry-form__wide"><input type="checkbox" name="privacy_consent" aria-invalid={!!errors.privacy_consent} aria-describedby={errors.privacy_consent ? 'error-privacy_consent' : undefined} /><span>I agree that Lumichan may use my information to respond to this inquiry. Read the <Link to="/traveler/privacy">Privacy Policy</Link>.<ErrorText field="privacy_consent" message={errors.privacy_consent} /></span></label>
      <input className="inquiry-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {serverError && <p className="inquiry-server-error inquiry-form__wide" role="alert">{serverError}</p>}
      <button type="submit" className="btn btn-gold inquiry-form__submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending...' : config.submitLabel}</button>
      <p className="inquiry-form__note inquiry-form__wide">Enquiry only · No payment required to submit</p>
    </form>
  )
}
