import './globals.css'
import Link from 'next/link'
import LocaleSwitcher from '../components/LocaleSwitcher'
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
      </body>
    </html>
  )
}
