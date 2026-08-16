import { useEffect, useRef, useState } from 'react'
import './PaymentPanel.css'

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

function loadPayPalSdk(clientId, currency) {
  const existing = document.querySelector('script[data-lumichan-paypal]')
  if (existing && window.paypal) {
    return Promise.resolve()
  }
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('PayPal SDK failed')))
    })
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture`
    s.dataset.lumichanPaypal = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load PayPal SDK'))
    document.body.appendChild(s)
  })
}

export default function PaymentPanel({ product }) {
  const [config, setConfig] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stripeBusy, setStripeBusy] = useState('')
  const [paypalReady, setPaypalReady] = useState(false)
  const paypalRef = useRef(null)

  const parsed = parsePrice(product?.price)
  const showPaypal = config?.paypal?.enabled && parsed && parsed.currency !== 'CNY'
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
        if (!cancelled) setConfig({ paypal: { enabled: false }, stripe: { enabled: false }, deposit_percent: 0.2 })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setError('')
    setSuccess('')
    setPaypalReady(false)

    if (!showPaypal || !config?.paypal?.client_id || !paypalRef.current) return undefined

    ;(async () => {
      try {
        await loadPayPalSdk(config.paypal.client_id, parsed.currency)
        if (cancelled || !window.paypal || !paypalRef.current) return
        paypalRef.current.innerHTML = ''
        await window.paypal
          .Buttons({
            style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
            createOrder: async () => {
              const res = await fetch('/api/paypal-create-order.php', {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: product.id }),
              })
              const json = await res.json().catch(() => ({}))
              if (!res.ok || !json.id) throw new Error(json.error || 'Could not create PayPal order')
              return json.id
            },
            onApprove: async (data) => {
              const res = await fetch('/api/paypal-capture-order.php', {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: data.orderID }),
              })
              const json = await res.json().catch(() => ({}))
              if (!res.ok || json.status !== 'COMPLETED') {
                throw new Error(json.error || 'Payment capture failed')
              }
              setSuccess('Deposit received! We will contact you shortly to finalize your itinerary.')
            },
            onError: () => setError('PayPal error. Please try again or contact us.'),
          })
          .render(paypalRef.current)
        if (!cancelled) setPaypalReady(true)
      } catch (err) {
        if (!cancelled) setError(err.message || 'PayPal failed to load')
      }
    })()

    return () => {
      cancelled = true
      if (paypalRef.current) paypalRef.current.innerHTML = ''
    }
  }, [showPaypal, config?.paypal?.client_id, product?.id, parsed?.currency])

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
  const deposit = Math.round(parsed.amount * (ratio || 0.2) * 100) / 100

  return (
    <div className="pay-panel">
      <p className="pay-panel__hint">
        Pay a <strong>{pctShow}% deposit</strong> (
        <strong>{formatMoney(deposit, parsed.currency)}</strong> of {formatMoney(parsed.amount, parsed.currency)}) —
        balance due before travel. Our team will follow up within hours.
      </p>

      {success && <p className="pay-panel__ok">{success}</p>}
      {error && <p className="pay-panel__err">{error}</p>}

      {showPaypal && (
        <div className="pay-panel__block">
          <div className="pay-panel__label">1. PayPal</div>
          {!paypalReady && !error && <p className="pay-panel__muted">Loading PayPal…</p>}
          <div ref={paypalRef} />
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
