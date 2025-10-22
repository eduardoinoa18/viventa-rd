import './globals.css'
import Link from 'next/link'
import LocaleSwitcher from '../components/LocaleSwitcher'
import { Toaster } from 'react-hot-toast'
export const metadata = {title:'VIVENTA MVP', description:'VIVENTA Lean MVP'}
export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        {/* Use only the new Header and Footer components for global layout */}
        {children}
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
