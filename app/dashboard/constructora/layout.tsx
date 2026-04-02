import ConstructoraSidebar from '@/components/ConstructoraSidebar'
import WorkspaceHeaderBar from '@/components/WorkspaceHeaderBar'

export default function ConstructoraDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ConstructoraSidebar />
      <main className="flex-1 min-w-0">
        <WorkspaceHeaderBar
          eyebrow="Constructora Portal"
          title="Constructora Workspace"
          subtitle="Navegación lateral para proyectos, inventario, reservas, deals, tasks, clientes y actividad."
        />
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}
