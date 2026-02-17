import { requireMasterAdmin } from '@/lib/auth/guards'
import MasterSidebar from '@/components/MasterSidebar'

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Unified guard - single source of truth
  // Checks: admin_gate_ok, role === 'master_admin', admin_2fa_ok
  await requireMasterAdmin()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MasterSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
