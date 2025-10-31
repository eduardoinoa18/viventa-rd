import './globals.css'
import Link from 'next/link'
import LocaleSwitcher from '../components/LocaleSwitcher'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '../components/ErrorBoundary'
import ServiceWorkerManager from '../components/ServiceWorkerManager'
import PwaInstallPrompt from '../components/PwaInstallPrompt'
import OfflineIndicator from '../components/OfflineIndicator'
import Script from 'next/script'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com'),
  title: {
    default: 'VIVENTA - Tu Espacio, Tu Futuro',
    template: '%s | VIVENTA'
  },
  description: 'Plataforma inmobiliaria líder en República Dominicana. Encuentra casas, apartamentos, villas y terrenos en Santo Domingo, Punta Cana, Santiago y más. Agentes verificados y transacciones seguras.',
  keywords: ['bienes raíces', 'propiedades República Dominicana', 'casas en venta', 'apartamentos Santo Domingo', 'inmobiliaria RD', 'VIVENTA', 'real estate', 'Punta Cana properties', 'Santiago real estate', 'inversión inmobiliaria'],
  authors: [{ name: 'VIVENTA' }],
  creator: 'VIVENTA',
  publisher: 'VIVENTA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'es_DO',
    url: '/',
    siteName: 'VIVENTA',
    title: 'VIVENTA - Tu Espacio, Tu Futuro',
    description: 'Plataforma inmobiliaria líder en República Dominicana',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VIVENTA - Plataforma Inmobiliaria',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIVENTA - Tu Espacio, Tu Futuro',
    description: 'Plataforma inmobiliaria líder en República Dominicana',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
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
  {process.env.NEXT_PUBLIC_GA_ID ? (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-gtag" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);} 
        gtag('js', new Date());
        gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
          anonymize_ip: true
        });
      `}} />
    </>
  ) : null}
      </head>
      <body suppressHydrationWarning>
  <ServiceWorkerManager />
  <PwaInstallPrompt />
  <OfflineIndicator />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
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
