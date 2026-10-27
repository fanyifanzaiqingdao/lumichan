import assert from 'node:assert/strict'
import { mkdtemp, cp, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
const folder=await mkdtemp(join(tmpdir(),'lumichan-services-api-'))
const port=await new Promise(resolvePort=>{const s=createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolvePort(p))})})
await cp(resolve('public/api'),join(folder,'api'),{recursive:true,filter:source=>!['config.php','homepage.live.json','services-page.live.json'].includes(source.split('/').at(-1)) && !source.endsWith('.jsonl')})
await writeFile(join(folder,'api/config.php'),"<?php return ['admin_password'=>'local-service-test-only','to_email'=>'test@example.invalid','send_mail'=>false,'save_to_file'=>true,'max_per_hour_per_ip'=>100,'admin_ip_allowlist'=>[]];")
const server=spawn('php',['-S',`127.0.0.1:${port}`,'-t',folder],{stdio:'ignore'})
const base=`http://127.0.0.1:${port}/api/`
let cookie=''
async function request(path,method='GET',body,csrf) {
 const response=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})},body:body?JSON.stringify(body):undefined})
 const next=response.headers.get('set-cookie');if(next)cookie=next.split(';')[0]
 return {status:response.status,data:await response.json()}
}
try {
 for(let attempt=0;attempt<30;attempt++){try{await fetch(base+'services-page.php');break}catch{await new Promise(r=>setTimeout(r,100))}}
 assert.equal((await request('admin-services-page.php')).status,401)
 assert.equal((await request('admin-auth.php?action=login','POST',{password:'local-service-test-only'})).status,200)
 const initial=await request('admin-services-page.php');assert.equal(initial.status,200)
 const csrf=initial.data.csrf;const seed=initial.data.page
 assert.equal((await request('admin-services-page.php','PUT',{page:seed})).status,403)
 const changed=structuredClone(seed);changed.modules[0].title='Saved services test';changed.modules[1].visible=false;changed.modules[2].order=20
 assert.equal((await request('admin-services-page.php','PUT',{page:changed},csrf)).status,200)
 assert.equal((await request('services-page.php')).data.page.modules[0].title,'Saved services test')
 const reject=async modify=>{const page=structuredClone(seed);modify(page);assert.equal((await request('admin-services-page.php','PUT',{page},csrf)).status,400)}
 await reject(p=>p.modules[0].ctaUrl='javascript:alert(1)')
 await reject(p=>p.modules[0].ctaUrl='//outside.invalid')
 await reject(p=>p.modules[0].ctaUrl='/traveler/\\outside.invalid')
 await reject(p=>p.modules[0].visible='false')
 await reject(p=>p.modules[0].image.alt='')
 await reject(p=>p.gallery[0].src='data:image/svg+xml,<svg/>')
 await reject(p=>p.gallery[0].focalPoint='999% 0%')
 await reject(p=>p.services[0].included={bad:true})
 await reject(p=>p.modules[1].items=[null])
 await reject(p=>p.services[0].anchor='old-links-break')
 await reject(p=>p.modules[1].id='hero')
 const draft={text:'A verified test review',source:'private source record',permission:'private signed permission',displayName:'Test traveler',status:'draft',verified:false,aiSample:false,image:{src:'',alt:'',focalPoint:'50% 50%',aiGenerated:false,authorized:false,licenseRecord:'',published:true}}
 await reject(p=>p.reviews=[{...draft,status:'published'}])
 await reject(p=>p.reviews=[{...draft,aiSample:true}])
 const published={...draft,status:'published',verified:true,image:{...draft.image,src:'/images/test.jpg',alt:'Authorized traveler photograph',authorized:true,licenseRecord:'private photo consent'}}
 await reject(p=>p.reviews=[{...published,image:{...published.image,aiGenerated:true}}])
 const valid=structuredClone(seed);valid.reviews=[draft,published]
 assert.equal((await request('admin-services-page.php','PUT',{page:valid},csrf)).status,200)
 const publicPage=(await request('services-page.php')).data.page
 assert.equal(publicPage.reviews.length,1)
 assert.ok(!JSON.stringify(publicPage).includes('private source record'))
 assert.ok(!JSON.stringify(publicPage).includes('private signed permission'))
 assert.ok(!JSON.stringify(publicPage).includes('private photo consent'))
 const contact={name:'Local QA',email:'qa@example.invalid',subject:'Service inquiry',message:'Local fixture test only',preferred_service:'road-trip'}
 assert.equal((await request('contact.php','POST',{...contact,preferred_service:'invalid-service'})).status,400)
 assert.equal((await request('contact.php','POST',contact)).status,200)
 const records=(await readFile(join(folder,'api/data/submissions.jsonl'),'utf8')).trim().split('\n').map(JSON.parse)
 assert.equal(records.at(-1).preferred_service,'road-trip')
 assert.equal(records.at(-1).preferred_service_title,'Private Road Trip')
 console.log('Services API QA passed: auth, CSRF, save/read, malformed payloads, unsafe links, review approvals, consent redaction, contact service persistence. Only temporary fixture data used.')
}finally{server.kill('SIGTERM');await new Promise(resolveExit=>server.once('exit',resolveExit));await rm(folder,{recursive:true,force:true})}
