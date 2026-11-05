import { href } from '../i18n/router.jsx'
import { getLanguage, getDateLocale, t } from '../i18n/runtime.js'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from '../i18n/router.jsx'
import { MessageCircle, X, Send, UserRound, Trash2, Mail, ArrowRight, RotateCw } from 'lucide-react'
import { messageId, supportApi, supportDate } from '../lib/supportApi.js'
import './SupportChat.css'
import SupportMessageText from './SupportMessageText.jsx'

const replyReasons = {
 greeting: ['Welcome! Tell us about your travel plans.', '你好！欢迎介绍你的旅行计划。'],
 matched: ['AI matched an approved knowledge-base answer.', 'AI 已匹配到知识库答案，回复为已审核文案。'],
 quick_answer: ['This is a predefined quick answer; AI was not called.', '这是预设快捷答案，本次未调用 AI。'],
 no_match: ['No suitable knowledge-base answer was found. You can continue with automated support.', '未找到适合的知识库答案，会话仍保留自动咨询，可继续提问。'],
 quota_exceeded: ['The automated support limit was reached. You can continue with automated support.', '自动客服调用已达上限，会话仍保留自动咨询，可继续提问。'],
 consent_required: ['AI processing is not enabled for this conversation. You can continue with automated support.', '此会话未开启 AI 处理，会话仍保留自动咨询，可继续提问。'],
 human_required: ['This question needs a team member. Please wait for someone to take over.', '此问题需要人工处理，请等待工作人员接管。'],
 waiting_for_staff: ['Waiting for a team member. AI will not reply while this conversation is queued.', '正在等待人工接待，排队期间 AI 不会回复。'],
 human_active: ['Your message has been sent to the team member handling this conversation.', '消息已发送给接待此会话的工作人员。'],
 state_changed: ['The conversation status changed while processing. Please check the current status.', '处理期间会话状态发生变化，请查看当前状态。'],
}
const unavailableReply = ['AI is temporarily unavailable. You can continue with automated support.', 'AI 暂时无法使用，会话仍保留自动咨询，可继续提问。']
const KEY = 'lumichan-support-v1'
const EMAIL = 'jin.lu@lumichan.com.cn'
const states = { ai: 'Automated support', waiting: 'Waiting for the team', human: 'Team conversation', closed: 'Conversation closed' }
function readSession() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s?.id && s?.token && Date.parse(s.expires) > Date.now()) return s
    localStorage.removeItem(KEY)
  } catch { /* Storage may be blocked in private browsing. */ }
  return null
}

export default function SupportChat() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(readSession)
  const [settings, setSettings] = useState(null)
  const [chat, setChat] = useState(null)
  const [replyInfo, setReplyInfo] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [consent, setConsent] = useState(false)
  const [aiConsent, setAiConsent] = useState(false)
  const [text, setText] = useState('')
  const [email, setEmail] = useState('')
  const [savedEmail, setSavedEmail] = useState(false)
  const panel = useRef(null), launcher = useRef(null), log = useRef(null), draft = useRef(null), inFlight = useRef(false)
  const visible = open && (pathname === '/' || pathname.startsWith('/traveler'))

  function forget() {
    try { localStorage.removeItem(KEY) } catch { /* In-memory session still resets. */ }
    setSession(null); setChat(null); setReplyInfo(null); setEmail(''); setText(''); setSavedEmail(false); draft.current = null
  }
  useEffect(() => {
    if (!visible) return
    const controller = new AbortController()
    supportApi('support.php', { signal: controller.signal }).then(r => setSettings(r.settings)).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [visible])
  useEffect(() => {
    if (!visible || !session) return
    let active = true, pending = false
    const controller = new AbortController()
    async function refresh() {
      if (pending || inFlight.current || document.hidden) return
      pending = true
      try {
        const r = await supportApi(`support.php?id=${session.id}`, { token: session.token, signal: controller.signal })
        if (active && !inFlight.current) { setChat(r.conversation); setError('') }
      } catch (e) {
        if (active) { setError(e.message); if (e.status === 404) forget() }
      } finally { pending = false }
    }
    refresh()
    const timer = setInterval(refresh, 5000)
    return () => { active = false; clearInterval(timer); controller.abort() }
  }, [visible, session])
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [chat?.messages?.length, visible])
  useEffect(() => {
    if (!visible) return
    panel.current?.querySelector('button')?.focus()
    function keys(e) {
      if (e.key === 'Escape') { setOpen(false); setTimeout(() => launcher.current?.focus(), 0) }
      if (e.key !== 'Tab') return
      const items = [...panel.current.querySelectorAll('button:not(:disabled),a,input,textarea,summary')].filter(el => el.getClientRects().length)
      if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1)?.focus() }
      else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0]?.focus() }
    }
    document.addEventListener('keydown', keys)
    return () => document.removeEventListener('keydown', keys)
  }, [visible])

  async function run(action, extra = {}) {
    if (inFlight.current) return false
    inFlight.current = true; setBusy(true); setError('')
    try {
      const r = await supportApi('support.php', { token: session?.token, body: { action, id: session?.id, ...extra } })
      if (action === 'start') {
        const s = { id: r.conversation.id, token: r.token, expires: r.conversation.expires_at.replace(' ', 'T') + 'Z' }
        setSession(s)
        try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* Continue with an in-memory session. */ }
      }
      if (action === 'delete') forget()
      if (r.conversation) setChat(r.conversation)
      setReplyInfo(r.reply_info || null)
      return true
    } catch (e) { setError(e.name === 'AbortError' ? 'Connection timed out. Please retry your message.' : e.message); if (e.status === 404) forget(); return false }
    finally { inFlight.current = false; setBusy(false) }
  }
  async function send(value = text, topic = '') {
    if (!value.trim()) return
    if (!draft.current || draft.current.text !== value || draft.current.topic !== topic) draft.current = { text: value, topic, request_id: messageId() }
    if (await run('message', draft.current)) { setText(''); draft.current = null }
  }
  if (!(pathname === '/' || pathname.startsWith('/traveler'))) return null
  return <div className="lc-chat">
    {t(!open && <button ref={launcher} className="lc-chat-launcher" aria-label={t("Chat with Lumichan")} title={t("Chat with Lumichan")} onClick={() => setOpen(true)}><MessageCircle size={24} /><span>{t("Ask Lumichan")}</span></button>)}
    {t(open && <section ref={panel} className="lc-chat-panel" role="dialog" aria-label={t("Lumichan travel support")}>
      <header className="lc-chat-header"><div><strong>{t("LUMICHAN")}</strong><span>{t(chat ? states[chat.state] : 'A little local guidance')}</span></div><button title={t("Close chat")} aria-label={t("Close chat")} onClick={() => { setOpen(false); setTimeout(() => launcher.current?.focus(), 0) }}><X size={21} /></button></header>
      <div className="lc-chat-hours">{t("Mon–Fri 08:30–16:00 · Sat–Sun 09:00–13:00")}<br />{t("China time (UTC+8)")}{t(settings && <span>{t(settings.office_open ? 'Within office hours' : 'Outside office hours')}</span>)}</div>
      {replyInfo && <p className="lc-chat-note" role="status">{(replyReasons[replyInfo.reason] || unavailableReply)[getLanguage().startsWith('zh') ? 1 : 0]}</p>}
      {t(error && <p className="lc-chat-error" role="alert">{t(error)}</p>)}
      {t(!session ? <div className="lc-chat-welcome">
        {!['en','zh'].includes(getLanguage())&&<p className="lc-chat-note">{t('Automated support answers are currently available in English and Simplified Chinese. Human messages are shown in their original language.')}</p>}<MessageCircle size={32} /><h2>{t("Where would you like to begin?")}</h2><p>{t("Ask about journeys, planning support or how to book.")}</p>
        {t(!settings && !error && <p role="status">{t("Connecting…")}</p>)}
        {t(settings?.enabled && <form onSubmit={e => { e.preventDefault(); run('start', { consent, ai_consent: aiConsent, consent_version: settings.consent_version, language: getLanguage() }) }}>
          <label className="lc-chat-check"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{t("I agree to storage of this chat and any contact details for 30 days from the start of this conversation, accessible to authorized Lumichan staff. ")}<a href={href("/traveler/privacy")} target="_blank" rel="noreferrer">{t("Privacy Policy")}</a></span></label>
          <label className="lc-chat-check"><input type="checkbox" checked={aiConsent} onChange={e => setAiConsent(e.target.checked)} /><span>{t("Allow my recent messages to be sent to DeepSeek for automated support (optional). Please do not share passport, payment or sensitive information.")}</span></label>
          <button className="lc-chat-primary" disabled={!consent || busy}>{t("Start a conversation ")}<ArrowRight size={17} /></button>
        </form>)}
        {t(settings && !settings.enabled && <p>{t("Live chat is not available yet. Our team can help by email.")}</p>)}
        <a className="lc-chat-email" href={`mailto:${EMAIL}`}><Mail size={16} />{t(EMAIL)}</a>
      </div> : <>
        <div ref={log} className="lc-chat-log" role="log" aria-live="polite" aria-label={t("Conversation messages")}>
          {t(!chat && <p role="status">{t("Loading conversation…")}</p>)}
          {t(chat?.messages.map(m => <div key={m.id} className={`lc-chat-message lc-chat-message--${m.role}`}><small>{t(({ assistant: 'Lumichan assistant', agent: 'Lumichan team', visitor: 'You', system: 'Conversation update' })[m.role])}</small><p><SupportMessageText text={m.body} /></p><time>{t(supportDate(m.created_at, getDateLocale()))}{t(" CST")}</time></div>))}
          {t(busy && <p role="status">{t("Sending…")}</p>)}
        </div>
        {t(chat?.state === 'ai' && <div className="lc-chat-topics">{t([['services', 'Our services'], ['pricing', 'Starting prices'], ['planning-five-days', '5-day planning'], ['contact', 'Contact the team']].map(([id, label]) => <button key={id} disabled={busy} onClick={() => send(label, id)}>{t(label)}</button>))}</div>)}
        {t(chat && <div className="lc-chat-controls">
          {t(chat.state !== 'closed' && <>
            <details><summary><Mail size={15} />{t(savedEmail ? 'Email saved' : 'Contact email (optional)')}</summary><form className="lc-chat-contact" onSubmit={async e => { e.preventDefault(); if (await run('contact', { email })) setSavedEmail(true) }}><label>{t("Email for Lumichan to follow up")}<input type="email" maxLength={200} placeholder={t(chat.email || 'you@example.com')} value={email} onChange={e => { setEmail(e.target.value); setSavedEmail(false) }} /></label><button disabled={busy} type="submit">{t("Save")}</button><small>{t("Saving allows the team to contact you about this conversation.")}</small></form></details>
            <form className="lc-chat-composer" onSubmit={e => { e.preventDefault(); send() }}><textarea aria-label={t("Your message")} maxLength={2000} rows={2} placeholder={t("Your question…")} value={text} onChange={e => setText(e.target.value)} /><button type="submit" disabled={busy || !text.trim()} title={t("Send message")} aria-label={t("Send message")}><Send size={19} /></button></form>
          </>)}
          {t(chat.state === 'closed' && <button className="lc-chat-primary" onClick={forget}><RotateCw size={16} />{t("Start a new conversation")}</button>)}
          <div className="lc-chat-tools"><button disabled={busy || chat.state !== 'ai'} onClick={() => run('handoff')}><UserRound size={15} />{t("Human support")}</button><button disabled={busy} title={t("Delete this conversation")} aria-label={t("Delete this conversation")} onClick={() => { if (confirm(t('Permanently delete this conversation and your saved contact details?'))) run('delete') }}><Trash2 size={16} /></button></div>
          {t((chat.state === 'waiting' || chat.state === 'human') && <p className="lc-chat-note">{t("Replies appear here. Keep this chat open or return on this browser. For email support: ")}<a href={`mailto:${EMAIL}`}>{t(EMAIL)}</a>.</p>)}
          <small className="lc-chat-expiry">{t("Scheduled deletion: ")}{t(supportDate(chat.expires_at, getDateLocale()))}{t(" CST")}</small>
        </div>)}
      </>)}
    </section>)}
  </div>
}
