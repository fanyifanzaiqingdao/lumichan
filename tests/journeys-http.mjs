import assert from 'node:assert/strict'
import {mkdtemp,mkdir,cp,writeFile,rm,readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
const root=await mkdtemp(join(tmpdir(),'lumichan-journeys-'))
const port=await new Promise(r=>{const socket=createServer().listen(0,'127.0.0.1',()=>{const p=socket.address().port;socket.close(()=>r(p))})})
await mkdir(join(root,'api/data'),{recursive:true})
for(const name of ['_content_store.php','_public_content.php','_lib.php','_journeys.php','journeys.php','admin-journeys.php','admin-auth.php'])await cp(resolve('public/api',name),join(root,'api',name))
await cp(resolve('public/api/data/journeys.json'),join(root,'api/data/journeys.json'))
await writeFile(join(root,'api/config.php'),"<?php return ['admin_password'=>'isolated-journeys-test','admin_ip_allowlist'=>[]];")
const server=spawn('php',['-S',`127.0.0.1:${port}`,'-t',root],{stdio:'ignore'}),base=`http://127.0.0.1:${port}/api/`
let cookie=''
async function request(file,method='GET',body,csrf){const r=await fetch(base+file,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})},body:body?JSON.stringify(body):undefined});const c=r.headers.get('set-cookie');if(c)cookie=c.split(';')[0];return{status:r.status,data:await r.json()}}
try{
 for(let i=0;i<30;i++){try{await fetch(base+'journeys.php');break}catch{await new Promise(r=>setTimeout(r,80))}}
 assert.equal((await request('admin-journeys.php')).status,401)
 const publicSeed=await request('journeys.php');assert.equal(publicSeed.status,200);assert.equal(publicSeed.data.page.journeys.length,3);assert.ok(!JSON.stringify(publicSeed.data).includes('rightsStatus'))
 assert.equal((await request('admin-auth.php?action=login','POST',{password:'isolated-journeys-test'})).status,200)
 const initial=await request('admin-journeys.php'),page=structuredClone(initial.data.page),csrf=initial.data.csrf
 page.journeys[0].status='draft';page.landing.title='Isolated CMS title'
 assert.equal((await request('admin-journeys.php','PUT',{page})).status,403)
 assert.equal((await request('admin-journeys.php','PUT',{page},'wrong')).status,403)
 assert.equal((await request('admin-journeys.php','PUT',{page},csrf)).status,200)
 const live=await request('journeys.php');assert.equal(live.data.page.landing.title,'Isolated CMS title');assert.equal(live.data.page.journeys.length,2);assert.equal(live.data.page.landing.featured.length,2)
 assert.equal((await request('admin-journeys.php')).data.page.journeys.length,3,'Admin keeps drafts')
 const invalid=structuredClone(page);invalid.journeys[1].hero.src='javascript:alert(1)'
 assert.equal((await request('admin-journeys.php','PUT',{page:invalid},csrf)).status,400)
 assert.equal(JSON.parse(await readFile(join(root,'api/data/journeys.live.json'),'utf8')).journeys[1].hero.src,page.journeys[1].hero.src,'Invalid save never replaces live configuration')
 assert.equal((await request('journeys.php','POST',{})).status,405)
 console.log('Passed: isolated Journey HTTP auth, CSRF, atomic save/read, draft filtering, metadata projection and rejected writes; no real database or configuration accessed.')
}finally{server.kill();await new Promise(r=>server.once('exit',r));await rm(root,{recursive:true,force:true})}
