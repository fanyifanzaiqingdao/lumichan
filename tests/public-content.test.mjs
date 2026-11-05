import {test} from 'node:test'
import assert from 'node:assert/strict'
import {publicContent} from '../src/lib/publicContent.js'
test('coalesces CMS requests, isolates cancellation and refetches publication changes',async()=>{
 const original=globalThis.fetch;let count=0,release
 globalThis.fetch=()=>{count++;return new Promise(resolve=>{release=()=>resolve(new Response('{"ok":true}'))})}
 try {
  const controller=new AbortController()
  const a=publicContent('/api/homepage.php',{signal:controller.signal})
  const b=publicContent('/api/homepage.php');controller.abort()
  await assert.rejects(a,{name:'AbortError'});release()
  assert.deepEqual(await (await b).json(),{ok:true});assert.equal(count,1)
  const c=publicContent('/api/homepage.php');release();await c;assert.equal(count,2)
 }finally{globalThis.fetch=original}
})
