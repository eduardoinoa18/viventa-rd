'use client'
import {useState, useEffect} from 'react'
export default function LocaleSwitcher(){
  const [lang,setLang] = useState('es')
  useEffect(()=> {
    const l = localStorage.getItem('viventa_lang') || 'es'
    setLang(l)
  },[])
  function toggle(){
    const next = lang === 'es' ? 'en' : 'es'
    localStorage.setItem('viventa_lang', next)
    setLang(next)
    // simple page reload to pick translations
    location.reload()
  }
  return (
    <button onClick={toggle} className="px-3 py-1 border rounded text-sm">
      {lang === 'es' ? 'ES' : 'EN'}
    </button>
  )
}
