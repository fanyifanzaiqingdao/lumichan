export async function supportApi(file, { body, token, csrf, signal } = {}) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) controller.abort()
  const timeout = setTimeout(abort, 65000)
  try {
    const response = await fetch(`/api/${file}`, {
      method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: controller.signal,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.ok) {
      const error = new Error(data.error || 'Service unavailable. Please try again later.')
      error.status = response.status
      throw error
    }
    return data
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort) }
}

export function messageId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(20)), n => n.toString(16).padStart(2, '0')).join('')
}

export function supportDate(value, locale = 'zh-CN') {
  if (!value) return ''
  return new Date(value.replace(' ', 'T') + 'Z').toLocaleString(locale, { timeZone: 'Asia/Shanghai', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}
