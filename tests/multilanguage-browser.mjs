import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {LOCALES} from '../src/i18n/locales.js'
import {localizedPath,canonicalPath} from '../src/i18n/routes.js'
import {selectLanguage} from './locale-helpers.mjs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const base=process.env.TEST_URL||'http://127.0.0.1:5193'
const homepage=JSON.parse(await readFile('public/api/data/homepage.json','utf8')),services=JSON.parse(await readFile('public/api/data/services-page.json','utf8'))
const browser=await chromium.launch({channel:'chrome',headless:true})
try{
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[],languageRequests=[]
 page.on('pageerror',e=>errors.push(e.message))
 page.on('request',r=>{if(/\/(?:ja|es|zh-TW|ko|fr|de|it)-[^/]+\.js/.test(r.url()))languageRequests.push(r.url())})
 await page.route('**/api/**',route=>route.fulfill({json:new URL(route.request().url()).pathname.endsWith('/homepage.php')?{ok:true,homepage}:new URL(route.request().url()).pathname.endsWith('/services-page.php')?{ok:true,page:services}:{ok:true,entries:[]}}))
 await page.goto(base+'/?utm_source=locale-test#inquiry')
 await page.locator('input[name=name]').fill('Language-switch draft')
 assert.equal(languageRequests.length,0,'Do not load seven extra catalogs for an English visitor')
 for(const locale of LOCALES){
  await selectLanguage(page,locale.code)
  await page.waitForURL(base+localizedPath('/?utm_source=locale-test#inquiry',locale.code))
  assert.equal(await page.locator('input[name=name]').inputValue(),'Language-switch draft')
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://lumichan.com.cn'+canonicalPath('/',locale.code))
  assert.equal(await page.locator('link[hreflang]').count(),LOCALES.length+1)
  const expected=locale.code==='en'?homepage.hero.title:JSON.parse(await readFile(`src/i18n/${locale.code}.json`,'utf8'))[homepage.hero.title]
  assert.equal((await page.locator('h1').innerText()).replace(/\s+/g,' '),expected.replace(/\s+/g,' '))
  await page.reload();await page.locator('h1').waitFor()
  assert.equal(await page.locator('html').getAttribute('lang'),locale.html)
  await page.locator('input[name=name]').fill('Language-switch draft')
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:900})
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,'Overflow '+locale.code+' '+width)
   const boxes=await page.locator('.site-header .brand,.site-header .header-cta,.language-switcher,.nav-toggle').evaluateAll(elements=>elements.filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right}}))
   for(let i=1;i<boxes.length;i++)assert.ok(boxes[i].left>=boxes[i-1].right-1,'Header overlap '+locale.code+' '+width)
  }
 }
 await page.locator('.language-trigger').click()
 assert.equal(await page.getByRole('menuitemradio').count(),9)
 await page.keyboard.press('Home');assert.equal(await page.getByRole('menuitemradio',{name:'English',exact:true}).evaluate(el=>el===document.activeElement),true)
 await page.keyboard.press('End');assert.equal(await page.getByRole('menuitemradio',{name:'Italiano',exact:true}).evaluate(el=>el===document.activeElement),true)
 await page.keyboard.press('Escape');assert.equal(await page.locator('.language-trigger').getAttribute('aria-expanded'),'false')
 await page.goto(base+'/de/traveler/services/');await page.locator('h1').waitFor();assert.equal(await page.locator('html').getAttribute('lang'),'de')
 assert.equal(await page.locator('link[hreflang="ja"]').getAttribute('href'),'https://lumichan.com.cn/ja/traveler/services/')
 await page.goto(base+'/ja/traveler/contact/?service=road-trip');await page.locator('[name=preferred_service]').waitFor({state:'attached'});assert.equal(await page.locator('[name=preferred_service]').inputValue(),'road-trip')
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/ja/');await page.locator('h1').waitFor();await page.screenshot({path:'/tmp/lumichan-nine-languages-mobile.png'})
 await page.locator('.language-trigger').click();await page.screenshot({path:'/tmp/lumichan-nine-languages-menu.png'})
 assert.deepEqual(errors,[])
 console.log('Passed: nine languages, direct URLs, refresh, drafts, query/hash, lazy catalogs, nine-way hreflang, menu keyboard controls and 320–1440px layouts.')
}finally{await browser.close()}
