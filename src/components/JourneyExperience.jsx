import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { t } from '../i18n/runtime.js'
import JourneyMedia from './JourneyMedia.jsx'
export default function JourneyExperience({item,index}) {
  const slides = item.slides?.length === 4 ? item.slides : [item.image]
  const [active,setActive] = useState(0), [paused,setPaused] = useState(false), [hover,setHover] = useState(false), [focus,setFocus] = useState(false), [hidden,setHidden] = useState(document.hidden), [reduced,setReduced] = useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(media.matches), visibility=()=>setHidden(document.hidden);media.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);return()=>{media.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility)}},[])
  useEffect(()=>{if(slides.length<2||paused||hover||focus||hidden||reduced)return;const timer=setInterval(()=>setActive(value=>(value+1)%slides.length),4200);return()=>clearInterval(timer)},[slides.length,paused,hover,focus,hidden,reduced])
  return <article className="jv-experience" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocus(false)}}>
    <div className="jv-slideshow" role={slides.length>1?'group':undefined} aria-roledescription={slides.length>1?'carousel':undefined} aria-label={t(item.title)}>
      <div className="jv-frames">{slides.map((media,i)=><div className={'jv-frame '+(i===active?'is-active':'')} aria-hidden={i!==active} key={i}><JourneyMedia media={media}/></div>)}</div>
      {slides.length>1 && <div className="jv-slide-controls"><div className="jv-dots" aria-label={t('Select image')}>{slides.map((media,i)=><button type="button" key={i} aria-label={`${t('Show image')} ${i+1}: ${t(media.caption)}`} aria-pressed={i===active} onClick={()=>setActive(i)}/>)}</div><button className="jv-play" type="button" aria-label={t(paused?'Play slideshow':'Pause slideshow')} aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></div>}
    </div>
    <div className="jv-experience-copy"><p className="jv-eyebrow">{t('Experience')} {String(index+1).padStart(2,'0')}</p><h3>{t(item.title)}</h3><p>{t(item.body)}</p></div>
  </article>
}
