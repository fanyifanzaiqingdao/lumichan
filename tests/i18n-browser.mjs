import {selectLanguage} from './locale-helpers.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.TEST_URL || 'http://127.0.0.1:5193'
const homepage = JSON.parse(await readFile(new URL('../public/api/data/homepage.json',import.meta.url)))
const services = JSON.parse(await readFile(new URL('../public/api/data/services-page.json',import.meta.url)))
const browser = await chromium.launch({ channel:'chrome', headless:true })
try {
  const page = await browser.newPage({ reducedMotion:'reduce' })
  const errors=[]; page.on('pageerror',e=>errors.push(e.message))
  let payload, startPayload
  await page.route('**/api/**',async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/inquiry.php')) { payload=route.request().postDataJSON(); return route.fulfill({json:{ok:true,inquiry_id:'local-i18n-fixture'}}) }
    if (path.endsWith('/support.php')) {
      if (route.request().method()==='POST') { startPayload=route.request().postDataJSON(); return route.fulfill({status:503,json:{ok:false,error:'local fixture only'}}) }
      return route.fulfill({json:{ok:true,settings:{enabled:true,consent_version:'fixture'}}})
    }
    return route.fulfill({json:path.endsWith('/homepage.php')?{homepage}:path.endsWith('/services-page.php')?{page:services}:{ok:true,products:[],guides:[]}})
  })
  await page.goto(base+'/traveler')
  assert.match(await page.locator('h1').innerText(),/Explore China/)
  await selectLanguage(page,'zh')
  assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN')
  assert.equal(new URL(page.url()).pathname,'/zh/')
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://lumichan.com.cn/zh/')
  assert.equal(await page.locator('link[hreflang="en"]').getAttribute('href'),'https://lumichan.com.cn/')
  assert.match(await page.locator('h1').innerText(),/深入探索中国/)
  const form=page.locator('.inquiry-form')
  await form.locator('[name=name]').fill('双语测试用户')
  await selectLanguage(page,'en')
  assert.equal(await form.locator('[name=name]').inputValue(),'双语测试用户')
  await selectLanguage(page,'zh')
  await form.locator('summary').click()
  await form.locator('[name=preferred_contact]').selectOption('WeChat')
  await form.locator('[name=contact_handle]').fill('fixture-contact')
  await form.locator('[name=preferred_service]').selectOption('Private Road Trip')
  await form.locator('[name=english_guide]').selectOption('Yes')
  await form.locator('[name=email]').fill('i18n-fixture@example.invalid')
  await form.locator('[name=travelers]').fill('2')
  await form.locator('[name=travel_dates]').fill('2027-03')
  await form.locator('[name=privacy_consent]').check()
  await form.locator('button[type=submit]').click()
  await form.locator('.inquiry-success').waitFor()
  assert.equal(payload.language,'zh')
  assert.equal(payload.preferred_contact,'WeChat')
  assert.equal(payload.preferred_service,'Private Road Trip')
  assert.equal(payload.english_guide,'Yes')
  await page.reload()
  assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN')
  for(const [path,heading] of [['/traveler/services','按你的方式旅行'],['/traveler/about','Lumichan'],['/traveler/contact','旅行咨询'],['/traveler/journeys','精选旅程'],['/traveler/itineraries','不止于看见'],['/traveler/privacy','隐私政策'],['/traveler/booking-terms','预订条款'],['/traveler/terms','使用条款'],['/traveler/careers','加入我们'],['/guide','向导']]) {
    await page.goto(base+'/zh'+path); await page.locator('h1').waitFor()
    assert.match(await page.locator('h1').innerText(),new RegExp(heading))
    if (path === '/traveler/services') {
      await selectLanguage(page,'en')
      assert.match(await page.locator('h1').innerText(),/Travel Your Way/)
      await selectLanguage(page,'zh')
      assert.match(await page.locator('h1').innerText(),/按你的方式旅行/)
    }
    assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN')
  }
  await page.goto(base+'/zh/')
  await page.getByRole('button',{name:'与 Lumichan 聊天',exact:true}).click()
  const chat=page.locator('.lc-chat-panel')
  await chat.locator('.lc-chat-check input').nth(0).check()
  await chat.getByRole('button',{name:'开始咨询'}).click()
  await chat.getByRole('alert').waitFor()
  assert.equal(startPayload.language,'zh')
  await chat.getByRole('button',{name:'关闭聊天',exact:true}).click()
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,'horizontal overflow '+width)
    const boxes=await page.locator('.site-header .brand,.site-header .header-cta,.language-switcher,.nav-toggle').evaluateAll(els=>els.filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right}}))
    for(let i=1;i<boxes.length;i++)assert.ok(boxes[i].left>=boxes[i-1].right-1,'header overlap '+width)
  }
  await page.evaluate(()=>scrollTo(0,0)); await page.screenshot({path:'/tmp/lumichan-i18n-desktop.png'})
  await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('h1').waitFor();assert.equal(await page.locator('.site-header').count(),1);await page.screenshot({path:'/tmp/lumichan-i18n-mobile.png'})
  assert.deepEqual(errors,[])
  console.log('Passed: bilingual routes, persistence, drafts, canonical form values, inquiry/chat language and 320–1440px layouts. All submissions mocked.')
} finally { await browser.close() }
