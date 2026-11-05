import { t } from '../i18n/runtime.js'
import { Link } from '../i18n/router.jsx'
import { approvedPolicy } from '../lib/homepageContent.js'
import './BookingPolicy.css'

export default function BookingPolicy({ service, version, summary = false, plain = false }) {
  const policy = approvedPolicy(service, version)
  if (!policy) return <p className="booking-policy-pending">{t("Changes and cancellation terms are confirmed before booking.")}</p>
  const steps = summary ? [policy.refundSteps[policy.homepageRefundSummary.stepIndex]] : policy.refundSteps
  if (plain) return <div className="booking-policy-text" data-policy-version={policy.version}>
    <ul>{steps.map((step) => <li key={step.when}><strong>{t(step.when)}:</strong> {t(step.refund)}{t(step.refund.includes('%') ? ' refund' : '')}.</li>)}</ul>
    <p>{t(policy.dateChange)}</p>
    {policy.footnotes.map((note) => <p key={note}>{t(note)}</p>)}
  </div>
  return <section className={'booking-policy' + (summary ? ' booking-policy--summary' : '')} aria-label={t(service.title + ' booking policy')} data-policy-version={policy.version}>
    <div className="booking-policy__header"><strong>{t("✓ Flexible Booking")}</strong><span>{t("Plans change. We understand.")}</span></div>
    <dl className="booking-policy__steps">
      {steps.map((step) => <div key={step.when}><dt>{t(step.when)}{summary && <span className="booking-policy__refund-label">{t("refund")}</span>}</dt><dd>{t(step.refund)}{!summary && <small>{t(step.refund.includes('%') ? 'refund' : '')}</small>}</dd></div>)}
    </dl>
    <p className="booking-policy__change">{t(policy.dateChange)}</p>
    {policy.footnotes.map((note) => <p className="booking-policy__note" key={note}>{t(note)}</p>)}
    {!summary && <p className="booking-policy__version">{t("Policy: ")}{t(policy.version)} · <Link to={policy.termsHref}>{t("Booking Terms")}</Link></p>}
  </section>
}
