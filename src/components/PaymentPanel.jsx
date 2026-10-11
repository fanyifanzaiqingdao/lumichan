import { useEffect, useState } from 'react'
import './PaymentPanel.css'

/** Fallback if API config has not been updated on the server yet */
const PAYPAL_DEPOSIT_LINK_FALLBACK = 'https://www.paypal.com/ncp/payment/84Y8LAY8N457A'

function parsePrice(price) {
  if (!price) return null
  const currency = /¥|CNY|RMB/i.test(price) ? 'CNY' : /€|EUR/i.test(price) ? 'EUR' : 'USD'
  const m = String(price).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/)
  if (!m) return null
  return { amount: parseFloat(m[1]), currency }
}

function formatMoney(amount, currency) {
  const symbol = currency === 'EUR' ? '€' : currency === 'CNY' ? '¥' : '$'
  return `${symbol}${Number(amount).toFixed(2)} ${currency}`
}

export default function PaymentPanel({ product }) {
  const [config, setConfig] = useState(null)
  const [error, setError] = useState('')
  const [stripeBusy, setStripeBusy] = useState('')

  const parsed = parsePrice(product?.price)
  const paypalLink = String(config?.paypal?.payment_link || PAYPAL_DEPOSIT_LINK_FALLBACK).trim()
  const showPaypal = Boolean(paypalLink) && parsed && parsed.currency !== 'CNY'
  const showCard = config?.stripe?.enabled && config?.stripe?.card !== false && parsed
  const showAlipay = config?.stripe?.enabled && config?.stripe?.alipay !== false && parsed
  const showStripe = showCard || showAlipay

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/payment-config.php', { headers: { Accept: 'application/json' } })
        const json = await res.json()
        if (!cancelled && res.ok && json.ok) setConfig(json)
      } catch {
        if (!cancelled) {
          setConfig({
            paypal: { enabled: true, payment_link: PAYPAL_DEPOSIT_LINK_FALLBACK },
            stripe: { enabled: false },
            deposit_percent: 0.2,
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function payWithStripe(method) {
    setStripeBusy(method)
    setError('')
    try {
      const res = await fetch('/api/stripe-create-checkout.php', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          origin: window.location.origin,
          method,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.url) throw new Error(json.error || 'Checkout failed')
      window.location.href = json.url
    } catch (err) {
      setError(err.message || 'Payment failed')
      setStripeBusy('')
    }
  }

  if (!parsed || (!showPaypal && !showStripe)) return null

  const pctRaw = Number(config?.deposit_percent ?? 0.2)
  const ratio = pctRaw > 1 ? pctRaw / 100 : pctRaw
  const pctShow = Math.round((ratio || 0.2) * 100)

  return (
    <div className="pay-panel">
      <p className="pay-panel__hint">
        Pay your trip <strong>deposit</strong> to reserve this journey. Balance is due before travel.
        {parsed.currency !== 'CNY' ? (
          <>
            {' '}
            Listed price: <strong>{formatMoney(parsed.amount, parsed.currency)}</strong>
            {pctShow ? <> (typical deposit about {pctShow}%)</> : null}.
          </>
        ) : null}
      </p>

      {error && <p className="pay-panel__err">{error}</p>}

      {showPaypal && (
        <div className="pay-panel__block">
          <div className="pay-panel__label">1. PayPal — Deposit</div>
          <a
            className="btn btn-gold pay-panel__paypal-link"
            href={paypalLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Pay deposit with PayPal
          </a>
          <p className="pay-panel__muted">
            Opens PayPal to pay the deposit. After payment, we will contact you to finalize the trip.
          </p>
        </div>
      )}

      {showCard && (
        <div className="pay-panel__block">
          <div className="pay-panel__label">2. Credit / Debit Card (Stripe)</div>
          <button
            type="button"
            className="btn btn-outline pay-panel__stripe"
            onClick={() => payWithStripe('card')}
            disabled={!!stripeBusy}
          >
            {stripeBusy === 'card' ? 'Redirecting…' : 'Pay with Card'}
          </button>
        </div>
      )}

      {showAlipay && (
        <div className="pay-panel__block">
          <div className="pay-panel__label">3. Alipay International (via Stripe)</div>
          <button
            type="button"
            className="btn btn-outline pay-panel__alipay"
            onClick={() => payWithStripe('alipay')}
            disabled={!!stripeBusy}
          >
            {stripeBusy === 'alipay' ? 'Redirecting…' : 'Pay with Alipay'}
          </button>
        </div>
      )}
    </div>
  )
}
