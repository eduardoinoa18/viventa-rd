'use client'

interface ListingStatsProps {
  total: number
  published: number
  draft: number
  archived: number
}

export default function ListingStats({ total, published, draft, archived }: ListingStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-gray-600 text-sm mb-1">Total</div>
        <div className="text-2xl font-bold text-[#0B2545]">{total}</div>
      </div>
      
      <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
        <div className="text-green-700 text-sm mb-1">Publicadas</div>
        <div className="text-2xl font-bold text-green-700">{published}</div>
      </div>
      
      <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
        <div className="text-yellow-700 text-sm mb-1">Borradores</div>
        <div className="text-2xl font-bold text-yellow-700">{draft}</div>
      </div>
      
      <div className="bg-gray-50 rounded-lg shadow p-4 border border-gray-200">
        <div className="text-gray-700 text-sm mb-1">Archivadas</div>
        <div className="text-2xl font-bold text-gray-700">{archived}</div>
      </div>
    </div>
  )
}
