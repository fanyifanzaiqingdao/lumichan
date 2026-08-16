/** Site-wide contact settings — edit WhatsApp number here */
export const SITE = {
  // International format, digits only (no + / spaces). Example: 8613812345678
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '',
  whatsappPrefill: "Hi Lumichan! I'd like to ask about a trip.",
}

export function whatsappUrl(prefill = SITE.whatsappPrefill) {
  const n = String(SITE.whatsappNumber || '').replace(/\D/g, '')
  if (!n) return null
  const text = encodeURIComponent(prefill || '')
  return `https://wa.me/${n}${text ? `?text=${text}` : ''}`
}
