import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const base=process.env.TEST_URL||'http://127.0.0.1:5193'
const seed=JSON.parse(await readFile('public/api/data/journeys.json','utf8')),homepage=JSON.parse(await readFile('public/api/data/homepage.json','utf8'))
const browser=await chromium.launch({channel:'chrome',headless:true})
try{
 let saved=null;const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;if(!path.endsWith('.php'))return route.continue();let data={ok:true}
  if(path.endsWith('/admin-auth.php'))data.logged_in=true
  if(path.endsWith('/admin-homepage.php'))data.homepage=homepage
  if(path.endsWith('/admin-products.php'))data.products=[]
  if(path.endsWith('/admin-guides.php'))Object.assign(data,{guides:[],counts:{all:0,pending:0,approved:0,rejected:0}})
  if(path.endsWith('/admin-leads.php'))Object.assign(data,{leads:[],keywords:[],platforms:[]})
  if(path.endsWith('/admin-inquiries.php'))data.inquiries=[]
  if(path.endsWith('/translations.php'))data.entries=[]
  if(path.endsWith('/admin-journeys.php')){
   if(route.request().method()==='PUT'){saved=route.request().postDataJSON();assert.equal(route.request().headers()['x-csrf-token'],'mock-journey-csrf');data.page=saved.page}
   else Object.assign(data,{page:seed,csrf:'mock-journey-csrf'})
  }
  return route.fulfill({json:data})
 })
 await page.goto(base+'/admin');await page.locator('.admin-tabs').getByRole('button',{name:'Journeys CMS',exact:true}).click()
 const editor=page.locator('.journeys-editor');await editor.locator(':scope > details').first().waitFor()
 assert.equal(await editor.locator(':scope > details').count(),4,'Landing + three collapsed detail records')
 assert.equal(await editor.locator(':scope > details[open]').count(),0)
 const journey=editor.locator(':scope > details').nth(1)
 await journey.locator(':scope > summary').click()
 await journey.locator(':scope > .admin-form-grid > label textarea:not([readonly])').first().fill('Customized Cultural Gateway')
 await journey.locator(':scope > .admin-form-grid > label select').selectOption('draft')
 await editor.locator(':scope > button').click();await editor.getByRole('status').filter({hasText:'Journeys saved'}).waitFor()
 assert.equal(saved.page.journeys[0].title,'Customized Cultural Gateway');assert.equal(saved.page.journeys[0].status,'draft')
 assert.equal(saved.page.journeys[0].slug,'cultural-gateway')
 assert.equal(saved.page.journeys[0].experience.items[0].slides.length,4)
 // Saved editor must remain usable after replacing state with response.
 await journey.locator(':scope > .admin-form-grid > label select').selectOption('published')
 await page.screenshot({path:'/tmp/lumichan-journey-admin.png'})
 for(const width of [390,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,'CMS layout width '+width)}
 assert.deepEqual(errors,[])
 console.log('Passed: Journey admin tab, collapsed modules, editing, draft status, preserved slides, CSRF payload and responsive layout.')
}finally{await browser.close()}
