import {selectLanguage} from './locale-helpers.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const base=process.env.TEST_URL||'http://127.0.0.1:5193'
const home=JSON.parse(await readFile(new URL('../public/api/data/homepage.json',import.meta.url)))
const browser=await chromium.launch({channel:'chrome',headless:true})
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let saved
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname
  let data={ok:true}
  if(path.endsWith('/admin-auth.php'))data.logged_in=true
  if(path.endsWith('/admin-homepage.php'))data.homepage=home
  if(path.endsWith('/homepage.php'))data.homepage={...home,hero:{...home.hero,title:'CMS unique headline'}}
  if(path.endsWith('/admin-products.php'))data.products=[]
  if(path.endsWith('/admin-guides.php'))Object.assign(data,{guides:[],counts:{all:0,pending:0,approved:0,rejected:0}})
  if(path.endsWith('/admin-leads.php'))Object.assign(data,{leads:[],keywords:[],platforms:[]})
  if(path.endsWith('/admin-inquiries.php'))data.inquiries=[]
  if(path.endsWith('/translations.php'))data.entries=saved?.entries||[]
  if(path.endsWith('/support-auth.php'))data.staff=null
  if(path.endsWith('/admin-translations.php')){
    if(route.request().method()==='PUT'){saved=route.request().postDataJSON();Object.assign(data,{entries:saved.entries})}
    else Object.assign(data,{entries:[],inventory:[{source:'CMS unique headline',path:'homepage.hero.title'}],csrf:'isolated-browser-csrf'})
  }
  if(path.endsWith('/admin-support.php'))Object.assign(data,{conversations:[],has_more:false})
  return route.fulfill({json:data})
 })
 await page.goto(base+'/admin');await page.locator('.admin-tabs').waitFor()
 assert.equal(await page.locator('h1').innerText(),'Operations Admin')
 await page.getByRole('button',{name:'Translations',exact:true}).click()
 const editor=page.locator('.translation-editor')
 await editor.getByPlaceholder('Source, translation or page field').fill('CMS unique headline')
 await editor.getByLabel('English copy',{exact:true}).fill('Custom English headline')
 await editor.getByLabel('Chinese copy',{exact:true}).fill('自定义中文标题')
 await editor.getByLabel('Translation language',{exact:true}).selectOption('fr')
 await editor.getByLabel('Français',{exact:true}).fill('Titre français personnalisé')
 await editor.getByLabel('Translation language',{exact:true}).selectOption('zh')
 assert.equal(await editor.getByLabel('Chinese copy',{exact:true}).inputValue(),'自定义中文标题')
 await editor.getByRole('button',{name:'Save translations',exact:true}).click()
 await editor.getByRole('status').filter({hasText:'Translations saved'}).waitFor()
 assert.equal(saved.entries[0].source,'CMS unique headline');assert.equal(saved.entries[0].en,'Custom English headline');assert.equal(saved.entries[0].zh,'自定义中文标题');assert.equal(saved.entries[0].enabled,true);assert.equal(saved.entries[0].fr,'Titre français personnalisé')
 await selectLanguage(page,'zh')
 assert.equal(await page.locator('h1').innerText(),'运营后台')
 assert.equal(await editor.getByLabel('中文文案',{exact:true}).inputValue(),'自定义中文标题')
 await page.getByRole('button',{name:'客户聊天记录',exact:true}).click()
 await selectLanguage(page,'en')
 await page.getByRole('heading',{name:'Customer conversations',exact:true}).waitFor()
 assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow')
 await page.screenshot({path:'/tmp/lumichan-admin-bilingual.png'})
 await page.goto(base+'/zh/')
 await page.getByRole('heading',{level:1,name:'自定义中文标题',exact:true}).waitFor()
 await page.goto(base+'/')
 await page.getByRole('heading',{level:1,name:'Custom English headline',exact:true}).waitFor()
 await page.goto(base+'/fr/')
 await page.getByRole('heading',{level:1,name:'Titre français personnalisé',exact:true}).waitFor()
 await page.goto(base+'/')
 await page.getByRole('heading',{level:1,name:'Custom English headline',exact:true}).waitFor()
 await page.goto(base+'/support')
 await page.getByRole('heading',{level:1,name:'Support Center',exact:true}).waitFor()
 assert.equal(await page.title(),'Support Center | Lumichan')
 await selectLanguage(page,'zh')
 await page.getByRole('heading',{level:1,name:'客服中心',exact:true}).waitFor()
 assert.deepEqual(errors,[])
 console.log('Passed: English/Chinese admin, translation editor fields, mocked save payload, retained edits and private noindex.')
} finally {await browser.close()}
