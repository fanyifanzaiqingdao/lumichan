import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import test from 'node:test'
import homepage from '../src/data/homepage.js'
import bookingTerms from '../src/content/bookingTerms.js'
import privacyPolicy from '../src/content/privacyPolicy.js'
import termsOfUse from '../src/content/termsOfUse.js'
import { approvedPolicy, journeyPriceBadge, normalizeHomepage, publishedReviews, quotationTemplate, serviceImage } from '../src/lib/homepageContent.js'

const seed = JSON.parse(await readFile(new URL('../public/api/data/homepage.json', import.meta.url), 'utf8'))

test('all legal copy, including escaped metadata, uses the approved company and address', async () => {
  const address = 'No. 140, Annex of Tianfu Avenue, Chengdu High-tech Zone, Chengdu, Sichuan, China'
  assert.ok((await readFile(new URL('../src/config/site.js', import.meta.url), 'utf8')).includes(address))
  for (const content of [bookingTerms, privacyPolicy, termsOfUse]) {
    const text = JSON.stringify(content)
    assert.doesNotMatch(text, /成都麓米禅分公司|Shijicheng Road/)
    assert.match(text, /寰宇纵横国际旅行社（重庆）有限公司四川第四分公司/)
    assert.ok(text.includes(address))
  }
})

test('revision 2 migrates only changed content and preserves later CMS edits', () => {
  const old = structuredClone(homepage)
  delete old.contentRevision
  old.hero.title = 'Custom hero kept'
  old.services[0].price = 'From RMB 999'
  old.services[0].details = { priceDetail: 'Old price', support: 'Custom support' }
  old.journeys[0].title = 'Chengdu Cultural Gateway'
  old.whyGallery = []
  const current = normalizeHomepage(old)
  assert.equal(current.hero.title, old.hero.title)
  assert.equal(current.services[0].price, 'From USD 99')
  assert.equal(current.services[0].details.support, 'Custom support')
  assert.equal(current.services[0].details.priceDetail, '1–5 days: USD 99 · 6–10 days: USD 199')
  assert.equal(current.journeys[0].title, 'Cultural gateway')
  assert.equal(current.whyGallery.length, 5)
  current.services[0].price = 'From USD 109'
  current.whyGallery[0] = { src: '/uploads/custom.jpg', alt: 'Custom photo', aiGenerated: false }
  assert.deepEqual(normalizeHomepage(current), current)
})

test('approved starting-price badges do not invent a group basis', () => {
  assert.deepEqual(homepage.journeys.map(journeyPriceBadge), ['From USD 299', 'From USD 899', ''])
  assert.equal(journeyPriceBadge({ priceBadge: 'From USD 299', priceBadgeApproved: false }), '')
  assert.equal(journeyPriceBadge({ priceBadge: 'PLACEHOLDER', priceBadgeApproved: true }), '')
  assert.ok(homepage.journeys.every((journey) => !journey.groupBasis))
})

test('five gallery illustrations and three replacement images have both formats and disclosure', async () => {
  const images = [...homepage.whyGallery.map((image) => ({ src: image.src, ai: image.aiGenerated })), ...homepage.services.slice(1).map((item) => ({ src: item.image, ai: item.media.aiGenerated }))]
  assert.equal(images.length, 8)
  for (const image of images) {
    assert.equal(image.ai, true)
    await access(new URL('../public' + image.src, import.meta.url))
    await access(new URL('../public' + image.src.replace('.jpg', '.webp'), import.meta.url))
  }
})

test('homepage fallback and CMS seed share service copy, images and inquiry CTA', () => {
  assert.deepEqual(seed.services, homepage.services)
  assert.deepEqual(seed.copy.services, homepage.copy.services)
  assert.deepEqual(seed.formConfig, homepage.formConfig)
  assert.equal(homepage.services.length, 4)
  assert.equal(homepage.formConfig.submitLabel, 'Start planning my journey →')
  assert.ok(homepage.copy.services.disclaimer.includes('vary by service'))
})

test('all default service photos have alt text and both image formats', async () => {
  for (const service of homepage.services) {
    assert.ok(service.imageAlt)
    await access(new URL(`../public${service.image}`, import.meta.url))
    await access(new URL(`../public${service.image.replace(/\.jpg$/, '.webp')}`, import.meta.url))
    assert.equal(service.bookingApproved, true)
  }
})

test('confirmed policies share version and preserve all refund tiers and conditions', () => {
  const expected = [3, 4, 4, 5]
  homepage.services.forEach((service, index) => {
    const policy = approvedPolicy(service, homepage.bookingPolicyVersion)
    assert.ok(policy)
    assert.equal(policy.refundSteps.length, expected[index])
    assert.equal(policy.homepageRefundSummary.stepIndex, 0)
    assert.match(policy.refundSteps[0].refund, /^100%/)
    assert.ok(policy.footnotes.length)
    const quote = quotationTemplate(homepage, service.id)
    for (const step of policy.refundSteps) assert.ok(quote.includes(step.when + ': ' + step.refund))
    assert.ok(quote.includes(policy.dateChange))
    assert.ok(quote.includes(homepage.bookingPolicyVersion))
    for (const footnote of policy.footnotes) assert.ok(quote.includes(footnote))
  })
  assert.equal(homepage.services[3].bookingPolicy.refundSteps[4].refund, 'No refund*')
})

test('old saved homepage upgrades without losing hero, image or process text', () => {
  const old = structuredClone(homepage)
  delete old.schemaVersion
  delete old.process
  old.hero.title = 'Existing custom hero'
  old.services[0].image = '/uploads/custom.jpg'
  old.services[0].bookingPolicy = null
  old.steps[0][2] = 'Custom process text'
  const updated = normalizeHomepage(old)
  assert.equal(updated.hero.title, old.hero.title)
  assert.equal(updated.services[0].image, old.services[0].image)
  assert.ok(approvedPolicy(updated.services[0], updated.bookingPolicyVersion))
  assert.equal(updated.process.steps[0].body, 'Custom process text')
  assert.equal(updated.process.videoEnabled, false)
  assert.deepEqual(updated.process.videos, [])
})

test('draft or version-mismatched policies never generate a quotation', () => {
  const draft = structuredClone(homepage)
  draft.services[0].bookingApproved = false
  assert.equal(approvedPolicy(draft.services[0], draft.bookingPolicyVersion), null)
  assert.throws(() => quotationTemplate(draft, 'planning'))
  assert.equal(approvedPolicy(homepage.services[0], 'wrong-version'), null)
})

test('unpublished service images stay hidden across migration and empty API images never use a fallback', () => {
  const old = structuredClone(homepage)
  delete old.schemaVersion
  old.services[0].media = { published: false, source: 'Private draft' }
  old.services[0].imageFocalPoint = '30% 60%'
  const service = normalizeHomepage(old).services[0]
  assert.equal(service.media.published, false)
  assert.equal(service.media.source, 'Private draft')
  assert.equal(service.imageFocalPoint, '30% 60%')
  assert.equal(serviceImage(service), null)
  assert.equal(serviceImage({ ...homepage.services[0], image: '' }), null)
  assert.equal(serviceImage(homepage.services[0]), homepage.services[0].image)
})

test('only photo and review approved stories are published', () => {
  const valid = { id: '1', published: true, status: 'approved', image: '/uploads/authorized.jpg', imageAlt: 'Authorized trip photo', imageConsentRecord: 'photo-record', quote: 'Authorized review fixture', guestDisplayName: 'Test', tripContext: 'Test trip', reviewConsentRecord: 'review-record' }
  assert.equal(publishedReviews([valid]).length, 1)
  for (const field of ['image', 'imageAlt', 'imageConsentRecord', 'quote', 'guestDisplayName', 'tripContext', 'reviewConsentRecord']) {
    assert.equal(publishedReviews([{ ...valid, [field]: '' }]).length, 0)
  }
  assert.equal(publishedReviews([{ ...valid, status: 'draft' }]).length, 0)
})


test('new service brief removes unconfirmed vehicle units without discarding confirmed custom units', () => {
  const old = structuredClone(homepage)
  old.services[1].unit = '/ day / vehicle'
  old.services[1].unitApproved = false
  old.services[2].unit = '/ confirmed custom group'
  old.services[2].unitApproved = true
  old.faqs[0][1] = 'Private Road Trip starts from USD 299 per day per vehicle.'
  const result = normalizeHomepage(old)
  assert.equal(result.services[1].unit, 'Starting reference')
  assert.equal(result.services[2].unit, '/ confirmed custom group')
  assert.doesNotMatch(result.faqs[0][1], /per day per vehicle/)
})
