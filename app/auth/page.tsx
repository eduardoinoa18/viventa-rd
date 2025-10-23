'use client'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { loginDemo } from '../../lib/authClient'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()

  async function demoAdmin() {
    await loginDemo('admin@viventa.com', 'master_admin')
    router.push('/admin')
  }

  async function demoAgent() {
    await loginDemo('agent@demo.com', 'agent')
    router.push('/dashboard/agent')
  }

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-md mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-[#0B2545]">Iniciar Sesión / Registrarse</h1>
        <form className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
          <input placeholder="Email" className="px-3 py-2 border rounded" />
          <input placeholder="Contraseña" type="password" className="px-3 py-2 border rounded" />
          <button type="submit" className="px-6 py-2 bg-[#00A676] text-white rounded font-semibold">Entrar</button>
        </form>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-blue-900 mb-3">🔧 Demo Logins (Development Only)</div>
          <div className="space-y-2">
            <button 
              onClick={demoAdmin}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              Login as Master Admin
            </button>
            <button 
              onClick={demoAgent}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              Login as Agent
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          ¿No tienes cuenta? <a href="/signup" className="text-[#3BAFDA] font-semibold">Regístrate</a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
