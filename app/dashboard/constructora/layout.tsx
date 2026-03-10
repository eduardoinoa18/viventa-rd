import ConstructoraSidebar from '@/components/ConstructoraSidebar'

export default function ConstructoraDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ConstructoraSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
