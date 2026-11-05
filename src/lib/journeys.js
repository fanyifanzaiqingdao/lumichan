export const JOURNEY_SLUGS = ['cultural-gateway', 'western-sichuan-private-road-trip', 'deep-cultural-journey']
export const journeySlug = value => value === 'chengdu-cultural-gateway' ? 'cultural-gateway' : value
export function journeyPath(slug) { return '/journeys' + (slug ? '/' + journeySlug(slug) : '') }
export function journeyInquiry(journey, sourcePage = journeyPath(journey?.slug)) {
  const params = new URLSearchParams({ sourcePage })
  if (journey) { params.set('journey', journey.inquiryJourneyId || journey.slug); params.set('journey_name', journey.title) }
  return '/traveler?' + params.toString() + '#inquiry'
}
export const ordered = list => [...(list || [])].sort((a,b) => (a.order || 0) - (b.order || 0))
export function usableJourneysPage(page) {
  return page?.schemaVersion === 1 && Array.isArray(page.journeys) && page.landing && Array.isArray(page.landing.hero) && Array.isArray(page.landing.featured) && Array.isArray(page.landing.moods) && page.journeys.every(j => JOURNEY_SLUGS.includes(j.slug) && j.hero && j.intro && j.experience?.items && j.gallery?.items && j.story && j.cta && j.goodToKnow)
}
