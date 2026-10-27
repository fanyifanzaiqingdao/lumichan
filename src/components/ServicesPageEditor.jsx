import { useEffect, useState } from 'react'
import seed from '../lib/servicesPage.js'

const LABELS = {title:'标题',eyebrow:'小标题',body:'正文',note:'说明',emptyText:'暂无评价文案',order:'排序',visible:'显示模块',ctaLabel:'按钮文案',ctaUrl:'按钮链接',subtitle:'简介',points:'可见卖点（每行一项）',included:'包含内容（每行一项）',bestFor:'适合人群',image:'图片',src:'图片路径',alt:'图片描述 alt',focalPoint:'裁切焦点（横向% 纵向%）',aiGenerated:'AI 示意素材',authorized:'已有正式展示授权',licenseRecord:'素材来源／授权记录',published:'显示图片',items:'内容项',stripTitle:'说明条标题',stripBody:'说明条正文',primaryLabel:'主按钮文案',primaryUrl:'主按钮链接',secondaryLabel:'次按钮文案',secondaryUrl:'次按钮链接',text:'评价原文',source:'核验来源',permission:'评价授权记录',displayName:'展示名（可留空）',verified:'来源已核验',status:'发布状态'}
const emptyImage = () => ({src:'',alt:'',focalPoint:'50% 50%',aiGenerated:false,licenseRecord:'',authorized:false,published:true})
function Fields({ value, path, change }) {
  return <div className="admin-form-grid">{Object.entries(value).filter(([key]) => !['id','anchor','schemaVersion','aiSample'].includes(key) && !(['why','services','reviews','final'].includes(value.id) && ['ctaLabel','ctaUrl'].includes(key))).map(([key, item]) => {
    const name = LABELS[key] || key
    const nextPath = [...path, key]
    if (Array.isArray(item)) {
      if (item.every((entry) => typeof entry === 'string')) return <label className="span-2" key={key}>{name}<textarea aria-label={name} rows={Math.max(3,item.length)} value={item.join('\n')} onChange={(e) => change(nextPath,e.target.value.split('\n'))} /></label>
      return <div className="span-2" key={key}>{item.map((entry,index) => <fieldset key={index}><legend>{name} {index+1}</legend><Fields value={entry} path={[...nextPath,index]} change={change} /></fieldset>)}</div>
    }
    if (item && typeof item === 'object') return <fieldset className="span-2" key={key}><legend>{name}</legend><Fields value={item} path={nextPath} change={change} />{key === 'image' && <ImageUpload path={nextPath} change={change} />}</fieldset>
    if (typeof item === 'boolean') return <label key={key}><span><input type="checkbox" checked={item} onChange={(e) => change(nextPath,e.target.checked)} /> {name}</span></label>
    if (key === 'status') return <label key={key}>{name}<select aria-label={name} value={item} onChange={(e) => change(nextPath,e.target.value)}><option value="draft">草稿</option><option value="published">发布（需核验及授权）</option></select></label>
    if (typeof item === 'number') return <label key={key}>{name}<input aria-label={name} type="number" min="0" max="100" value={item} onChange={(e) => change(nextPath,Number(e.target.value))} /></label>
    return <label className={['body','note','text','bestFor','subtitle','permission','licenseRecord'].includes(key) ? 'span-2' : ''} key={key}>{name}{['body','note','text','bestFor','subtitle','permission','licenseRecord','title'].includes(key) ? <textarea aria-label={name} rows={key === 'text' ? 4 : 2} value={item || ''} onChange={(e) => change(nextPath,e.target.value)} /> : <input aria-label={name} value={item || ''} onChange={(e) => change(nextPath,e.target.value)} />}</label>
  })}</div>
}
function ImageUpload({path, change}) {
  const [message,setMessage] = useState('')
  return <label>上传替换图片（JPEG / PNG / WebP，5MB 内）<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => {
    const file=event.target.files?.[0]; if(!file)return
    setMessage('上传中…')
    try {const body=new FormData();body.append('image',file);const res=await fetch('/api/admin-upload.php',{method:'POST',credentials:'include',body});const data=await res.json();if(!res.ok||!data.ok)throw new Error(data.error||'上传失败');change([...path,'src'],data.path);change([...path,'authorized'],false);change([...path,'licenseRecord'],'');setMessage('已上传。请填写 alt、来源与授权状态后保存。')} catch(error){setMessage(error.message)}
  }} /><span role="status">{message}</span></label>
}
export default function ServicesPageEditor({onSharedSettings}) {
  const [page,setPage]=useState(null)
  const [csrf,setCsrf]=useState('')
  const [status,setStatus]=useState('')
  const [saving,setSaving]=useState(false)
  useEffect(()=>{const controller=new AbortController();fetch('/api/admin-services-page.php',{credentials:'include',signal:controller.signal}).then(async res=>{const data=await res.json();if(!res.ok||!data.ok)throw new Error(data.error||'加载失败');setPage(data.page || structuredClone(seed));setCsrf(data.csrf)}).catch(error=>{if(error.name!=='AbortError')setStatus(error.message)});return()=>controller.abort()},[])
  function change(path,value) {setPage(previous=>{const copy=structuredClone(previous);let target=copy;for(const key of path.slice(0,-1))target=target[key];target[path.at(-1)]=value;if(path.at(-1)==='src' && previous && value!==path.slice(0,-1).reduce((node,key)=>node[key],previous).src){target.authorized=false;target.licenseRecord=''}return copy});setStatus('有未保存修改')}
  function moveImage(index, delta) {
    const gallery=[...page.gallery];const target=index+delta;if(target<0||target>=gallery.length)return;[gallery[index],gallery[target]]=[gallery[target],gallery[index]];change(['gallery'],gallery)
  }
  async function save() {
    setSaving(true);setStatus('保存中…')
    try {const res=await fetch('/api/admin-services-page.php',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({page})});const data=await res.json();if(!res.ok||!data.ok)throw new Error(data.error||'保存失败');setPage(data.page);setStatus('服务页配置已保存，刷新前台即可查看')}catch(error){setStatus(error.message)}finally{setSaving(false)}
  }
  return <section className="admin-homepage-editor">
    <div className="admin-toolbar"><div><h2>Services 二级页面配置</h2><p>模块排序、文案、按钮、图片、车辆画廊及真实评价。AI 示例仅用于测试环境，不会保存到评价数据中。</p><p>价格、币种、计价单位及取消政策与首页共用，政策版本、生效日期、审批记录在现有服务配置中维护。</p><button className="btn btn-outline" onClick={onSharedSettings}>编辑共用价格与政策</button></div></div>
    <p role="status" className="admin-muted">{status}</p>
    {page && <>
      <h3>页面模块</h3>{page.modules.map((module,index)=><details className="admin-service-module" key={module.id}><summary>{module.order}. {module.title.replaceAll('\n',' ')}{!module.visible?'（隐藏）':''}</summary><Fields value={module} path={['modules',index]} change={change}/></details>)}
      <h3>三项零售服务</h3>{page.services.map((service,index)=><details className="admin-service-module" key={service.id}><summary>{service.title}</summary><Fields value={service} path={['services',index]} change={change}/></details>)}
      <h3>车辆画廊</h3>{page.gallery.map((image,index)=><details className="admin-service-module" key={index}><summary>图片 {index+1}：{image.alt || '待填写'}</summary><Fields value={image} path={['gallery',index]} change={change}/><ImageUpload path={['gallery',index]} change={change}/><button className="btn btn-outline" disabled={index === 0} onClick={()=>moveImage(index,-1)}>上移</button><button className="btn btn-outline" disabled={index === page.gallery.length-1} onClick={()=>moveImage(index,1)}>下移</button><button className="btn btn-outline" onClick={()=>change(['gallery'],page.gallery.filter((_,i)=>i!==index))}>移除此图片</button></details>)}
      <button className="btn btn-outline" onClick={()=>change(['gallery'],[...page.gallery,emptyImage()])}>添加画廊图片</button>
      <h3>真实旅客评价</h3><p>发布需提供核验来源、授权记录；照片需确认授权且不能为 AI。无真实评价时正式环境显示默认栏目。</p>{page.reviews.map((review,index)=><details className="admin-service-module" key={index}><summary>评价 {index+1}（{review.status}）</summary><Fields value={review} path={['reviews',index]} change={change}/><button className="btn btn-outline" onClick={()=>change(['reviews'],page.reviews.filter((_,i)=>i!==index))}>移除此评价</button></details>)}
      <button className="btn btn-outline" onClick={()=>change(['reviews'],[...page.reviews,{text:'',source:'',permission:'',displayName:'',status:'draft',verified:false,aiSample:false,image:emptyImage()}])}>添加真实评价草稿</button>
      <div className="admin-toolbar"><button className="btn btn-gold" disabled={saving} onClick={save}>{saving?'保存中…':'保存服务页配置'}</button></div>
    </>}
  </section>
}
