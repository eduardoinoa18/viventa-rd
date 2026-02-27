import { requirePortalAccess } from '@/lib/auth/guards'
import AdminSidebar from '@/components/AdminSidebar'

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePortalAccess()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
