import AgentSidebar from '@/components/AgentSidebar'
import WorkspaceHeaderBar from '@/components/WorkspaceHeaderBar'

export default function AgentDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AgentSidebar />
      <main className="flex-1 min-w-0">
        <WorkspaceHeaderBar
          eyebrow="Agent Portal"
          title="Agent Workspace"
          subtitle="Una sola navegación lateral para leads, comisiones y listados."
        />
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}
