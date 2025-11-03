'use client'
import { useState, useEffect } from 'react'
import { FiGlobe } from 'react-icons/fi'

export default function LocaleSwitcher() {
  const [lang, setLang] = useState('es')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const l = localStorage.getItem('viventa_lang') || 'es'
    setLang(l)
  }, [])

  function toggle() {
    const next = lang === 'es' ? 'en' : 'es'
    try {
      localStorage.setItem('viventa_lang', next)
      setLang(next)
      // Force reload to apply language changes
      window.location.href = window.location.href
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg border-2 border-viventa-turquoise text-viventa-turquoise font-semibold hover:bg-viventa-turquoise hover:text-white transition-all">
        <FiGlobe className="text-lg" />
        <span className="hidden sm:inline text-sm">ES</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg border-2 border-viventa-turquoise text-viventa-turquoise font-semibold hover:bg-viventa-turquoise hover:text-white transition-all active:scale-95"
      aria-label={`Switch to ${lang === 'es' ? 'English' : 'Spanish'}`}
    >
      <FiGlobe className="text-lg" />
      <span className="hidden sm:inline text-sm font-bold">
        {lang === 'es' ? 'ES' : 'EN'}
      </span>
    </button>
  )
}
