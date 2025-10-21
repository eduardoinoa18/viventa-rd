import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function AuthPage() {
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
        <div className="mt-4 text-center text-sm text-gray-600">
          ¿No tienes cuenta? <a href="#" className="text-[#3BAFDA] font-semibold">Regístrate</a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
