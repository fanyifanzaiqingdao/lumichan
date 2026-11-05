// Coalesce simultaneous public CMS reads. Do not retain published data after completion:
// subsequent navigation must see removals and publishing changes.
const pending = new Map()
const allowed = new Set(['/api/homepage.php', '/api/services-page.php', '/api/journeys.php'])
export function publicContent(url, options = {}) {
  if (!allowed.has(url)) return fetch(url, options)
  let task = pending.get(url)
  if (!task) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    task = fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then(async response => ({ response, body: await response.text() }))
      .finally(() => { clearTimeout(timer); if (pending.get(url) === task) pending.delete(url) })
    pending.set(url, task)
  }
  return new Promise((resolve, reject) => {
    const signal = options.signal
    const abort = () => reject(new DOMException('Aborted', 'AbortError'))
    if (signal?.aborted) { abort(); return }
    signal?.addEventListener('abort', abort, { once: true })
    task.then(({ response, body }) => {
      if (!signal?.aborted) resolve(new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers }))
    }, reject).finally(() => signal?.removeEventListener('abort', abort))
  })
}
