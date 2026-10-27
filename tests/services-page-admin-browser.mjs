import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const seed=JSON.parse(await readFile('public/api/data/services-page.json','utf8'))
const homepage=JSON.parse(await readFile('public/api/data/homepage.json','utf8'))
const browser=await chromium.launch({channel:'chrome',headless:true})
const page=await browser.newPage({viewport:{width:1440,height:1000}})
let saved=structuredClone(seed)
const errors=[]
page.on('pageerror',e=>errors.push(e.message))
await page.route('**/api/admin-*.php*',async route=>{
 const path=new URL(route.request().url()).pathname
 let payload={ok:true}
 if(path.endsWith('admin-auth.php'))payload.logged_in=true
 if(path.endsWith('admin-homepage.php'))payload.homepage=homepage
 if(path.endsWith('admin-products.php'))payload.products=[]
 if(path.endsWith('admin-guides.php')){payload.guides=[];payload.counts={all:0,pending:0}}
 if(path.endsWith('admin-leads.php')){payload.leads=[];payload.keywords=[];payload.search_links=[]}
 if(path.endsWith('admin-services-page.php')){
  if(route.request().method()==='PUT'){
   assert.equal(route.request().headers()['x-csrf-token'],'test-csrf')
   saved=route.request().postDataJSON().page
  }
  payload={ok:true,page:saved,csrf:'test-csrf'}
 }
 await route.fulfill({json:payload})
})
try {
 await page.goto('http://127.0.0.1:5191/admin')
 await page.getByRole('button',{name:'Services 页面',exact:true}).click()
 await page.getByRole('heading',{name:'Services 二级页面配置'}).waitFor()
 const hero=page.locator('.admin-service-module').filter({has:page.locator('summary', {hasText:'Travel Your Way.'})})
 await hero.locator(':scope > summary').click()
 await hero.getByLabel('标题',{exact:true}).fill('Updated service title')
 const images=page.locator('.admin-service-module').filter({has:page.locator(':scope > summary',{hasText:'图片 1：'})})
 await images.locator(':scope > summary').click()
 await images.getByLabel('已有正式展示授权',{exact:true}).check()
 await images.getByLabel('素材来源／授权记录',{exact:true}).fill('Sample authorization')
 await images.getByLabel('图片路径',{exact:true}).fill('/images/new.jpg')
 assert.equal(await images.getByLabel('已有正式展示授权',{exact:true}).isChecked(),false)
 assert.equal(await images.getByLabel('素材来源／授权记录',{exact:true}).inputValue(),'')
 await page.getByRole('button',{name:'保存服务页配置',exact:true}).click()
 await page.getByRole('status').filter({hasText:'服务页配置已保存'}).waitFor()
 assert.equal(saved.modules[0].title,'Updated service title')
 await page.reload()
 await page.getByRole('button',{name:'Services 页面',exact:true}).click()
 await page.getByRole('heading',{name:'Services 二级页面配置'}).waitFor()
 await page.locator('.admin-service-module > summary').filter({hasText:'Updated service title'}).waitFor()
 assert.equal(await page.locator('.admin-service-module > summary').filter({hasText:'Updated service title'}).count(),1)
 await page.getByRole('button',{name:'编辑共用价格与政策',exact:true}).click()
 await page.getByText('首页表单配置',{exact:true}).waitFor()
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000})
  await page.getByRole('button',{name:'Services 页面',exact:true}).click()
  await page.getByRole('heading',{name:'Services 二级页面配置'}).waitFor()
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width)
 }
 assert.deepEqual(errors,[])
 console.log('Services admin UI QA passed: edit, CSRF save, reload, changed-image permission reset, shared-price editor and mobile width. All admin API writes mocked.')
}finally{await browser.close()}
