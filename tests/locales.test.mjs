import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {LOCALES} from '../src/i18n/locales.js'
import {localizedPath,pathLanguage,stripLanguage} from '../src/i18n/routes.js'
const zh=JSON.parse(await readFile('src/i18n/zh.json','utf8')),en=JSON.parse(await readFile('src/i18n/en.json','utf8'))
const sources=Object.keys({...zh,...en})
test('nine language routes round-trip and keep private/external paths unchanged',()=>{
 assert.equal(LOCALES.length,9)
 for(const locale of LOCALES){
  const path=localizedPath('/traveler/contact?service=road-trip#form',locale.code)
  assert.equal(pathLanguage(path.split('?')[0]),locale.code)
  assert.equal(stripLanguage(path.split('?')[0]),'/traveler/contact')
  assert.equal(localizedPath(path,'en'),'/traveler/contact?service=road-trip#form')
  assert.equal(localizedPath('/admin',locale.code),'/admin')
  assert.equal(localizedPath('mailto:jin.lu@lumichan.com.cn',locale.code),'mailto:jin.lu@lumichan.com.cn')
 }
})
test('every new language has all existing source strings and preserves placeholders and public contacts',async()=>{
 for(const locale of LOCALES.filter(locale=>!['en','zh'].includes(locale.code))){
  const dictionary=JSON.parse(await readFile(`src/i18n/${locale.code}.json`,'utf8'))
  for(const source of sources){
   assert.equal(typeof dictionary[source],'string',locale.code+' missing '+source)
   assert.ok(dictionary[source].trim(),locale.code+' empty '+source)
   for(const placeholder of source.match(/\{\{[^}]+\}\}/g)||[])assert.ok(dictionary[source].includes(placeholder),locale.code+' missing '+placeholder)
   for(const email of source.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g)||[])assert.ok(dictionary[source].includes(email),locale.code+' changed '+email)
  }
 }
})
test('dynamic prices and singular/plural units retain their values',async()=>{
 const {dynamicText}=await import('../src/i18n/dynamic.js')
 for(const locale of LOCALES.filter(locale=>!['en','zh'].includes(locale.code))){
  const price=dynamicText('From USD 299',locale.code,x=>x)
  assert.ok(price.includes('299')&&price.includes('USD'))
 }
 assert.equal(dynamicText('1 day','fr',x=>x),'1 jour')
 assert.equal(dynamicText('5 days','fr',x=>x),'5 jours')
 assert.equal(dynamicText('1 day','it',x=>x),'1 giorno')
 assert.equal(dynamicText('1 person','de',x=>x),'1 Person')
})
