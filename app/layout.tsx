import './globals.css'
import Link from 'next/link'
import LocaleSwitcher from '../components/LocaleSwitcher'
export const metadata = {title:'VIVENTA MVP', description:'VIVENTA Lean MVP'}
export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="es">
      <body>
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="VIVENTA" className="h-10 w-10"/>
              <div>
                <div className="font-bold text-lg">VIVENTA</div>
                <div className="text-sm text-gray-500">Vive. Invierte. Confía.</div>
              </div>
            </div>
            <nav className="space-x-4 flex items-center">
              <Link href="/" className="text-sm">Inicio</Link>
              <Link href="/search" className="text-sm">Buscar</Link>
              <Link href="/agents" className="text-sm">Agentes</Link>
              <LocaleSwitcher />
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
  <footer className="mt-12 border-t pt-6 text-center text-sm text-gray-600">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <div>© {new Date().getFullYear()} VIVENTA</div>
            <div className="space-x-4">
              <a href="/admin" className="underline">Admin</a>
              <a href="/agent" className="underline">Agent</a>
              <a href="/auth" className="underline">Login</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
