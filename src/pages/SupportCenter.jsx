import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, BookOpen, Settings, LogOut, Send, UserRoundCheck, Bot, Check, Trash2, Bell, ArrowLeft, Plus, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import { messageId, supportApi, supportDate } from '../lib/supportApi.js'
import './SupportCenter.css'
import SupportMessageText from '../components/SupportMessageText.jsx'

const STATES = { ai: '自动咨询', waiting: '待人工接待', human: '人工接待中', closed: '已结束' }
const NOTIFICATIONS = { none: '未触发', pending: '待发送', sending: '发送中', failed: '发送失败，待重试', sent: '已通知', unconfigured: '未配置' }
const EMPTY_ENTRY = { id: '', title: '', answer_en: '', answer_zh: '', published: false }

export default function SupportCenter() {
  const [staff, setStaff] = useState(null), [checking, setChecking] = useState(true)
  const [email, setEmail] = useState(''), [code, setCode] = useState(''), [sent, setSent] = useState(false)
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('conversations'), [filter, setFilter] = useState(''), [search, setSearch] = useState(''), [page, setPage] = useState(0)
  const [rows, setRows] = useState([]), [more, setMore] = useState(false), [settings, setSettings] = useState(null)
  const [selected, setSelected] = useState(() => new URLSearchParams(location.search).get('conversation') || '')
  const [chat, setChat] = useState(null), [reply, setReply] = useState(''), [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([]), [entry, setEntry] = useState(null)
  const selectedRef = useRef(selected), request = useRef(null), log = useRef(null), actionPending = useRef(false)
  selectedRef.current = selected
  useEffect(() => {
    const oldTitle = document.title
    document.title = 'Lumichan | 客服中心'
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex,nofollow'; document.head.append(robots)
    supportApi('support-auth.php').then(r => setStaff(r.staff)).catch(e => setError(e.message)).finally(() => setChecking(false))
    return () => { robots.remove(); document.title = oldTitle }
  }, [])
  const api = (file, body, signal) => supportApi(file, { body, csrf: staff?.csrf, signal })
  function failure(e) {
    setError(e.name === 'AbortError' ? '连接超时，请重试。' : e.message)
    if (e.status === 401) setStaff(null)
  }
  useEffect(() => {
    if (!staff) return
    let active = true, pending = false
    const controller = new AbortController()
    async function refresh() {
      if (pending || actionPending.current || document.hidden) return
      pending = true
      try {
        const r = await api(`admin-support.php?state=${filter}&search=${encodeURIComponent(search)}&page=${page}`, null, controller.signal)
        if (active) { setRows(r.conversations); setMore(r.has_more); setSettings(r.settings) }
      } catch (e) { if (active) failure(e) }
      finally { pending = false }
    }
    refresh(); const timer = setInterval(refresh, 5000)
    return () => { active = false; clearInterval(timer); controller.abort() }
  }, [staff, filter, search, page, busy])
  useEffect(() => {
    setChat(null); setReply(''); request.current = null
    if (!staff || !selected) return
    let active = true, pending = false
    const controller = new AbortController()
    setLoading(true)
    async function refresh() {
      if (pending || actionPending.current || document.hidden) return
      pending = true
      try {
        const r = await api(`admin-support.php?id=${selected}`, null, controller.signal)
        if (active && !actionPending.current) setChat(r.conversation)
      } catch (e) { if (active) { failure(e); if (e.status === 404) setSelected('') } }
      finally { if (active) setLoading(false); pending = false }
    }
    refresh(); const timer = setInterval(refresh, 4000)
    return () => { active = false; clearInterval(timer); controller.abort() }
  }, [selected, staff])
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [chat?.messages.length])
  async function loadKnowledge() {
    try { const r = await api('admin-support.php?knowledge=1'); setEntries(r.entries) } catch (e) { failure(e) }
  }
  useEffect(() => { if (staff && tab === 'knowledge') loadKnowledge() }, [staff, tab])
  async function auth(action) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await api('support-auth.php', { action, email, code })
      if (action === 'request') { setSent(true); setNotice('验证码已发送，10 分钟内有效。') }
      if (action === 'verify') setStaff(r.staff)
      if (action === 'logout') { setStaff(null); setChat(null); setRows([]); setSelected(''); setCode(''); setSent(false) }
    } catch (e) { failure(e) } finally { setBusy(false) }
  }
  async function mutate(action, extra = {}) {
    if (actionPending.current) return
    actionPending.current = true; setBusy(true); setError(''); setNotice('')
    const id = selected
    try {
      const r = await api('admin-support.php', { action, id, ...extra })
      if (id === selectedRef.current && action !== 'knowledge') {
        if (action === 'delete') { setSelected(''); setChat(null) }
        else if (r.conversation) setChat(r.conversation)
      }
      if (action === 'knowledge') { await loadKnowledge(); setEntry(null); setNotice('知识条目已保存。') }
      return true
    } catch (e) { failure(e); return false }
    finally { actionPending.current = false; setBusy(false) }
  }
  async function sendReply(e) {
    e.preventDefault()
    if (!reply.trim()) return
    if (!request.current || request.current.text !== reply) request.current = { text: reply, request_id: messageId() }
    if (await mutate('reply', request.current)) { setReply(''); request.current = null }
  }
  const mine = chat?.assignee === staff?.email
  const canClaim = staff?.can_reply && chat?.state !== 'closed' && (!chat?.assignee || mine)

  if (checking) return <main className="support-center sc-login"><p role="status">正在连接客服中心…</p></main>
  if (!staff) return <main className="support-center sc-login"><div className="sc-login-inner">
    <Link to="/traveler" className="sc-brand">LUMICHAN</Link><h1>客服中心</h1><p className="sc-muted">企业邮箱登录</p>
    {error && <p className="sc-error" role="alert">{error}</p>}{notice && <p className="sc-notice" role="status">{notice}</p>}
    <form onSubmit={e => { e.preventDefault(); auth(sent ? 'verify' : 'request') }}>
      <label>企业邮箱<input required type="email" autoComplete="email" value={email} placeholder="name@lumichan.com.cn" maxLength={200} onChange={e => { setEmail(e.target.value); setSent(false); setNotice('') }} /></label>
      {sent && <label>邮箱验证码<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)} /></label>}
      <button className="sc-primary" disabled={busy}>{busy ? '请稍候…' : sent ? '登录客服中心' : '发送验证码'}</button>
      {sent && <button type="button" disabled={busy} onClick={() => auth('request')}>重新发送</button>}
    </form><Link className="sc-admin-link" to="/admin">使用现有管理员账号登录</Link>
  </div></main>

  return <main className="support-center">
    <header className="sc-header"><div className="sc-identity"><Link to="/traveler" className="sc-brand">LUMICHAN</Link><h1>客服中心</h1></div><div className="sc-account"><span>{staff.email}<small>{staff.admin ? '管理员' : staff.can_reply ? '接待客服' : '只读成员'}</small></span><button title="退出登录" aria-label="退出登录" onClick={() => auth('logout')} disabled={busy}><LogOut size={19} /></button></div></header>
    <nav className="sc-tabs" aria-label="客服中心导航">{[['conversations', '会话', MessageSquare], ['knowledge', '知识库', BookOpen], ['settings', '接入状态', Settings]].map(([id, label, Icon]) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); setError(''); setNotice('') }}><Icon size={17} />{label}</button>)}<Link to="/admin">运营后台</Link></nav>
    {error && <div className="sc-error" role="alert">{error}<button aria-label="关闭提示" onClick={() => setError('')}>关闭</button></div>}
    {notice && <div className="sc-notice" role="status">{notice}</div>}
    {tab === 'conversations' && <div className={`sc-workspace ${selected ? 'sc-has-selection' : ''}`}>
      <aside className="sc-inbox"><div className="sc-inbox-filters"><label>会话状态<select value={filter} onChange={e => { setFilter(e.target.value); setPage(0) }}><option value="">全部会话</option>{Object.entries(STATES).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label><label>查找会话<input type="search" placeholder="邮箱或会话编号" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} /></label></div>
        <div className="sc-conversation-list">{!rows.length && <p className="sc-empty">暂无匹配会话</p>}{rows.map(row => <button key={row.id} className={`sc-conversation ${row.id === selected ? 'is-selected' : ''}`} onClick={() => setSelected(row.id)}><span className={`sc-badge sc-badge--${row.state}`}>{STATES[row.state]}</span><strong>{row.email || `访客 ${row.id.slice(0, 8)}`}</strong><span>{row.assignee || '未分配'}</span><time>{supportDate(row.updated_at)} CST</time></button>)}</div>
        <footer className="sc-pagination"><button disabled={!page} aria-label="上一页" title="上一页" onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button><span>第 {page + 1} 页</span><button disabled={!more} aria-label="下一页" title="下一页" onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button></footer>
      </aside>
      <section className="sc-thread" aria-label="会话详情">
        {!selected && <div className="sc-empty sc-thread-empty"><MessageSquare size={38} /><h2>选择一条会话</h2></div>}
        {selected && <><div className="sc-thread-heading"><button className="sc-mobile-back" title="返回会话列表" aria-label="返回会话列表" onClick={() => setSelected('')}><ArrowLeft size={19} /></button><div><h2>{chat?.email || `访客 ${selected.slice(0, 8)}`}</h2><span>{chat ? STATES[chat.state] : '加载中…'}{chat?.assignee && ` · ${chat.assignee}`}</span></div>{chat && <div className="sc-thread-actions">
          {canClaim && chat.state !== 'human' && <button disabled={busy} className="sc-primary" onClick={() => mutate('claim')}><UserRoundCheck size={16} />接管</button>}
          {mine && chat.state === 'human' && <button disabled={busy} onClick={() => mutate('resume')} title="恢复自动咨询" aria-label="恢复自动咨询"><Bot size={16} /><span>恢复 AI</span></button>}
          {canClaim && <button disabled={busy} title="结束会话" aria-label="结束会话" onClick={() => { if (confirm('结束此会话？访客将不能继续发送消息。')) mutate('close') }}><Check size={17} /></button>}
          {staff.admin && <button disabled={busy} title="永久删除会话" aria-label="永久删除会话" onClick={() => { if (confirm('永久删除此会话、联系方式及访问记录？不可撤销。')) mutate('delete') }}><Trash2 size={17} /></button>}
        </div>}</div>
        <div ref={log} className="sc-messages" role="log" aria-live="polite">{loading && !chat && <p role="status">加载会话记录…</p>}{chat?.messages.map(m => <article key={m.id} className={`sc-message sc-message--${m.role}`}><header><strong>{m.author || ({ visitor: '访客', assistant: '自动咨询', system: '会话事件' })[m.role]}</strong><time>{supportDate(m.created_at)} CST</time></header><p><SupportMessageText text={m.body} /></p></article>)}</div>
        {chat && <><details className="sc-details"><summary>联系信息与访问记录</summary><dl><dt>会话编号</dt><dd>{chat.id}</dd><dt>联系邮箱</dt><dd>{chat.email ? <a href={`mailto:${chat.email}`}>{chat.email}</a> : '未提供'}</dd><dt>创建时间</dt><dd>{supportDate(chat.created_at)} CST</dd><dt>删除时间</dt><dd>{supportDate(chat.expires_at)} CST（创建后 30 天）</dd><dt>企业微信通知</dt><dd>{NOTIFICATIONS[chat.notification_status] || chat.notification_status}{staff.can_reply && ['waiting', 'human'].includes(chat.state) && <button disabled={busy} title="重新发送通知" aria-label="重新发送通知" onClick={() => mutate('notify')}><Bell size={15} /></button>}</dd></dl><ul>{chat.audit.map((a, i) => <li key={i}>{supportDate(a.created_at)} · {a.actor} · {a.action}</li>)}</ul></details>
        <form className="sc-reply" onSubmit={sendReply}><label htmlFor="support-reply">{!staff.can_reply ? '只读权限' : chat.state === 'closed' ? '会话已结束' : mine && chat.state === 'human' ? '回复访客' : '接管会话后可回复'}</label><div><textarea id="support-reply" rows={3} maxLength={4000} disabled={!mine || chat.state !== 'human' || !staff.can_reply} value={reply} onChange={e => setReply(e.target.value)} /><button className="sc-primary" type="submit" disabled={busy || !mine || chat.state !== 'human' || !reply.trim()} title="发送回复" aria-label="发送回复"><Send size={19} /></button></div></form></>}
        </>}
      </section>
    </div>}
    {tab === 'knowledge' && <section className="sc-knowledge"><header><h2>客服知识库</h2>{staff.admin && <button className="sc-primary" onClick={() => setEntry({ ...EMPTY_ENTRY })}><Plus size={17} />新增条目</button>}</header>
      <div className="sc-knowledge-layout"><div className="sc-knowledge-list">{entries.map(e => <button key={e.id} className={entry?.id === e.id ? 'is-selected' : ''} onClick={() => setEntry({ ...e })}><strong>{e.title}</strong><span>{e.locked ? '网站同步 · 已发布' : e.published ? '已发布' : '草稿'}</span></button>)}</div>
      <div className="sc-knowledge-editor">{!entry ? <p className="sc-empty">选择知识条目</p> : <form onSubmit={e => { e.preventDefault(); mutate('knowledge', entry) }}><h3>{entry.locked ? '网站同步条目' : entry.id ? '编辑条目' : '新增条目'}</h3><label>主题<input required maxLength={200} disabled={entry.locked || !staff.admin} value={entry.title} onChange={e => setEntry({ ...entry, title: e.target.value })} /></label><label>英文回答<textarea required rows={8} maxLength={4000} disabled={entry.locked || !staff.admin} value={entry.answer_en} onChange={e => setEntry({ ...entry, answer_en: e.target.value })} /></label><label>中文回答<textarea required rows={8} maxLength={4000} disabled={entry.locked || !staff.admin} value={entry.answer_zh} onChange={e => setEntry({ ...entry, answer_zh: e.target.value })} /></label>{entry.source && <a href={entry.source} target="_blank" rel="noreferrer">查看网站原文</a>}{!entry.locked && staff.admin && <><label className="sc-check"><input type="checkbox" checked={entry.published} onChange={e => setEntry({ ...entry, published: e.target.checked })} />发布给访客</label><button className="sc-primary" disabled={busy}><Save size={17} />保存</button></>}</form>}</div></div>
    </section>}
    {tab === 'settings' && <section className="sc-settings"><h2>接入状态</h2>{!settings ? <p>正在读取…</p> : <><dl>{[['网站聊天', settings.enabled ? '已启用' : '未启用'], ['DeepSeek', settings.ai_configured ? '已配置密钥（未检测连通性）' : '未配置，使用快捷问题与人工接待'], ['企业微信', settings.wecom_configured ? '已配置（实际发送结果见会话）' : '未配置'], ['邮件发送', settings.mail_configured ? '已开启（以验证码实际送达为准）' : '未开启'], ['每日模型请求上限', settings.daily_ai_limit], ['主要接待邮箱', settings.email], ['工作日接待', '周一至周五 08:30–16:00'], ['周末接待', '周六至周日 09:00–13:00'], ['时区', '中国时间 UTC+8'], ['聊天保留', '创建后 30 天；需启用服务器清理计划任务']].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><h3>待确认的业务政策</h3><p>退款起算、提前天数计算、部分退款公式仍由人工核实。</p></>}</section>}
  </main>
}
