import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircle, X, Send, UserRound, Trash2, Mail, ArrowRight, RotateCw } from 'lucide-react'
import { messageId, supportApi, supportDate } from '../lib/supportApi.js'
import './SupportChat.css'
import SupportMessageText from './SupportMessageText.jsx'

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
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [consent, setConsent] = useState(false)
  const [aiConsent, setAiConsent] = useState(false)
  const [text, setText] = useState('')
  const [email, setEmail] = useState('')
  const [savedEmail, setSavedEmail] = useState(false)
  const panel = useRef(null), launcher = useRef(null), log = useRef(null), draft = useRef(null), inFlight = useRef(false)
  const visible = open && pathname.startsWith('/traveler')

  function forget() {
    try { localStorage.removeItem(KEY) } catch { /* In-memory session still resets. */ }
    setSession(null); setChat(null); setEmail(''); setText(''); setSavedEmail(false); draft.current = null
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
      return true
    } catch (e) { setError(e.name === 'AbortError' ? 'Connection timed out. Please retry your message.' : e.message); if (e.status === 404) forget(); return false }
    finally { inFlight.current = false; setBusy(false) }
  }
  async function send(value = text, topic = '') {
    if (!value.trim()) return
    if (!draft.current || draft.current.text !== value || draft.current.topic !== topic) draft.current = { text: value, topic, request_id: messageId() }
    if (await run('message', draft.current)) { setText(''); draft.current = null }
  }
  if (!pathname.startsWith('/traveler')) return null
  return <div className="lc-chat">
    {!open && <button ref={launcher} className="lc-chat-launcher" aria-label="Chat with Lumichan" title="Chat with Lumichan" onClick={() => setOpen(true)}><MessageCircle size={24} /><span>Ask Lumichan</span></button>}
    {open && <section ref={panel} className="lc-chat-panel" role="dialog" aria-label="Lumichan travel support">
      <header className="lc-chat-header"><div><strong>LUMICHAN</strong><span>{chat ? states[chat.state] : 'A little local guidance'}</span></div><button title="Close chat" aria-label="Close chat" onClick={() => { setOpen(false); setTimeout(() => launcher.current?.focus(), 0) }}><X size={21} /></button></header>
      <div className="lc-chat-hours">Mon–Fri 08:30–16:00 · Sat–Sun 09:00–13:00<br />China time (UTC+8){settings && <span>{settings.office_open ? 'Within office hours' : 'Outside office hours'}</span>}</div>
      {error && <p className="lc-chat-error" role="alert">{error}</p>}
      {!session ? <div className="lc-chat-welcome">
        <MessageCircle size={32} /><h2>Where would you like to begin?</h2><p>Ask about journeys, planning support or how to book.</p>
        {!settings && !error && <p role="status">Connecting…</p>}
        {settings?.enabled && <form onSubmit={e => { e.preventDefault(); run('start', { consent, ai_consent: aiConsent, consent_version: settings.consent_version, language: navigator.language.startsWith('zh') ? 'zh' : 'en' }) }}>
          <label className="lc-chat-check"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I agree to storage of this chat and any contact details for 30 days from the start of this conversation, accessible to authorized Lumichan staff. <a href="/traveler/privacy" target="_blank" rel="noreferrer">Privacy Policy</a></span></label>
          <label className="lc-chat-check"><input type="checkbox" checked={aiConsent} onChange={e => setAiConsent(e.target.checked)} /><span>Allow my recent messages to be sent to DeepSeek for automated support (optional). Please do not share passport, payment or sensitive information.</span></label>
          <button className="lc-chat-primary" disabled={!consent || busy}>Start a conversation <ArrowRight size={17} /></button>
        </form>}
        {settings && !settings.enabled && <p>Live chat is not available yet. Our team can help by email.</p>}
        <a className="lc-chat-email" href={`mailto:${EMAIL}`}><Mail size={16} />{EMAIL}</a>
      </div> : <>
        <div ref={log} className="lc-chat-log" role="log" aria-live="polite" aria-label="Conversation messages">
          {!chat && <p role="status">Loading conversation…</p>}
          {chat?.messages.map(m => <div key={m.id} className={`lc-chat-message lc-chat-message--${m.role}`}><small>{({ assistant: 'Lumichan assistant', agent: 'Lumichan team', visitor: 'You', system: 'Conversation update' })[m.role]}</small><p><SupportMessageText text={m.body} /></p><time>{supportDate(m.created_at, 'en-GB')} CST</time></div>)}
          {busy && <p role="status">Sending…</p>}
        </div>
        {chat?.state === 'ai' && <div className="lc-chat-topics">{[['services', 'Our services'], ['pricing', 'Starting prices'], ['planning-five-days', '5-day planning'], ['contact', 'Contact the team']].map(([id, label]) => <button key={id} disabled={busy} onClick={() => send(label, id)}>{label}</button>)}</div>}
        {chat && <div className="lc-chat-controls">
          {chat.state !== 'closed' && <>
            <details><summary><Mail size={15} />{savedEmail ? 'Email saved' : 'Contact email (optional)'}</summary><form className="lc-chat-contact" onSubmit={async e => { e.preventDefault(); if (await run('contact', { email })) setSavedEmail(true) }}><label>Email for Lumichan to follow up<input type="email" maxLength={200} placeholder={chat.email || 'you@example.com'} value={email} onChange={e => { setEmail(e.target.value); setSavedEmail(false) }} /></label><button disabled={busy} type="submit">Save</button><small>Saving allows the team to contact you about this conversation.</small></form></details>
            <form className="lc-chat-composer" onSubmit={e => { e.preventDefault(); send() }}><textarea aria-label="Your message" maxLength={2000} rows={2} placeholder="Your question…" value={text} onChange={e => setText(e.target.value)} /><button type="submit" disabled={busy || !text.trim()} title="Send message" aria-label="Send message"><Send size={19} /></button></form>
          </>}
          {chat.state === 'closed' && <button className="lc-chat-primary" onClick={forget}><RotateCw size={16} />Start a new conversation</button>}
          <div className="lc-chat-tools"><button disabled={busy || chat.state !== 'ai'} onClick={() => run('handoff')}><UserRound size={15} />Human support</button><button disabled={busy} title="Delete this conversation" aria-label="Delete this conversation" onClick={() => { if (confirm('Permanently delete this conversation and your saved contact details?')) run('delete') }}><Trash2 size={16} /></button></div>
          {(chat.state === 'waiting' || chat.state === 'human') && <p className="lc-chat-note">Replies appear here. Keep this chat open or return on this browser. For email support: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>}
          <small className="lc-chat-expiry">Scheduled deletion: {supportDate(chat.expires_at, 'en-GB')} CST</small>
        </div>}
      </>}
    </section>}
  </div>
}
