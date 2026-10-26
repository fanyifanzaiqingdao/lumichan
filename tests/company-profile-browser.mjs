import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.TEST_URL || 'http://127.0.0.1:5191'
const output = '/tmp/lumichan-company-profile-qa'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
try {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(base + '/traveler/about')
    await page.getByRole('heading', { name: 'Lumichan', exact: true, level: 1 }).waitFor()
    assert.equal(await page.getByRole('heading', { name: 'Jason Li', exact: true }).count(), 1)
    assert.equal(await page.getByText('Jason Lee', { exact: true }).count(), 0)
    assert.equal(await page.locator('.about-member').count(), 6, 'existing unmentioned team member is preserved')
    assert.equal(await page.locator('.about-partner-steps li').count(), 6)
    assert.equal(await page.locator('#partnerships .about-facts-grid--three article').count(), 3)
    assert.match(await page.locator('.about-destinations').innerText(), /not confirmed departures/)
    for (const image of await page.locator('.about-page img').all()) {
      await image.scrollIntoViewIfNeeded()
      await image.evaluate((img) => img.decode())
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)
    await page.locator('#partnerships').screenshot({ path: `${output}/partnerships-${width}.png`, style: '.site-header, .support-launcher { visibility: hidden !important; }' })
    if (width === 1440) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.screenshot({ path: `${output}/about-desktop.png`, fullPage: true })
    }
    await page.getByRole('link', { name: 'Discuss a partnership' }).click()
    await page.waitForURL('**/traveler/contact')
    assert.equal(await page.locator('[name="subject"]').inputValue(), 'B2B partnership inquiry')
    assert.equal(await page.getByText('lumichan_china', { exact: true }).count(), 1)
    assert.equal(await page.locator('.contact-page a[href*="wa.me"]').count(), 0)
    assert.equal(await page.locator('.contact-page a[href="#"]').count(), 0)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)
  }
  await page.getByRole('link', { name: 'Travel Partnerships', exact: true }).click()
  await page.waitForURL('**/traveler/about#partnerships')
  await page.locator('#partnerships').waitFor()
  await page.waitForFunction(() => {
    const heading = document.querySelector('#partnerships h2').getBoundingClientRect()
    const header = document.querySelector('.site-header').getBoundingClientRect()
    return heading.top >= header.bottom && heading.top < innerHeight
  })
  assert.deepEqual(errors, [])
  console.log('Company profile QA passed: four viewport sizes, team, destinations, partnerships, images, contact handoff, WeChat and disabled WhatsApp. No forms submitted.')
} finally { await browser.close() }
