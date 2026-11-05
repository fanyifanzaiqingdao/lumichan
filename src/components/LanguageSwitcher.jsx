import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, Globe2 } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageProvider.jsx'
import { LOCALES, localeFor } from '../i18n/locales.js'
import { t } from '../i18n/runtime.js'
import './LanguageSwitcher.css'
export default function LanguageSwitcher() {
  const {language,changeLanguage,changing,error}=useLanguage()
  const [open,setOpen]=useState(false)
  const root=useRef(null), trigger=useRef(null), menu=useRef(null)
  useEffect(()=>{
    if(!open)return
    const dismiss=event=>{if(!root.current?.contains(event.target))setOpen(false)}
    document.addEventListener('pointerdown',dismiss)
    const options=[...menu.current.querySelectorAll('button')];options.find(button=>button.getAttribute('aria-checked')==='true')?.focus()
    return()=>document.removeEventListener('pointerdown',dismiss)
  },[open])
  function keys(event){
    if(event.key==='Escape'){setOpen(false);trigger.current?.focus();return}
    const options=[...menu.current.querySelectorAll('button')], index=options.indexOf(document.activeElement)
    const next=event.key==='ArrowDown'?(index+1)%options.length:event.key==='ArrowUp'?(index-1+options.length)%options.length:event.key==='Home'?0:event.key==='End'?options.length-1:null
    if(next!==null){event.preventDefault();options[next]?.focus()}
    if(event.key==='Tab')setOpen(false)
  }
  return <div className="language-switcher" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}>
    <button ref={trigger} type="button" className="language-trigger" aria-label={t('Website language')} aria-haspopup="menu" aria-expanded={open} disabled={changing} onClick={()=>setOpen(value=>!value)}><Globe2 size={15}/><span lang={localeFor(language).html}>{localeFor(language).short}</span><ChevronDown size={12}/></button>
    {open&&<div ref={menu} className="language-menu" role="menu" aria-label={t('Website language')} onKeyDown={keys}>{LOCALES.map(locale=><button type="button" role="menuitemradio" aria-checked={locale.code===language} key={locale.code} lang={locale.html} disabled={changing} onClick={async()=>{await changeLanguage(locale.code);setOpen(false);trigger.current?.focus()}}><span>{locale.name}</span>{locale.code===language&&<Check size={17}/>}</button>)}</div>}
    {error&&<span className="language-error" role="alert">{t(error)}</span>}
  </div>
}
