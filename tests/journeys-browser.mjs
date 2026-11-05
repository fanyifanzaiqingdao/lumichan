import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const base=process.env.TEST_URL||'http://127.0.0.1:5193'
const seed=JSON.parse(await readFile('public/api/data/journeys.json','utf8'))
const homepage=JSON.parse(await readFile('public/api/data/homepage.json','utf8'))
const browser=await chromium.launch({channel:'chrome',headless:true})
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 let payload=null,failSubmission=false
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname;if(!path.endsWith('.php'))return route.continue()
  if(path.endsWith('/inquiry.php')) {payload=route.request().postDataJSON();return route.fulfill({status:failSubmission?500:200,json:failSubmission?{ok:false,error:'Could not save inquiry'}:{ok:true,inquiry_id:'journey-test'}})}
  return route.fulfill({json:path.endsWith('/journeys.php')?{ok:true,page:seed}:path.endsWith('/homepage.php')?{ok:true,homepage}:{ok:true,entries:[]}})
 })
 const paths=['/journeys',...seed.journeys.map(j=>'/journeys/'+j.slug)]
 for(const path of paths){
  await page.goto(base+path);await page.locator('.jv-page h1').waitFor()
  assert.equal(await page.locator('.jv-page h1').count(),1)
  if(path!='/journeys')assert.equal(await page.locator('.jv-detail > section').count(),6,'Six top-level modules '+path)
  const text=await page.locator('.jv-page').innerText()
  assert.doesNotMatch(text,/USD|RMB|\$\d|\b\d+\s*(?:days?|nights?)\b|Who It.?s For|Journey Snapshot|At a Glance/i)
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:1000})
   await page.locator('.jv-page').evaluate(async el=>{for(const img of el.querySelectorAll('img')) img.loading='eager';await Promise.all([...el.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})))})
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,'No overflow '+path+' '+width)
   const broken=await page.locator('.jv-page img').evaluateAll(images=>images.filter(img=>!img.complete||!img.naturalWidth).map(img=>img.src))
   assert.deepEqual(broken,[],'No broken images '+path)
  }
  if(path.endsWith('deep-cultural-journey')){await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/lumichan-journey-deep-mobile.png',fullPage:true})}
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/journeys/cultural-gateway');await page.locator('.jv-experience').first().waitFor()
 const card=page.locator('.jv-experience').first(),dots=card.locator('.jv-dots button')
 assert.equal(await page.locator('.jv-experience').count(),3)
 assert.equal(await page.locator('.jv-dots button').count(),12)
 await dots.nth(2).click();assert.equal(await dots.nth(2).getAttribute('aria-pressed'),'true')
 await page.mouse.click(10,90);await page.waitForTimeout(4400);assert.equal(await dots.nth(2).getAttribute('aria-pressed'),'true','Reduced motion disables autoplay')
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(4500)
 assert.equal(await dots.nth(3).getAttribute('aria-pressed'),'true','Autoplay after 4.2s')
 await card.hover();await page.waitForTimeout(4500);assert.equal(await dots.nth(3).getAttribute('aria-pressed'),'true','Hover pauses')
 await page.mouse.move(0,0);await dots.nth(1).focus();await page.waitForTimeout(4500);assert.equal(await dots.nth(3).getAttribute('aria-pressed'),'true','Focus pauses without changing selected slide')
 await card.getByRole('button',{name:'Pause slideshow',exact:true}).click();await page.mouse.click(10,90);await page.waitForTimeout(4400);assert.equal(await dots.nth(3).getAttribute('aria-pressed'),'true','Explicit pause persists')
 // Every CTA leads to the existing inquiry, with editable journey fields.
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.locator('.jv-hero .jv-actions a').first().click();await page.locator('[name=journey_id]').waitFor()
 assert.equal(await page.locator('[name=journey_id]').inputValue(),'cultural-gateway')
 await page.locator('[name=journey_name]').fill('A culture journey for our family')
 await page.locator('[name=name]').fill('Journey Test');await page.locator('[name=email]').fill('journey-test@example.invalid')
 await page.locator('[name=travelers]').fill('2');await page.locator('[name=travel_dates]').fill('Spring next year')
 await page.locator('[name=privacy_consent]').check();failSubmission=true
 await page.locator('.inquiry-form button[type=submit]').click();await page.locator('.inquiry-form [role=alert]').waitFor()
 assert.equal(payload.journey_id,'cultural-gateway');assert.equal(payload.journey_name,'A culture journey for our family');assert.equal(payload.source_page,'/journeys/cultural-gateway')
 failSubmission=false;await page.locator('.inquiry-form button[type=submit]').click();await page.locator('.inquiry-success').waitFor()
 await page.goto(base+'/traveler/journeys/chengdu-cultural-gateway?test=legacy#journey-experiences');await page.waitForURL('**/journeys/cultural-gateway?test=legacy#journey-experiences');await page.locator('.jv-page h1').waitFor()
 assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://lumichan.com.cn/journeys/cultural-gateway/')
 await page.goto(base+'/ja/journeys/deep-cultural-journey/');await page.locator('.jv-page h1').waitFor();assert.equal(await page.locator('html').getAttribute('lang'),'ja')
 await page.goto(base+'/journeys');await page.locator('.jv-page h1').waitFor();await page.setViewportSize({width:1440,height:1000});await page.locator('.jv-page').evaluate(async el=>{for(const img of el.querySelectorAll('img')) img.loading='eager';await Promise.all([...el.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})))});await page.screenshot({path:'/tmp/lumichan-journey-landing-desktop.png',fullPage:true})
 assert.deepEqual(errors,[])
 console.log('Passed Journey V7 routes, six modules, 390/1440px, images, slideshow accessibility, prefilled inquiry and success/failure, legacy URLs and locale routes.')
} finally {await browser.close()}
