import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
test('lightweight error lookup preserves catalog recognition',()=>{
 const read=name=>JSON.parse(readFileSync(new URL('../src/i18n/'+name,import.meta.url)))
 assert.deepEqual(read('source-keys.json'),Object.keys(read('zh.json')))
})
