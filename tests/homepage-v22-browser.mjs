import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
const { chromium }=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base=process.env.TEST_URL || 'http://127.0.0.1:5191'
const output='/tmp/lumichan-home-v22-qa';await mkdir(output,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const page=await browser.newPage({reducedMotion:'reduce'})
const errors=[];page.on('pageerror',e=>errors.push(e.message))
let submitted
await page.route('**/api/inquiry.php',async route=>{submitted=route.request().postDataJSON();await route.fulfill({json:{ok:true,inquiry_id:'local-browser-fixture'}})})
try{
 for(const width of [320,390,768,1440,1920]){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/traveler')
  await page.locator('.service-feature--road-trip .service-feature__visual img').waitFor()
  await page.locator('.review-preview').nth(2).waitFor()
  await page.evaluate(()=>document.fonts.ready)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,`overflow ${width}`)
  assert.deepEqual(await page.locator('.service-feature').evaluateAll(elements=>elements.map(el=>el.className.match(/service-feature--(road-trip|planning|signature|education)/)[1])),['road-trip','planning','signature','education'])
  for(const [id,anchor] of [['road-trip','private-road-trip'],['planning','planning-support'],['signature','signature-private-journey']]){
   const card=page.locator('.service-feature--'+id)
   assert.equal(await card.locator('h3 a').getAttribute('href'),'/traveler/services#'+anchor)
   assert.equal(await card.locator('.service-feature__visual').getAttribute('href'),'/traveler/services#'+anchor)
  }
  assert.equal(await page.locator('.service-feature--education h3 a,.service-feature--education a.service-feature__visual').count(),0)
  assert.equal(await page.locator('.journey-card__price,.journey-card__unpriced,.journey-card__media>span').count(),0)
  assert.equal(await page.locator('.home-story-card').count(),3)
  assert.equal(await page.locator('.home-story-card img').count(),12)
  assert.equal(await page.locator('.home-story-card video,.home-story-card iframe').count(),0)
  assert.equal(await page.locator('.faq-item').count(),5)
  assert.equal(await page.locator('.home-sample-label').count(),3)
  assert.equal(await page.locator('.inquiry-preferences').getAttribute('open'),null)
  assert.equal(await page.locator('.inquiry-form>label input[required]').count(),4)
  const processColor=await page.locator('.home-process').evaluate(el=>getComputedStyle(el).backgroundColor)
  assert.equal(processColor,'rgb(21, 27, 36)')
  if(width===1440){
   const lines=await page.locator('.home-process .section-head>p:last-child').evaluate(el=>({height:el.getBoundingClientRect().height,line:parseFloat(getComputedStyle(el).lineHeight)}))
   assert.ok(lines.height<lines.line*1.5,'desktop process intro one line')
  }
  for(const img of await page.locator('.home img').all()){
   if(await img.isVisible()){await img.scrollIntoViewIfNeeded();await img.evaluate(img=>img.decode())}
  }
  if([390,1440].includes(width)){
   await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/homepage-${width}.png`,fullPage:true})
   await page.locator('.home-services').screenshot({path:`${output}/services-${width}.png`,style:'.site-header,.support-launcher{visibility:hidden!important}'})
  }
  console.log(`${width}px: homepage structure, links, stories, review labels, dark timeline, hidden prices and no overflow passed`)
 }
 await page.setViewportSize({width:390,height:1000})
 await page.locator('.inquiry-preferences>summary').click()
 await page.locator('[name=preferred_contact]').selectOption('WeChat')
 await page.locator('[name=contact_handle]').fill('local-test-account')
 await page.locator('[name=preferred_contact]').selectOption('Email')
 assert.equal(await page.locator('[name=contact_handle]').count(),0)
 await page.locator('[name=preferred_contact]').selectOption('Ins')
 assert.equal(await page.locator('[name=contact_handle]').inputValue(),'')
 await page.locator('[name=preferred_contact]').selectOption('Email')
 await page.locator('[name=name]').fill('Local QA');await page.locator('[name=email]').fill('qa@example.invalid')
 await page.locator('[name=travelers]').fill('2');await page.locator('[name=travel_dates]').fill('October 2027')
 await page.locator('[name=privacy_consent]').check();await page.locator('.inquiry-form__submit').click()
 await page.locator('.inquiry-success').waitFor();assert.equal(submitted.contact_handle,'');assert.equal(submitted.privacy_consent,true)
 await page.goto(base+'/traveler/booking-terms');await page.locator('.legal-draft-notice').waitFor();assert.match(await page.locator('.simple-page__prose').innerText(),/世纪城路198号附170号/)
 assert.equal(await page.locator('.footer-contact').getByText('No. 140, Annex of Tianfu Avenue, Chengdu High-tech Zone, Chengdu, Sichuan, China',{exact:true}).count(),1)
 assert.deepEqual(errors,[])
 console.log('Homepage V2.2 browser QA passed. Form request mocked; no live inquiry sent.')
}finally{await browser.close()}
