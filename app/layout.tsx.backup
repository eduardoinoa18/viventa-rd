import './globals.css'
import Link from 'next/link'
import LocaleSwitcher from '../components/LocaleSwitcher'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '../components/ErrorBoundary'
import ServiceWorkerManager from '../components/ServiceWorkerManager'
import PwaInstallPrompt from '../components/PwaInstallPrompt'
import OfflineIndicator from '../components/OfflineIndicator'
import BottomNav from '../components/BottomNav'

export const metadata = {
  title: 'VIVENTA - Tu Espacio, Tu Futuro',
  description: 'Plataforma inmobiliaria líder en República Dominicana',
  manifest: '/manifest.json',
}

export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
  <meta name="theme-color" content="#0B2545" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="VIVENTA" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="format-detection" content="telephone=no" />
      </head>
      <body suppressHydrationWarning>
  <ServiceWorkerManager />
  <PwaInstallPrompt />
  <OfflineIndicator />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <BottomNav />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#00A676',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
