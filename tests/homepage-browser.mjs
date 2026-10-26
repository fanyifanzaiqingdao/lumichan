import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import homepage from '../src/data/homepage.js'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.TEST_URL || 'http://127.0.0.1:5191'
const output = process.env.QA_OUTPUT || '/tmp/lumichan-v3-qa'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const report = []

try {
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(base + '/traveler')
    await page.locator('.service-feature').first().waitFor()
    await page.locator('.service-feature__visual img').first().waitFor()
    for (const image of await page.locator('.home img:visible').all()) {
      await image.scrollIntoViewIfNeeded()
      await image.evaluate((img) => img.decode())
    }
    await page.evaluate(() => document.fonts.ready)
    const metrics = await page.evaluate(() => {
      const first = document.querySelector('.service-feature')
      const second = document.querySelectorAll('.service-feature')[1]
      const bounds = (selector, element = document) => element.querySelector(selector).getBoundingClientRect()
      return {
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        container: bounds('#services .section').width,
        imageWidth: bounds('.service-feature__visual', first).width,
        imageHeight: bounds('.service-feature__visual', first).height,
        firstImageLeft: bounds('.service-feature__visual', first).x < bounds('.service-feature__copy', first).x,
        secondImageRight: bounds('.service-feature__visual', second).x > bounds('.service-feature__copy', second).x,
        processColumns: getComputedStyle(document.querySelector('.home-timeline')).gridTemplateColumns.split(' ').length,
        h1Size: getComputedStyle(document.querySelector('.home h1')).fontSize,
        h2Size: getComputedStyle(document.querySelector('.home h2')).fontSize,
        h2Weight: getComputedStyle(document.querySelector('.home h2')).fontWeight,
        processHeadingColor: getComputedStyle(document.querySelector('.home-timeline h3')).color,
        refundSize: getComputedStyle(document.querySelector('.booking-policy--summary dd')).fontSize,
        refundFont: getComputedStyle(document.querySelector('.booking-policy--summary dd')).fontFamily,
        refundWeight: getComputedStyle(document.querySelector('.booking-policy--summary dd')).fontWeight,
        formBackground: getComputedStyle(document.querySelector('.inquiry-form')).backgroundColor,
        inputBackground: getComputedStyle(document.querySelector('.inquiry-form input[name="name"]')).backgroundColor,
        inputColor: getComputedStyle(document.querySelector('.inquiry-form input[name="name"]')).color,
        fonts: [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family),
      }
    })
    assert.equal(metrics.scrollWidth, width, 'No horizontal overflow at ' + width)
    assert.equal(metrics.container, ({ 320: 280, 390: 350, 768: 720, 1440: 1280, 1920: 1600 })[width])
    assert.equal(metrics.processColumns, width >= 980 ? 3 : width >= 768 ? 2 : 1)
    assert.equal(metrics.h2Weight, '700')
    assert.equal(metrics.processHeadingColor, 'rgb(15, 23, 32)')
    assert.match(metrics.refundFont, /DM Sans/)
    assert.equal(metrics.refundWeight, '600')
    assert.equal(metrics.formBackground, 'rgb(21, 28, 38)')
    assert.equal(metrics.inputBackground, 'rgb(11, 16, 23)')
    assert.equal(metrics.inputColor, 'rgb(245, 241, 232)')
    for (const font of ['DM Sans', 'Manrope', 'Playfair Display']) assert.ok(metrics.fonts.includes(font))
    if (width < 768) {
      assert.equal(metrics.imageHeight, 255)
      assert.equal(metrics.h1Size, '34px')
      assert.equal(metrics.refundSize, '28px')
    } else {
      assert.equal(metrics.firstImageLeft, true)
      assert.equal(metrics.secondImageRight, width >= 980)
    }
    assert.equal(await page.locator('.home-timeline > li').count(), 6)
    assert.equal(await page.locator('#how video, #how img').count(), 0)
    assert.equal(await page.locator('.booking-policy--summary dd').count(), 4)
    assert.equal(await page.locator('.review-preview').count(), 3)
    assert.doesNotMatch(await page.locator('#services').innerText(), /80%|60%|40%|Partial refund|No refund/)
    if ([390, 1440].includes(width)) {
      await page.locator('#services').screenshot({ path: output + '/services-' + width + '.png' })
      await page.locator('#how').screenshot({ path: output + '/process-' + width + '.png' })
      await page.locator('#reviews').screenshot({ path: output + '/reviews-' + width + '.png' })
      await page.locator('#inquiry').screenshot({ path: output + '/inquiry-' + width + '.png' })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: output + '/homepage-' + width + '.png', fullPage: true })
    }
    report.push(metrics)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  for (const service of homepage.services) {
    await page.locator('.service-feature__actions .btn').nth(homepage.services.indexOf(service)).click()
    await page.waitForFunction((title) => document.querySelector('[name="preferred_service"]')?.value === title, service.title)
    assert.equal(await page.locator('.inquiry-preferences').getAttribute('open'), '')
    await page.waitForFunction(() => document.activeElement?.name === 'name')
  }
  let submitted
  let failSubmission = true
  await page.route('**/api/inquiry.php', (route) => {
    submitted = route.request().postDataJSON()
    return failSubmission
      ? route.fulfill({ status: 503, json: { ok: false, error: 'Please try again.' } })
      : route.fulfill({ json: { ok: true, inquiry_id: 'browser-test-not-stored' } })
  })
  await page.locator('[name="name"]').fill('QA Traveler')
  await page.locator('[name="email"]').fill('qa@example.test')
  await page.locator('[name="travelers"]').fill('2')
  await page.locator('[name="travel_dates"]').fill('May 2027')
  await page.locator('[name="privacy_consent"]').check()
  await page.locator('.inquiry-form__submit').click()
  assert.match(await page.locator('#error-travelers').innerText(), /six/)
  assert.equal(submitted, undefined)
  await page.locator('[name="travelers"]').fill('6')
  await page.locator('.inquiry-form__submit').click()
  await page.locator('.inquiry-server-error').waitFor()
  assert.equal(await page.locator('.inquiry-success').count(), 0)
  await page.locator('.inquiry-form').screenshot({ path: output + '/inquiry-error-mobile.png' })
  failSubmission = false
  await page.locator('.inquiry-form__submit').click()
  await page.locator('.inquiry-success').waitFor()
  assert.equal(submitted.preferred_service, 'Educational & Cultural Journeys')
  assert.equal(submitted.travelers, 6)
  await page.locator('.inquiry-form').screenshot({ path: output + '/inquiry-success-mobile.png' })
  await page.locator('.faq-item button').nth(1).focus()
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('.faq-item button').nth(1).getAttribute('aria-expanded'), 'true')

  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(base + homepage.services[3].href)
    await page.locator('.service-detail .booking-policy').first().waitFor()
    assert.equal(await page.locator('.service-detail .booking-policy').count(), 4)
    for (let i = 0; i < 4; i++) assert.equal(await page.locator('.service-detail').nth(i).locator('.booking-policy dd').count(), [3, 4, 4, 5][i])
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)
    assert.equal(await page.locator('li').getByText('Travel insurance included', { exact: true }).count(), 2)
    assert.equal(await page.getByRole('heading', { name: 'Your journey may include', exact: true }).count(), 1)
    assert.equal(await page.getByRole('heading', { name: 'Programs may include', exact: true }).count(), 1)
    assert.equal(await page.locator('.booking-policy dd').first().evaluate((el) => getComputedStyle(el).fontWeight), '600')
    if (width === 390) await page.locator('.service-detail').last().screenshot({ path: output + '/education-policy-mobile.png' })
    await page.goto(base + '/traveler/booking-terms')
    await page.locator('#service-policies .booking-policy-text').first().waitFor()
    assert.equal(await page.locator('#service-policies li').count(), 16)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)
  }

  // Exercise CMS controls with intercepted API calls; never write to live content.
  let saved
  await page.route('**/api/admin-auth.php*', (route) => route.fulfill({ json: { ok: true, logged_in: true } }))
  await page.route('**/api/admin-homepage.php', (route) => {
    if (route.request().method() === 'PUT') saved = route.request().postDataJSON().homepage
    return route.fulfill({ json: { ok: true, homepage: saved || homepage } })
  })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(base + '/admin')
  await page.locator('.admin-homepage-editor').waitFor()
  await page.getByLabel('priceNote', { exact: true }).first().fill('QA price note')
  await page.getByLabel('imageFocalPoint', { exact: true }).first().fill('40% 60%')
  await page.getByLabel('发布服务图片', { exact: true }).first().uncheck()
  await page.getByRole('button', { name: /保存首页/ }).first().click()
  await page.getByText('配置已保存', { exact: true }).waitFor()
  assert.equal(saved.services[0].priceNote, 'QA price note')
  assert.equal(saved.services[0].imageFocalPoint, '40% 60%')
  assert.equal(saved.services[0].media.published, false)
  assert.deepEqual(saved.services[3].bookingPolicy.refundSteps, homepage.services[3].bookingPolicy.refundSteps)
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: '下载报价模板（使用已保存的政策）' }).last().click()
  const download = await downloadEvent
  const quote = await readFile(await download.path(), 'utf8')
  assert.ok(quote.includes('Departure day: No refund*'))
  assert.ok(quote.includes(homepage.bookingPolicyVersion))

  const imageRequests = []
  saved.services[0].image = '/uploads/unpublished-qa.jpg'
  page.on('request', (request) => { if (request.resourceType() === 'image') imageRequests.push(request.url()) })
  await page.route('**/api/homepage.php', (route) => route.fulfill({ json: { ok: true, homepage: saved } }))
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    imageRequests.length = 0
    await page.goto(base + '/traveler')
    await page.locator('.service-feature--text-only').waitFor()
    assert.equal(await page.locator('.service-feature').first().locator('img').count(), 0)
    await page.locator('.service-feature').first().screenshot({ path: output + '/unpublished-service-' + width + '.png' })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)
    assert.equal(imageRequests.some((url) => url.includes('unpublished-qa.jpg')), false)
  }
  saved.services[0].image = homepage.services[0].image
  await page.goto(base + '/admin')
  await page.locator('.admin-homepage-editor').waitFor()
  await page.getByLabel('发布服务图片', { exact: true }).first().check()
  await page.getByRole('button', { name: /保存首页/ }).first().click()
  await page.getByText('配置已保存', { exact: true }).waitFor()
  assert.equal(saved.services[0].media.published, true)
  await page.goto(base + '/traveler')
  await page.locator('.service-feature__visual img').first().waitFor()
  assert.equal(await page.locator('.service-feature').first().locator('img').count(), 1)
  await page.goto(base + '/admin')
  await page.locator('.admin-homepage-editor').waitFor()
  await page.locator('.admin-home-card').filter({ has: page.getByRole('heading', { name: '服务卡片', exact: true }) }).getByLabel('图片路径', { exact: true }).first().fill(homepage.services[1].image)
  assert.equal(await page.getByLabel('发布服务图片', { exact: true }).first().isChecked(), false)
  assert.equal(await page.getByLabel('图片来源', { exact: true }).first().inputValue(), '')
  assert.equal(await page.getByLabel('图片授权记录', { exact: true }).first().inputValue(), '')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ passed: true, viewports: report, screenshots: output, interactions: 'four preselected services, education validation, mocked inquiry failure/retry, keyboard FAQ, service/terms schedules and conditional copy, mocked CMS save and quotation download, image unpublish/republish/replacement reset' }, null, 2))
} finally {
  await browser.close()
}
