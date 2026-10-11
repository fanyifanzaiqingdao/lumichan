export function track(event, detail = {}) {
  const payload = { event, ...detail }
  window.dispatchEvent(new CustomEvent('lumichan:analytics', { detail: payload }))
  if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload)
}
