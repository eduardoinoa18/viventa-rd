"use client";
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useRouter } from 'next/navigation'
import { getSession, saveSession } from '../../lib/authSession'

export default function OnboardingPage(){
  const router = useRouter()
  function complete(){
    const s = getSession();
    if(s){ s.profileComplete = true; saveSession(s) }
    router.replace('/dashboard')
  }
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Completa tu Perfil</h1>
        <div className="bg-white rounded shadow p-6 space-y-3">
          <input className="w-full border p-2 rounded" placeholder="Número de licencia" />
          <input className="w-full border p-2 rounded" placeholder="Nombre de agencia" />
          <input className="w-full border p-2 rounded" placeholder="Teléfono" />
          <button onClick={complete} className="px-4 py-2 bg-[#00A676] text-white rounded">Finalizar</button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
