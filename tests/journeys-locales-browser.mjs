import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {LOCALES} from '../src/i18n/locales.js'
import {localizedPath} from '../src/i18n/routes.js'
import {selectLanguage} from './locale-helpers.mjs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const base=process.env.TEST_URL||'http://127.0.0.1:5191'
const seed=JSON.parse(await readFile('public/api/data/journeys.json','utf8')),homepage=JSON.parse(await readFile('public/api/data/homepage.json','utf8'))
const browser=await chromium.launch({channel:'chrome',headless:true})
try{
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname;if(!path.endsWith('.php'))return route.continue();return route.fulfill({json:path.endsWith('/journeys.php')?{ok:true,page:seed}:path.endsWith('/homepage.php')?{ok:true,homepage}:{ok:true,entries:[]}})})
 for(const locale of LOCALES){
  const dictionary=JSON.parse(await readFile(`src/i18n/${locale.code}.json`,'utf8'))
  for(const entry of [{slug:'',title:seed.landing.title},...seed.journeys]){
   await page.goto(base+localizedPath('/journeys'+(entry.slug?'/'+entry.slug:''),locale.code));await page.locator('.jv-page h1').waitFor()
   assert.equal(await page.locator('html').getAttribute('lang'),locale.html)
   assert.equal(await page.locator('.jv-page h1').textContent(),dictionary[entry.title]||entry.title,'Localized H1 '+locale.code+' '+entry.slug)
   for(const width of [390,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,'Overflow '+locale.code+' '+entry.slug)}
  }
 }
 await page.goto(base+'/journeys/deep-cultural-journey');await page.locator('.jv-hero .jv-actions a').first().click();await page.locator('[name=journey_name]').fill('Keep my personal journey name')
 await selectLanguage(page,'zh');assert.equal(await page.locator('[name=journey_name]').inputValue(),'Keep my personal journey name','Language switch preserves edited prefill')
 assert.equal(await page.locator('[name=journey_id]').inputValue(),'deep-cultural-journey')
 // A successful CMS response with a draft must hide it, instead of falling back to seed.
 await page.route('**/api/journeys.php',route=>route.fulfill({json:{ok:true,page:{...seed,journeys:seed.journeys.filter(j=>j.slug!=='deep-cultural-journey')}}}))
 await page.goto(base+'/journeys/deep-cultural-journey');await page.locator('.jv-not-found').waitFor();await page.waitForFunction(()=>document.querySelector('meta[name=robots]').content==='noindex,nofollow')
 assert.deepEqual(errors,[])
 console.log('Passed: all four Journey pages in nine locales, 390/1440px layouts, editable prefill retained across language switch and unpublished Journey hidden.')
}finally{await browser.close()}
