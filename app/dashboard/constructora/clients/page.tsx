'use client'

import Link from 'next/link'

export default function ConstructoraClientsPage() {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#0B2545]">Clients</h2>
      <p className="mt-1 text-sm text-gray-600">
        Esta vista unifica compradores vinculados a reservas y deals. Usa el pipeline de deals para gestionar avance comercial.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/constructora/deals" className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
          Ir a Deals
        </Link>
        <Link href="/dashboard/constructora/reservations" className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
          Ir a Reservas
        </Link>
      </div>
    </section>
  )
}