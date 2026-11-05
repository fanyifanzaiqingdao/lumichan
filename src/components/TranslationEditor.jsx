import { apiErrorMessage } from '../i18n/errors.js'
import { useEffect, useMemo, useState } from 'react'
import { t, setOverrides, getCatalog, loadLanguage, getLanguage } from '../i18n/runtime.js'
import zh from '../i18n/zh.json'
import en from '../i18n/en.json'
import { LOCALES, localeFor } from '../i18n/locales.js'
export default function TranslationEditor() {
  const [targetLanguage,setTargetLanguage]=useState(()=>getLanguage()==='en'?'zh':getLanguage()),[catalogRevision,setCatalogRevision]=useState(0),[catalogBusy,setCatalogBusy]=useState(false)
  useEffect(()=>{let active=true;setCatalogBusy(true);loadLanguage(targetLanguage).then(()=>{if(active)setCatalogRevision(v=>v+1)}).catch(()=>{}).finally(()=>{if(active)setCatalogBusy(false)});return()=>{active=false}},[targetLanguage])
  const [entries,setEntries]=useState([]), [inventory,setInventory]=useState([]), [csrf,setCsrf]=useState('')
  const [search,setSearch]=useState(''), [page,setPage]=useState(0), [status,setStatus]=useState(''), [busy,setBusy]=useState(false), [ready,setReady]=useState(false)
  useEffect(()=>{
    const controller=new AbortController()
    fetch('/api/admin-translations.php',{credentials:'include',signal:controller.signal}).then(async r=>{const data=await r.json();if(!r.ok||!data.ok)throw Error(apiErrorMessage(data.error,r.status));setEntries(data.entries);setInventory(previous=>[...previous,...(data.inventory || [])]);setCsrf(data.csrf);setReady(true)}).catch(e=>{if(e.name!=='AbortError')setStatus(e.message)})
    const collect = (node, path, key = '') => {
      const output=[]
      if (Array.isArray(node)) node.forEach((item,i)=>output.push(...collect(item,`${path}.${i}`,key)))
      else if (node && typeof node === 'object') Object.entries(node).forEach(([name,value])=>output.push(...collect(value,`${path}.${name}`,name)))
      else if (typeof node === 'string' && node.trim() && /^(title|subtitle|description|long_description|highlights|inclusions|exclusions|summary|bio|location|specialties|languages)$/.test(key)) output.push({source:node,path})
      return output
    }
    for (const type of ['products','guides']) fetch(`/api/admin-${type}.php`,{credentials:'include',signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject()).then(data=>setInventory(previous=>[...previous,...collect(data[type]||[],type)])).catch(()=>{})
    return()=>controller.abort()
  },[])
  const rows=useMemo(()=>{
    const sources=new Map([...Object.keys(zh),...Object.keys(en)].map(source=>[source,'Built-in']))
    inventory.forEach(item=>sources.set(item.source,item.path))
    entries.forEach(item=>{if(!sources.has(item.source))sources.set(item.source,'Custom')})
    const saved=new Map(entries.map(item=>[item.source,item]))
    return [...sources].map(([source,path])=>({source,path,...Object.fromEntries(LOCALES.map(locale=>[locale.code,getCatalog(locale.code)[source]||''])),enabled:true,...saved.get(source)})).filter(item=>(item.source+' '+LOCALES.map(locale=>item[locale.code]||'').join(' ')+' '+item.path).toLowerCase().includes(search.toLowerCase()))
  },[inventory,entries,search,catalogRevision,targetLanguage])
  function change(row,key,value) {
    setEntries(previous=>{const next=previous.filter(item=>item.source!==row.source);next.push({source:row.source,...Object.fromEntries(LOCALES.map(locale=>[locale.code,row[locale.code]||''])),enabled:row.enabled,[key]:value});return next});setStatus('有未保存修改')
  }
  async function save() {
    setBusy(true);setStatus('保存中…')
    try {const response=await fetch('/api/admin-translations.php',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({entries})});const data=await response.json();if(!response.ok||!data.ok)throw Error(apiErrorMessage(data.error,response.status));setEntries(data.entries);setOverrides(data.entries);setStatus('Translations saved. Refresh the website to see changes.')}catch(e){setStatus(e.message)}finally{setBusy(false)}
  }
  return <section className="admin-homepage-editor translation-editor"><h2>{t('Translations')}</h2><p>{t('Edit each language separately. Blank translations use the built-in text. Prices, links and business IDs stay unchanged.')}</p>
    <div className="admin-toolbar"><label>{t('Translation language')}<select aria-label={t('Translation language')} value={targetLanguage} onChange={event=>setTargetLanguage(event.target.value)}>{LOCALES.filter(locale=>locale.code!=='en').map(locale=><option key={locale.code} value={locale.code}>{locale.name}</option>)}</select></label><label>{t('搜索文案')}<input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder={t('原文、译文或页面字段')} /></label><button type="button" className="btn btn-gold" disabled={!ready||busy||catalogBusy} onClick={save}>{t(busy?'保存中…':'Save translations')}</button></div><p role="status">{t(status)}</p>
    {rows.slice(page*15,(page+1)*15).map(row=><fieldset key={row.source}><legend>{t(row.path)}</legend><p className="translation-source">{row.source}</p><div className="admin-form-grid"><label>{t('英文文案')}<textarea lang="en" aria-label={t('英文文案')} rows={3} value={row.en} placeholder={row.source} onChange={e=>change(row,'en',e.target.value)} /></label><label>{targetLanguage==='zh'?t('中文文案'):localeFor(targetLanguage).name}<textarea lang={localeFor(targetLanguage).html} aria-label={targetLanguage==='zh'?t('中文文案'):localeFor(targetLanguage).name} rows={3} disabled={catalogBusy} value={row[targetLanguage]||''} onChange={e=>change(row,targetLanguage,e.target.value)} /></label><label><input type="checkbox" checked={row.enabled} onChange={e=>change(row,'enabled',e.target.checked)} />{t('启用文案覆盖')}</label></div></fieldset>)}
    <div className="admin-toolbar"><button type="button" className="btn btn-outline" disabled={!page} onClick={()=>setPage(p=>p-1)}>{t('上一页')}</button><span>{page+1} / {Math.max(1,Math.ceil(rows.length/15))}</span><button type="button" className="btn btn-outline" disabled={(page+1)*15>=rows.length} onClick={()=>setPage(p=>p+1)}>{t('下一页')}</button></div>
  </section>
}
