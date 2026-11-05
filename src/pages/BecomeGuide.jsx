import { apiErrorMessage } from '../i18n/errors.js'
import { t } from '../i18n/runtime.js'
import { useMemo, useState } from 'react'
import { Link } from '../i18n/router.jsx'
import './BecomeGuide.css'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'

const LANGUAGES = [
  'English',
  'Mandarin',
  'Japanese',
  'Korean',
  'French',
  'German',
  'Spanish',
  'Tibetan',
  'Russian',
]

const SPECIALTIES = [
  'City Tours',
  'Mountain Trekking',
  'Cultural Immersion',
  'Photography Tours',
  'Adventure',
  'Food & Culinary',
  'Family Friendly',
  'Luxury Travel',
  'Budget Travel',
]

const STEPS = [
  { num: 1, label: 'Personal Info' },
  { num: 2, label: 'Vehicle Info' },
  { num: 3, label: 'Profile' },
]

const INITIAL = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  photo: null,
  idDocument: null,
  hasVehicle: true,
  vehicleType: '',
  vehiclePlate: '',
  vehiclePhoto: null,
  insuranceDocument: null,
  languages: [],
  specialties: [],
  experience: '',
  bio: '',
  introVideo: null,
}

const APPLY_API = import.meta.env.VITE_GUIDE_APPLY_API || '/api/guide-apply.php'

function UploadField({ label, description, accept, file, onChange, icon }) {
  const id = useMemo(() => `upload-${label.replace(/\s+/g, '-').toLowerCase()}`, [label])

  return (
    <div className="bg-upload">
      <div className="bg-upload__label">{t(label)}</div>
      <label htmlFor={id} className={`bg-upload__box${file ? ' has-file' : ''}`}>
        <span className="bg-upload__icon" aria-hidden>
          {t(icon)}
        </span>
        <span className="bg-upload__title">{t(file ? file.name : 'Click to upload')}</span>
        <span className="bg-upload__desc">{t(description)}</span>
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  )
}

export default function BecomeGuide() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }))
    setError('')
  }

  function toggleList(key, value) {
    setForm((prev) => {
      const list = prev[key]
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      }
    })
    setError('')
  }

  function validateStep(current) {
    if (current === 1) {
      if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.location.trim()) {
        return 'Please fill in all required personal fields.'
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        return 'Please enter a valid email.'
      }
    }
    if (current === 2 && form.hasVehicle) {
      if (!form.vehicleType.trim() || !form.vehiclePlate.trim()) {
        return 'Please fill in vehicle type and license plate.'
      }
    }
    if (current === 3) {
      if (form.languages.length === 0 || form.specialties.length === 0 || !form.bio.trim()) {
        return 'Please select languages, specialties, and write about yourself.'
      }
    }
    return ''
  }

  function goNext() {
    const msg = validateStep(step)
    if (msg) {
      setError(msg)
      return
    }
    setStep((s) => Math.min(4, s + 1))
  }

  async function submit() {
    const msg = validateStep(3)
    if (msg) {
      setError(msg)
      return
    }

    setSubmitting(true)
    setError('')

    const payload = new FormData()
    payload.append('fullName', form.fullName.trim())
    payload.append('email', form.email.trim())
    payload.append('phone', form.phone.trim())
    payload.append('location', form.location.trim())
    payload.append('hasVehicle', form.hasVehicle ? '1' : '0')
    payload.append('vehicleType', form.vehicleType.trim())
    payload.append('vehiclePlate', form.vehiclePlate.trim())
    payload.append('languages', JSON.stringify(form.languages))
    payload.append('specialties', JSON.stringify(form.specialties))
    payload.append('experience', form.experience.trim())
    payload.append('bio', form.bio.trim())
    if (form.photo) payload.append('photo', form.photo)
    if (form.idDocument) payload.append('idDocument', form.idDocument)
    if (form.vehiclePhoto) payload.append('vehiclePhoto', form.vehiclePhoto)
    if (form.insuranceDocument) payload.append('insuranceDocument', form.insuranceDocument)
    if (form.introVideo) payload.append('introVideo', form.introVideo)

    try {
      const res = await fetch(APPLY_API, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: payload,
      })
      const json = await res.json().catch(() => ({}))

      // Local preview without PHP: still show success after client validation
      if (!res.ok || !json.ok) {
        if (import.meta.env.DEV) {
          console.warn('Guide apply API unavailable, finishing as local demo success.', json)
          setStep(4)
          return
        }
        throw new Error(apiErrorMessage(json.error,res.status))
      }
      setStep(4)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(err)
        setStep(4)
      } else {
        setError(err.message || 'Submit failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-page">
      <header className="bg-topbar">
        <div className="bg-topbar__inner">
          <Link to="/traveler" className="bg-brand">
            <img src="/lumichan-logo.png" alt={t("")} loading="lazy" decoding="async" width={40} height={40} />
            <span className="text-gold font-serif">{t("Lumichan")}</span>
          </Link>
          <LanguageSwitcher />
          <Link to="/traveler" className="bg-back">{t("← Back to Home")}</Link>
        </div>
      </header>

      <main className="bg-main">
        <div className="bg-intro">
          <h1 className="font-serif">{t("Become a ")}<span className="text-gold">{t("Guide")}</span>
          </h1>
          <p>{t("Join our network of verified local guides and connect with travelers from around the world.")}</p>
        </div>

        {step < 4 && (
          <div className="bg-steps" aria-label={t("Application steps")}>
            {STEPS.map((item, index) => (
              <div key={item.num} className="bg-steps__item">
                <div className="bg-steps__node">
                  <div className={`bg-steps__circle${step >= item.num ? ' is-active' : ''}`}>
                    {t(step > item.num ? '✓' : item.num)}
                  </div>
                  <span>{t(item.label)}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`bg-steps__line${step > item.num ? ' is-active' : ''}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-card-wrap">
          {step === 1 && (
            <section className="bg-card">
              <div className="bg-card__title">
                <div className="bg-card__icon" aria-hidden>
                  👤
                </div>
                <h2 className="font-serif">{t("Personal Information")}</h2>
              </div>

              <div className="bg-grid">
                <label>{t("Full Name *")}<input
                    value={form.fullName}
                    onChange={(e) => update({ fullName: e.target.value })}
                    placeholder={t("Your full legal name")}
                  />
                </label>
                <label>{t("Email *")}<input
                    type="email"
                    value={form.email}
                    onChange={(e) => update({ email: e.target.value })}
                    placeholder={t("your@email.com")}
                  />
                </label>
                <label>{t("Phone *")}<input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update({ phone: e.target.value })}
                    placeholder={t("+86 123 4567 8900")}
                  />
                </label>
                <label>{t("Location *")}<input
                    value={form.location}
                    onChange={(e) => update({ location: e.target.value })}
                    placeholder={t("City, Province")}
                  />
                </label>
              </div>

              <UploadField
                label="Profile Photo"
                description="Clear face photo, professional appearance"
                accept="image/*"
                file={form.photo}
                onChange={(file) => update({ photo: file })}
                icon="📷"
              />
              <UploadField
                label="ID Document"
                description="Government-issued ID (passport, ID card)"
                accept="image/*,.pdf"
                file={form.idDocument}
                onChange={(file) => update({ idDocument: file })}
                icon="📄"
              />
            </section>
          )}

          {step === 2 && (
            <section className="bg-card">
              <div className="bg-card__title">
                <div className="bg-card__icon" aria-hidden>
                  🚗
                </div>
                <h2 className="font-serif">{t("Vehicle Information")}</h2>
              </div>

              <div className="bg-field">
                <div className="bg-field__label">{t("Do you have a vehicle?")}</div>
                <div className="bg-choice">
                  <button
                    type="button"
                    className={form.hasVehicle ? 'is-active' : ''}
                    onClick={() => update({ hasVehicle: true })}
                  >{t("Yes, I have a vehicle")}</button>
                  <button
                    type="button"
                    className={!form.hasVehicle ? 'is-active' : ''}
                    onClick={() => update({ hasVehicle: false })}
                  >{t("No vehicle")}</button>
                </div>
              </div>

              {form.hasVehicle && (
                <>
                  <div className="bg-grid">
                    <label>{t("Vehicle Type *")}<input
                        value={form.vehicleType}
                        onChange={(e) => update({ vehicleType: e.target.value })}
                        placeholder={t("e.g., Toyota Land Cruiser")}
                      />
                    </label>
                    <label>{t("License Plate *")}<input
                        value={form.vehiclePlate}
                        onChange={(e) => update({ vehiclePlate: e.target.value })}
                        placeholder={t("Vehicle plate number")}
                      />
                    </label>
                  </div>
                  <UploadField
                    label="Vehicle Photo"
                    description="Clear photo of your vehicle"
                    accept="image/*"
                    file={form.vehiclePhoto}
                    onChange={(file) => update({ vehiclePhoto: file })}
                    icon="📷"
                  />
                  <UploadField
                    label="Insurance Document"
                    description="Valid vehicle insurance certificate"
                    accept="image/*,.pdf"
                    file={form.insuranceDocument}
                    onChange={(file) => update({ insuranceDocument: file })}
                    icon="🛡"
                  />
                </>
              )}
            </section>
          )}

          {step === 3 && (
            <section className="bg-card">
              <div className="bg-card__title">
                <div className="bg-card__icon" aria-hidden>
                  ✨
                </div>
                <h2 className="font-serif">{t("Your Profile")}</h2>
              </div>

              <div className="bg-field">
                <div className="bg-field__label">{t("Languages You Speak *")}</div>
                <div className="bg-chips">
                  {LANGUAGES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={form.languages.includes(item) ? 'is-active' : ''}
                      onClick={() => toggleList('languages', item)}
                    >
                      {t(item)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-field">
                <div className="bg-field__label">{t("Your Specialties *")}</div>
                <div className="bg-chips">
                  {SPECIALTIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={form.specialties.includes(item) ? 'is-active' : ''}
                      onClick={() => toggleList('specialties', item)}
                    >
                      {t(item)}
                    </button>
                  ))}
                </div>
              </div>

              <label>{t("Years of Experience")}<input
                  value={form.experience}
                  onChange={(e) => update({ experience: e.target.value })}
                  placeholder={t("e.g., 5 years")}
                />
              </label>

              <label>{t("About You *")}<textarea
                  rows={6}
                  value={form.bio}
                  onChange={(e) => update({ bio: e.target.value })}
                  placeholder={t("Tell travelers about yourself, your experience, what makes your tours special...")}
                />
              </label>

              <UploadField
                label="Introduction Video (Optional)"
                description="1-2 minute video introducing yourself"
                accept="video/*"
                file={form.introVideo}
                onChange={(file) => update({ introVideo: file })}
                icon="🎬"
              />
            </section>
          )}

          {step === 4 && (
            <section className="bg-card bg-card--success">
              <div className="bg-success-icon" aria-hidden>
                ✓
              </div>
              <h2 className="font-serif">{t("Application Submitted!")}</h2>
              <p>{t("Thank you for applying. Our team will review your application and reach out within 2-3 business days.")}</p>
              <Link to="/traveler" className="btn btn-gold">{t("Back to Home")}</Link>
            </section>
          )}

          {error && <p className="bg-error">{t(error)}</p>}

          {step < 4 && (
            <div className="bg-nav">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1 || submitting}
              >{t("Previous")}</button>
              {step < 3 ? (
                <button type="button" className="btn btn-gold" onClick={goNext}>{t("Next Step")}</button>
              ) : (
                <button type="button" className="btn btn-gold" onClick={submit} disabled={submitting}>
                  {t(submitting ? 'Submitting…' : 'Submit Application')}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
