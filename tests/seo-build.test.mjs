import {LOCALES} from '../src/i18n/locales.js'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile,access} from 'node:fs/promises'
import {PUBLIC_PATHS,canonicalPath} from '../src/i18n/routes.js'
import {sitemap} from '../scripts/seo-build.mjs'
test('sitemap pairs all language URLs with reciprocal and self-referencing alternates',()=>{
 const xml=sitemap();assert.equal((xml.match(/<url>/g)||[]).length,PUBLIC_PATHS.length*LOCALES.length)
 for(const path of PUBLIC_PATHS)for(const {code:lang} of LOCALES)assert.ok(xml.includes(`<loc>https://lumichan.com.cn${canonicalPath(path,lang)}</loc>`))
 assert.ok(!xml.includes('<loc>https://lumichan.com.cn/traveler</loc>'))
 assert.equal((xml.match(/hreflang="x-default"/g)||[]).length,PUBLIC_PATHS.length*LOCALES.length)
})
test('built HTML has the correct language and canonical before JavaScript',async()=>{
 for(const root of ['dist','dist-dev'])for(const path of PUBLIC_PATHS)for(const {code:language,html:htmlLanguage} of LOCALES){
  const localized=canonicalPath(path,language)
  const html=await readFile(`${root}${localized.replace(/\/$/,'')}/index.html`,'utf8')
  assert.ok(html.includes(`<html lang="${htmlLanguage}"`))
  assert.ok(html.includes(`<link rel="canonical" href="https://lumichan.com.cn${localized}"`),root+localized)
  for(const [code,lang]of [...LOCALES.map(locale=>[locale.html,locale.code]),['x-default','en']])assert.ok(html.includes(`hreflang="${code}" href="https://lumichan.com.cn${canonicalPath(path,lang)}"`))
  if(root==='dist-dev')assert.match(html,/name="robots" content="noindex,nofollow"/)
 }
 for(const path of ['admin','support'])assert.match(await readFile(`dist/${path}/index.html`,'utf8'),/name="robots" content="noindex,nofollow"/)
 await assert.rejects(access('dist-dev/sitemap.xml'))
 await assert.rejects(access('dist/api/data/translations.live.json'))
})
