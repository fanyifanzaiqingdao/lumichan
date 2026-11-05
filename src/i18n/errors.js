import sourceKeys from './source-keys.json' with { type:'json' }
const knownSources = new Set(sourceKeys)
import en from './en.json' with { type:'json' }
// Keep error state as a source string so changing language also updates existing alerts.
export function apiErrorMessage(message, status = 0) {
  if (typeof message === 'string' && (knownSources.has(message) || en[message])) return message
  if (status === 401) return 'Please sign in'
  if (status === 403) return 'Access denied. Please refresh the page or sign in again.'
  if (status === 429) return 'Too many requests. Please try again later.'
  if (status >= 500) return 'Service unavailable. Please try again later.'
  return 'Request failed. Please check your information and try again.'
}
