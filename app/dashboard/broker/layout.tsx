import BrokerSidebar from '@/components/BrokerSidebar'
import WorkspaceHeaderBar from '@/components/WorkspaceHeaderBar'

export default function BrokerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <BrokerSidebar />
      <main className="flex-1 min-w-0">
        <WorkspaceHeaderBar
          eyebrow="Portal del Bróker"
          title="Workspace del Bróker"
          subtitle="Navegación lateral unificada para CRM, actividad, transacciones y equipo."
        />
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}
