import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import BrokerWorkspaceNav from '@/components/BrokerWorkspaceNav'

export default function BrokerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Broker Portal</p>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Broker Workspace</h1>
                <p className="text-sm text-gray-600">Navegación optimizada para operación diaria, equipo y pipeline.</p>
              </div>
              <Link href="/dashboard" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Volver</Link>
            </div>
            <BrokerWorkspaceNav />
          </section>
          {children}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
