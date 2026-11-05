import { apiErrorMessage } from '../i18n/errors.js'
import { getLanguage, getDateLocale, t } from '../i18n/runtime.js'
import { useEffect, useRef, useState } from 'react'
import { Link } from '../i18n/router.jsx'
import SupportMessageText from './SupportMessageText.jsx'
const STATES={ai:'AI 咨询',waiting:'待人工',human:'人工接待',closed:'已结束'}
const ROLES={visitor:'客户',ai:'AI 客服',assistant:'AI 客服',agent:'人工客服',system:'系统'}
const time=value=>value?new Date(value.replace(' ','T')+'Z').toLocaleString(getDateLocale(),{timeZone:'Asia/Shanghai',hour12:false}):'—'
async function read(query,signal){const response=await fetch('/api/admin-support.php?'+query,{credentials:'include',signal});const data=await response.json();if(!response.ok||!data.ok)throw new Error(apiErrorMessage(data.error,response.status));return data}
export default function AdminChatHistory(){
 const dialog=useRef(null), opener=useRef(null)
 const [search,setSearch]=useState(''),[query,setQuery]=useState(''),[state,setState]=useState(''),[page,setPage]=useState(0),[refresh,setRefresh]=useState(0)
 const [rows,setRows]=useState([]),[more,setMore]=useState(false),[selected,setSelected]=useState(''),[chat,setChat]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[detailError,setDetailError]=useState('')
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');read(new URLSearchParams({search:query,state,page:String(page)}),controller.signal).then(data=>{setRows(data.conversations);setMore(data.has_more)}).catch(e=>{if(e.name!=='AbortError'){setError(e.message);setRows([])}}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[query,state,page,refresh])
 useEffect(()=>{setChat(null);setDetailError('');if(!selected)return;const controller=new AbortController();setError('');read(new URLSearchParams({id:selected}),controller.signal).then(data=>setChat(data.conversation)).catch(e=>{if(e.name!=='AbortError')setDetailError(e.message)});return()=>controller.abort()},[selected,refresh])
 useEffect(()=>{
  if(!selected)return
  const el=dialog.current,previous=document.body.style.overflow
  el.showModal();document.body.style.overflow='hidden'
  return()=>{el.close();document.body.style.overflow=previous;opener.current?.focus()}
 },[selected])
 return <section className="admin-chat-history"><h2>{t("客户聊天记录")}</h2><p className="admin-muted">{t("查询保留期内的会话，包含客户、AI、人工及系统消息。时间为中国时间；查看详情会记录访问审计。")}</p>
 <form className="admin-chat-filters" onSubmit={event=>{event.preventDefault();setPage(0);setQuery(search);setRefresh(v=>v+1)}}><label>{t("搜索")}<input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("邮箱、会话编号或聊天内容")} maxLength={200}/></label><label>{t("会话状态")}<select value={state} onChange={e=>{setState(e.target.value);setPage(0)}}><option value="">{t("全部状态")}</option>{t(Object.entries(STATES).map(([key,label])=><option key={key} value={key}>{t(label)}</option>))}</select></label><button className="btn btn-gold" type="submit">{t("查询")}</button><button className="btn btn-outline" type="button" onClick={()=>setRefresh(v=>v+1)}>{t("刷新")}</button></form>
 {t(error&&<p role="alert" className="admin-error">{t(error)}</p>)}
 <div className="admin-chat-table"><div className="admin-chat-table-head"><span>{t("客户 / 会话")}</span><span>{t("状态")}</span><span>{t("最后更新 · 中国时间")}</span><span>{t("操作")}</span></div>
 <p role="status" className="admin-chat-count">{t(loading?'加载中…':`第 ${page+1} 页 · ${rows.length} 个会话`)}</p>
 {t(!loading&&!rows.length&&!error&&<p className="admin-chat-empty">{t("暂无符合条件的聊天记录。")}</p>)}
 {t(rows.map(row=><div className="admin-chat-table-row" key={row.id}><div><strong>{t(row.email||'访客 · '+row.id.slice(-6))}</strong><small title={t(row.id)}>{t("会话 ")}{t(row.id.slice(0,8))}…{t(row.id.slice(-4))}</small></div><span className={'admin-chat-state state-'+row.state}>{t(STATES[row.state]||row.state)}</span><time>{t(time(row.updated_at))}</time><button type="button" className="btn btn-outline" onClick={event=>{opener.current=event.currentTarget;setSelected(row.id)}} aria-label={t('查看记录 '+row.id)}>{t("查看记录 →")}</button></div>))}
 <div className="admin-chat-pagination"><span>{t("每页最多 100 个会话")}</span><button className="btn btn-outline" disabled={page===0||loading} onClick={()=>setPage(v=>v-1)}>{t("上一页")}</button><button className="btn btn-outline" disabled={!more||loading} onClick={()=>setPage(v=>v+1)}>{t("下一页")}</button></div></div>
 <dialog ref={dialog} className="admin-chat-modal" aria-labelledby="chat-modal-title" onCancel={event=>{event.preventDefault();setSelected('')}} onClick={event=>{if(event.target===event.currentTarget)setSelected('')}}><header className="admin-chat-modal-header"><div><span>{t("CONVERSATION")}</span><h2 id="chat-modal-title">{t("聊天记录")}</h2></div><button type="button" aria-label={t("关闭聊天记录")} onClick={()=>setSelected('')}>×</button></header>
 <div className="admin-chat-detail" aria-label={t("会话详情")}>{t(!selected?<p>{t("选择左侧会话查看完整聊天记录。")}</p>:detailError?<p role="alert" className="admin-error">{t(detailError)}</p>:!chat?<p>{t("正在读取会话…")}</p>:<><h3>{t(chat.email||'未留邮箱的客户')}</h3><p>{t(STATES[chat.state])}{t(" · 接待人：")}{t(chat.assignee||'未分配')}</p><p className="admin-muted">{t("创建：")}{t(time(chat.created_at))}{t(" · 到期：")}{t(time(chat.expires_at))}</p><Link className="btn btn-outline" to={'/support?conversation='+encodeURIComponent(chat.id)}>{t("进入客服中心处理")}</Link><ol className="admin-chat-messages">{t(chat.messages.map(message=><li key={message.id} className={'role-'+message.role}><div><strong>{t(ROLES[message.role]||message.role)}</strong> <time>{t(time(message.created_at))}</time>{t(message.role==='agent'&&message.author&&<small> · {t(message.author)}</small>)}</div><p><SupportMessageText text={message.body}/></p></li>))}</ol>{t(!chat.messages.length&&<p>{t("这个会话暂无消息。")}</p>)}</>)}</div></dialog></section>
}
