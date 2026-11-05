import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getLanguage, setLanguage, setOverrides, loadLanguage, hasCatalog, t } from './runtime.js'
import { localeFor, isLanguage } from './locales.js'
import { isPublicPath, pathLanguage, localizedPath } from './routes.js'
const LanguageContext = createContext(null)
export function LanguageProvider({ children }) {
  const location = useLocation(), navigate = useNavigate()
  const [preferred, update] = useState(getLanguage)
  const [revision, setRevision] = useState(0)
  const [changing,setChanging] = useState(false), [error,setError] = useState('')
  const language = isPublicPath(location.pathname) ? pathLanguage(location.pathname) : preferred
  const ready=hasCatalog(language)
  if (ready) setLanguage(language)
  async function changeLanguage(value) {
    if (changing) return
    const next = isLanguage(value) ? value : 'en'
    setChanging(true);setError('')
    try {
      await loadLanguage(next)
      setLanguage(next);update(next)
      if (isPublicPath(location.pathname)) navigate(localizedPath(location.pathname + location.search + location.hash,next),{preventScrollReset:true,state:{...location.state,localeSwitch:true}})
    } catch {setError('Could not load language. Please try again.')} finally {setChanging(false)}
  }
  useEffect(()=>{
    let active=true
    if (!ready) loadLanguage(language).then(()=>{if(active)setRevision(v=>v+1)}).catch(()=>{if(active)setError('Could not load language. Please try again.')})
    return()=>{active=false}
  },[language,ready])
  useEffect(() => { if(ready)update(language) }, [language,ready])
  useEffect(() => {
    const controller=new AbortController()
    fetch('/api/translations.php',{signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{setOverrides(data.entries||[]);setRevision(v=>v+1)}).catch(()=>{})
    return()=>controller.abort()
  },[])
  if(!ready)return <main className="locale-loading" role="status"><p>{localeFor(language).loading}</p>{error&&<><p>{localeFor(language).loadError}</p><button type="button" onClick={()=>{setError('');loadLanguage(language).then(()=>setRevision(v=>v+1)).catch(()=>setError('Could not load language. Please try again.'))}}>{localeFor(language).retry}</button></>}</main>
  return <LanguageContext.Provider value={{language,changeLanguage,revision,changing,error}}>{children}</LanguageContext.Provider>
}
export const useLanguage = () => useContext(LanguageContext)
