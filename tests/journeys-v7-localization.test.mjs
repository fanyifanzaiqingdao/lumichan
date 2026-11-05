import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const editor=await readFile('src/components/JourneysPageEditor.jsx','utf8')
const chinese=[...editor.matchAll(/'([^'\n]*[\u3400-\u9fff][^'\n]*)'/g)].map(m=>m[1])
const labels=editor.match(/const labels=\{([^}]+)\}/)[1]
const labelValues=[...labels.matchAll(/:\s*'([^']+)'/g)].map(m=>m[1])
const ui=['Show image','Select image','Pause slideshow','Play slideshow','All Journeys','Journey unavailable']
test('Journey CMS literals, every label value and slideshow UI are localized',async()=>{
 for(const locale of ['en','zh','ja','es','zh-TW','ko','fr','de','it']){
  const d=JSON.parse(await readFile(`src/i18n/${locale}.json`,'utf8'))
  for(const key of new Set([...chinese,...labelValues,...ui])){
   assert.ok(typeof d[key]==='string' && d[key].trim(),`${locale} missing ${key}`)
   if(['en','es','fr','de','it','ko'].includes(locale))assert.ok(!/[\u3400-\u9fff]/.test(d[key]),`${locale} untranslated Chinese: ${key}`)
  }
 }
})
