/** Site-wide contact settings */
export const SITE = {
  siteUrl: 'https://lumichan.com.cn',
  contactEmail: 'jin.lu@lumichan.com.cn',
  phoneDisplay: '+86 13551117121',
  // International format, digits only (no + / spaces)
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '8613551117121',
  address:
    'No. 140, Annex to No. 198 Shijicheng Road, No. 12, Middle Section of Tianfu Avenue, Chengdu High-tech Zone, Chengdu, Sichuan, China',
  whatsappPrefill: "Hi Lumichan! I'd like to book a consultation.",
}

export function whatsappUrl(prefill = SITE.whatsappPrefill) {
  const n = String(SITE.whatsappNumber || '').replace(/\D/g, '')
  if (!n) return null
  const text = encodeURIComponent(prefill || '')
  return `https://wa.me/${n}${text ? `?text=${text}` : ''}`
}
