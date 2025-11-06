'use client'
import { useEffect, useState } from 'react'

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handler(e: any) {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      
      // Show prompt after user has visited 2+ times
      const visitCount = parseInt(localStorage.getItem('visitCount') || '0')
      localStorage.setItem('visitCount', String(visitCount + 1))

      // Respect recent dismiss (7 days)
      const dismissedAt = parseInt(localStorage.getItem('installPromptDismissed') || '0')
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      const recentlyDismissed = dismissedAt && (Date.now() - dismissedAt) < sevenDaysMs

      // Don't show if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return
      }

      if (!recentlyDismissed && visitCount >= 2) {
        // Delay a bit so it doesn't fight with initial UI
        setTimeout(() => setVisible(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log('Install outcome:', outcome)
    setVisible(false)
    setDeferredPrompt(null)
  }

  function dismiss() {
    setVisible(false)
    // Don't show again for 7 days
    localStorage.setItem('installPromptDismissed', String(Date.now()))
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-md">
      <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <img src="/icons/icon-72.png" alt="VIVENTA" className="w-12 h-12 rounded-lg" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-base mb-1">
              Instalar VIVENTA
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Accede más rápido y busca propiedades sin conexión
            </p>
            <div className="flex gap-2">
              <button
                onClick={install}
                className="flex-1 px-4 py-2 bg-[#0B2545] text-white rounded-lg font-semibold text-sm hover:bg-[#00A676] transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
