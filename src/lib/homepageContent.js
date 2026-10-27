import defaults from '../data/homepage.js'

export function normalizeHomepage(saved = {}) {
  const migrated = saved.schemaVersion !== 3
  const homepage = {
    ...defaults,
    ...saved,
    schemaVersion: 3,
    bookingPolicyVersion: migrated ? defaults.bookingPolicyVersion : saved.bookingPolicyVersion,
    copy: { ...defaults.copy, ...saved.copy, process: { ...defaults.copy.process, ...saved.copy?.process, eyebrow: saved.copy?.process?.eyebrow || defaults.copy.process.eyebrow } },
    services: defaults.services.map((seed) => {
      const current = saved.services?.find((item) => item.id === seed.id)
      if (!current) return seed
      if (!migrated) return { ...seed, ...current }
      return { ...current, ...seed, image: current.image ?? seed.image, imageAlt: current.imageAlt ?? seed.imageAlt,
        imageFocalPoint: current.imageFocalPoint ?? seed.imageFocalPoint, media: { ...seed.media, ...current.media } }
    }),
    process: {
      steps: saved.process?.steps || (saved.steps || defaults.steps).map(([number, title, body, reassurance], index) => ({ order: index + 1, number, title, body, reassurance })),
      videoEnabled: false,
      videos: [],
    },
    vlogs: saved.vlogs || [],
  }
  // Apply the approved revision once, retaining unrelated CMS content and later edits.
  if (saved.contentRevision !== defaults.contentRevision) {
    homepage.services = homepage.services.map((service) => {
      const seed = defaults.services.find((item) => item.id === service.id)
      const fields = ['price', 'unit', 'priceNote']
      if (service.id !== 'planning') fields.push('image', 'imageAlt', 'imageFocalPoint', 'media')
      return { ...service, ...Object.fromEntries(fields.map((key) => [key, seed[key]])),
        ...(service.details ? { details: { ...service.details, priceDetail: seed.priceNote } } : {}) }
    })
    homepage.journeys = defaults.journeys.map((seed) => {
      const current = saved.journeys?.find((item) => item.slug === seed.slug) || seed
      return { ...current, ...Object.fromEntries(['title', 'summary', 'tags', 'priceBadge', 'priceBadgeApproved'].map((key) => [key, seed[key]])) }
    })
    homepage.whyGallery = defaults.whyGallery.map((image) => ({ ...image }))
    homepage.faqs = (homepage.faqs || defaults.faqs).map((faq) => faq[0] === defaults.faqs[0][0] ? defaults.faqs[0] : faq)
    homepage.contentRevision = defaults.contentRevision
  }
  homepage.services = homepage.services.map((service) => ['road-trip','signature'].includes(service.id) && service.unitApproved !== true && service.unit === '/ day / vehicle'
    ? { ...service, unit: 'Starting reference', unitApproved: false, priceNote: 'Final pricing basis confirmed in your written quote' } : service)
  homepage.faqs = (homepage.faqs || []).map((faq) => faq[0] === defaults.faqs[0][0] && /per day per vehicle/.test(faq[1]) ? defaults.faqs[0] : faq)
  if (saved.homepageLayoutRevision !== defaults.homepageLayoutRevision) {
    homepage.copy = { ...homepage.copy, ...defaults.copy }
    if (!saved.hero?.title || saved.hero.title === 'Explore China More Deeply. Travel With Confidence') homepage.hero = { ...defaults.hero, ...homepage.hero, title: defaults.hero.title }
    homepage.hero = { ...defaults.hero, ...homepage.hero }
    homepage.whyGallery = defaults.whyGallery
    homepage.whyItems = defaults.whyItems
    homepage.storySequences = defaults.storySequences
    homepage.services = homepage.services.map((service) => {
      const seed = defaults.services.find((item) => item.id === service.id)
      const oldImage = !service.image || service.image.startsWith('/images/home-revision2/')
      return { ...service, detailPageUrl: seed.detailPageUrl, titleLinkEnabled: seed.titleLinkEnabled, imageLinkEnabled: seed.imageLinkEnabled,
        ...(oldImage ? { image: seed.image, imageAlt: seed.imageAlt, media: { ...seed.media, ...(service.media?.published === false ? { published: false } : {}) } } : {}) }
    })
    homepage.journeys = homepage.journeys.map((journey) => ({ ...journey, showHomepagePrice: false }))
    if ((saved.faqs || []).length !== 5) homepage.faqs = defaults.faqs
    if ((saved.process?.steps || []).some((step) => ['Inquiry', 'Booking', 'Before you travel'].includes(step.title))) homepage.process.steps = defaults.process.steps
    homepage.homepageLayoutRevision = defaults.homepageLayoutRevision
  }
  homepage.footer = { ...defaults.footer, ...saved.footer }
  homepage.legalIdentity = { ...defaults.legalIdentity, ...saved.legalIdentity }
  homepage.storySequences ??= defaults.storySequences
  return homepage
}

export function journeyPriceBadge(journey) {
  return journey.priceBadgeApproved === true && /^From USD [1-9][\d,]*(?:\.\d{2})?$/.test(journey.priceBadge || '') ? journey.priceBadge : ''
}

export function serviceImage(service) {
  if (service.media?.published === false) return null
  return service.image || null
}

export function approvedPolicy(service, version) {
  const policy = service?.bookingPolicy
  return service?.bookingApproved === true && policy?.status === 'approved' && policy.version === version &&
    policy.homepageRefundSummary?.stepIndex === 0 && /^100%\*?$/.test(policy.refundSteps?.[0]?.refund) &&
    policy.dateChange && policy.footnotes?.length ? policy : null
}

export function publishedReviews(reviews = []) {
  return reviews.filter((item) => item.published === true && item.status === 'approved' && item.layoutOnly !== true && item.aiGenerated !== true && item.reviewSource &&
    item.image && !/placeholder/i.test(item.image) && item.imageAlt && item.imageConsentRecord && item.quote &&
    item.guestDisplayName && item.tripContext && item.reviewConsentRecord)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

export function quotationTemplate(homepage, serviceId) {
  const service = homepage.services.find((item) => item.id === serviceId)
  const policy = approvedPolicy(service, homepage.bookingPolicyVersion)
  if (!policy) throw new Error('Approved service policy required')
  return [
    'LUMICHAN | JOURNEY PROPOSAL', service.title,
    'Guest: ____________________', 'Travel dates: ____________________',
    'Travelers: ____________________', 'Confirmed itinerary: ____________________',
    'Final price and currency: ____________________',
    'Included services: ____________________', 'Excluded services: ____________________',
    'Payment schedule: ____________________', '', 'BOOKING AND CANCELLATION',
    ...policy.refundSteps.map((step) => step.when + ': ' + step.refund + (step.refund.includes('%') ? ' refund' : '')),
    policy.dateChange, ...policy.footnotes,
    '', 'Pre-approved non-refundable costs and approval record: ____________________',
    'Policy version: ' + policy.version, 'Terms: ' + policy.termsHref,
    'Guest confirmation and date: ____________________',
  ].join('\n')
}
