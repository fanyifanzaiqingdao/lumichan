import { Link } from 'react-router-dom'
import { approvedPolicy } from '../lib/homepageContent.js'
import './BookingPolicy.css'

export default function BookingPolicy({ service, version, summary = false, plain = false }) {
  const policy = approvedPolicy(service, version)
  if (!policy) return <p className="booking-policy-pending">Changes and cancellation terms are confirmed before booking.</p>
  const steps = summary ? [policy.refundSteps[policy.homepageRefundSummary.stepIndex]] : policy.refundSteps
  if (plain) return <div className="booking-policy-text" data-policy-version={policy.version}>
    <ul>{steps.map((step) => <li key={step.when}><strong>{step.when}:</strong> {step.refund}{step.refund.includes('%') ? ' refund' : ''}.</li>)}</ul>
    <p>{policy.dateChange}</p>
    {policy.footnotes.map((note) => <p key={note}>{note}</p>)}
  </div>
  return <section className={'booking-policy' + (summary ? ' booking-policy--summary' : '')} aria-label={service.title + ' booking policy'} data-policy-version={policy.version}>
    <div className="booking-policy__header"><strong>✓ Flexible Booking</strong><span>Plans change. We understand.</span></div>
    <dl className="booking-policy__steps">
      {steps.map((step) => <div key={step.when}><dt>{step.when}{summary && <span className="booking-policy__refund-label">refund</span>}</dt><dd>{step.refund}{!summary && <small>{step.refund.includes('%') ? 'refund' : ''}</small>}</dd></div>)}
    </dl>
    <p className="booking-policy__change">{policy.dateChange}</p>
    {policy.footnotes.map((note) => <p className="booking-policy__note" key={note}>{note}</p>)}
    {!summary && <p className="booking-policy__version">Policy: {policy.version} · <Link to={policy.termsHref}>Booking Terms</Link></p>}
  </section>
}
