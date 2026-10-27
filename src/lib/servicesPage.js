import seed from '../../public/api/data/services-page.json'

export const servicesPreview = import.meta.env.DEV || import.meta.env.MODE === 'staging'
export const serviceAliases = { 'journey-planning': 'planning', 'planning-support': 'planning', 'private-road-trip': 'road-trip', 'signature-private-journey': 'signature', 'educational-cultural-journeys': 'education' }
export const canonicalServiceId = (id = '') => serviceAliases[id] || id
export const safeServiceLink = (url, fallback = '/traveler/contact') => typeof url === 'string' && /^\/traveler(?:[/?#]|$)/.test(url) && !/[\s\\]/.test(url) ? url : fallback
export function visibleServiceMedia(image) {
  return image?.published !== false && (servicesPreview || image?.authorized === true && image?.aiGenerated !== true) && (image?.src?.startsWith('/') && !image.src.startsWith('//') || image?.src?.startsWith('https://')) ? image : null
}
export function verifiedServiceReview(review) {
  return review?.status === 'published' && review.verified === true && review.aiSample !== true && !!review.source?.trim() && !!review.permission?.trim() && !!review.text?.trim() && (!review.image?.src || review.image.authorized === true && review.image.aiGenerated !== true && !!review.image.licenseRecord?.trim())
}
export function normalizeServicesPage(saved = {}) {
  return { ...seed, ...saved,
    modules: seed.modules.map((module) => ({ ...module, ...saved.modules?.find((item) => item.id === module.id) })).sort((a, b) => a.order - b.order),
    services: seed.services.map((service) => ({ ...service, ...saved.services?.find((item) => item.id === service.id) })).sort((a, b) => a.order - b.order),
    gallery: Array.isArray(saved.gallery) ? saved.gallery : seed.gallery,
    reviews: (saved.reviews || []).filter(verifiedServiceReview),
  }
}
export default seed
