import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

export default function AgentDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Agent Workspace</h1>
                <p className="text-sm text-gray-600">Panel modular estilo Master Admin para operación de agente.</p>
              </div>
              <Link href="/dashboard" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Volver</Link>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-sm">
              <Link href="/dashboard/agent/overview" className="text-center px-3 py-2 rounded-lg border border-gray-200 text-[#0B2545] font-medium">Overview</Link>
              <Link href="/dashboard/agent/crm" className="text-center px-3 py-2 rounded-lg border border-gray-200 text-[#0B2545] font-medium">CRM</Link>
              <Link href="/dashboard/listings" className="text-center px-3 py-2 rounded-lg border border-gray-200 text-[#0B2545] font-medium">Listings</Link>
              <Link href="/dashboard/listings/create" className="text-center px-3 py-2 rounded-lg border border-gray-200 text-[#0B2545] font-medium">Crear</Link>
              <Link href="/dashboard/settings" className="text-center px-3 py-2 rounded-lg border border-gray-200 text-[#0B2545] font-medium">Perfil</Link>
              <Link href="/messages" className="text-center px-3 py-2 rounded-lg border border-gray-200 text-[#0B2545] font-medium">Mensajes</Link>
              <Link href="/notifications" className="text-center px-3 py-2 rounded-lg border border-gray-200 text-[#0B2545] font-medium">Alertas</Link>
            </div>
          </section>
          {children}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
