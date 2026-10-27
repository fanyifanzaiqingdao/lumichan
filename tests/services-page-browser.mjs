import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.TEST_URL || 'http://127.0.0.1:5191'
const output = '/tmp/lumichan-services-qa'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ reducedMotion: 'reduce' })
const errors = []
page.on('pageerror', error => errors.push(error.message))
try {
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(base + '/traveler/services')
    await page.getByRole('heading', { level: 1, name: 'Travel Your Way. Go Deeper.' }).waitFor()
    await page.locator('.sp-review-grid article').nth(2).waitFor()
    await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.locator('[data-service-module]').count(), 8)
    assert.equal(await page.locator('.sp-service').count(), 3)
    assert.equal(await page.locator('.sp-service details').count(), 6)
    assert.equal(await page.locator('.sp-service details[open]').count(), 0)
    assert.equal(await page.locator('.sp-price a').count(), 3)
    assert.equal(await page.locator('.sp-service-list > a').count(), 0)
    assert.equal(await page.locator('.sp-pricing-steps li').count(), 4)
    assert.equal(await page.locator('.sp-gallery > .sp-image').count(), 5)
    assert.equal(await page.locator('.sp-idea-steps article').count(), 3)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `overflow at ${width}`)
    for (const image of await page.locator('.sp-page img').all()) {
      await image.scrollIntoViewIfNeeded()
      await image.evaluate(img => img.decode())
    }
    const first = page.locator('.sp-service').first()
    const included = first.getByText("See what's included", { exact: true })
    await included.focus(); await page.keyboard.press('Enter')
    assert.equal(await first.locator('details[open]').count(), 1)
    const booking = first.getByText('Flexible booking', { exact: true })
    await booking.focus(); await page.keyboard.press('Space')
    assert.equal(await first.locator('details[open]').count(), 2)
    assert.match(await first.locator('details').nth(1).innerText(), /Partial refund/)
    await included.click(); await booking.click()
    await page.getByRole('button', { name: 'Next vehicle images' }).click()
    assert.ok(await page.locator('.sp-gallery').evaluate(el => el.scrollLeft) > 0, `gallery arrow at ${width}`)
    await page.locator('.sp-gallery').focus(); await page.keyboard.press('ArrowLeft')
    const photo = page.getByRole('button', { name: 'View full illustration 1', exact: true })
    await photo.click(); assert.equal(await page.locator('dialog[open]').count(), 1)
    const dimensions = await page.locator('dialog img').evaluate(img => ({complete:img.complete, width:img.naturalWidth}))
    assert.ok(dimensions.complete && dimensions.width > 0)
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('dialog[open]').count(), 0)
    assert.ok(await photo.evaluate(el => document.activeElement === el))
    if ([390,1440].includes(width)) {
      await page.evaluate(() => window.scrollTo(0,0))
      await page.screenshot({ path: `${output}/services-${width}.png`, fullPage: true })
      await page.locator('[data-service-module="services"]').screenshot({path:`${output}/service-cards-${width}.png`,style:'.site-header,.support-launcher{visibility:hidden!important}'})
    }
    await first.getByRole('link', { name: 'Plan My Trip' }).click()
    await page.waitForURL('**/traveler/contact?service=planning')
    assert.equal(await page.locator('[name="preferred_service"]').inputValue(), 'planning')
    assert.match(await page.locator('[name="subject"]').inputValue(), /Journey Planning/)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)
    console.log(`${width}px: modules, content, keyboard dropdowns, gallery, lightbox, contact handoff passed`)
  }
  for (const [id, anchor] of [['road-trip','private-road-trip'], ['signature','signature-private-journey']]) {
    await page.goto(base + '/traveler/services#' + anchor)
    await page.locator('#'+anchor).getByRole('link', {name:'Plan My Trip'}).click()
    await page.waitForURL('**/traveler/contact?service='+id)
    assert.equal(await page.locator('[name="preferred_service"]').inputValue(),id)
  }
  for (const alias of ['journey-planning','planning-support']) {
    await page.goto(base + '/traveler/contact?service='+alias)
    assert.equal(await page.locator('[name="preferred_service"]').inputValue(),'planning')
  }
  await page.goto(base + '/traveler/services#educational-cultural-journeys')
  await page.locator('#educational-cultural-journeys a').click()
  await page.waitForURL('**/traveler/contact?service=education')
  assert.equal(await page.locator('[name="preferred_service"]').inputValue(),'education')
  assert.deepEqual(errors, [])
  console.log('Services browser QA passed. No live inquiry submitted.')
} finally { await browser.close() }
