import assert from 'node:assert/strict'
import { mkdtemp, mkdir, cp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
const root=await mkdtemp(join(tmpdir(),'lumichan-translations-'))
const port=await new Promise(resolvePort=>{const socket=createServer().listen(0,'127.0.0.1',()=>{const p=socket.address().port;socket.close(()=>resolvePort(p))})})
await mkdir(join(root,'api/data'),{recursive:true})
for(const name of ['_lib.php','_translations.php','translations.php','admin-translations.php','admin-auth.php']) await cp(resolve('public/api',name),join(root,'api',name))
for(const name of ['homepage.json','services-page.json','locales.json'])await cp(resolve('public/api/data',name),join(root,'api/data',name))
await writeFile(join(root,'api/config.php'),"<?php return ['admin_password'=>'isolated-translation-test','admin_ip_allowlist'=>[]];")
const server=spawn('php',['-S',`127.0.0.1:${port}`,'-t',root],{stdio:'ignore'})
let cookie='';const url=`http://127.0.0.1:${port}/api/`
async function request(file,method='GET',body,csrf){const response=await fetch(url+file,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})},body:body?JSON.stringify(body):undefined});const setCookie=response.headers.get('set-cookie');if(setCookie)cookie=setCookie.split(';')[0];return{status:response.status,data:await response.json()}}
try{
 for(let i=0;i<30;i++){try{await fetch(url+'translations.php');break}catch{await new Promise(r=>setTimeout(r,80))}}
 assert.equal((await request('admin-translations.php')).status,401)
 assert.deepEqual((await request('translations.php')).data.entries,[])
 assert.equal((await request('admin-auth.php?action=login','POST',{password:'isolated-translation-test'})).status,200)
 const initial=await request('admin-translations.php');assert.equal(initial.status,200);assert.ok(initial.data.inventory.some(e=>e.path==='homepage.hero.title'))
 const entries=[{source:'A new CMS headline',en:'A revised English headline',zh:'新增中文标题',ja:'日本語の見出し',es:'Título en español','zh-TW':'繁體中文標題',ko:'한국어 제목',fr:'Titre français',de:'Deutscher Titel',it:'Titolo italiano',enabled:true},{source:'Hidden override',en:'Hidden English',zh:'未启用文案',enabled:false}]
 assert.equal((await request('admin-translations.php','PUT',{entries})).status,403)
 assert.equal((await request('admin-translations.php','PUT',{entries},'wrong')).status,403)
 const csrf=initial.data.csrf
 assert.equal((await request('admin-translations.php','PUT',{entries},csrf)).status,200)
 assert.deepEqual((await request('admin-translations.php')).data.entries,entries)
 assert.deepEqual((await request('translations.php')).data.entries,[entries[0]])
 for(const invalid of [[entries[0],entries[0]],[{...entries[0],source:''}],[{...entries[0],enabled:'true'}],[{...entries[0],zh:'x'.repeat(24001)}],[{...entries[0],unexpected:'field'}],[{...entries[0],ja:123}]])assert.equal((await request('admin-translations.php','PUT',{entries:invalid},csrf)).status,400)
 assert.deepEqual((await request('translations.php')).data.entries,[entries[0]],'Rejected writes must not change saved copy')
 console.log('Passed: isolated bilingual CMS auth, CSRF, save/read, enabled filtering and payload validation. No real configuration or database accessed.')
}finally{server.kill();await new Promise(resolve=>server.once('exit',resolve));await rm(root,{recursive:true,force:true})}
