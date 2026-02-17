export default function MasterOverviewPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Master Control Overview
        </h1>
        <p className="text-gray-600 mb-8">
          Complete control of the Dominican Republic real estate network.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder stats cards */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#FF6B35]">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Total Users
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            <p className="text-sm text-gray-500 mt-1">Placeholder</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#0B2545]">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Active Listings
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            <p className="text-sm text-gray-500 mt-1">Placeholder</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Pending Leads
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            <p className="text-sm text-gray-500 mt-1">Placeholder</p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🚧 Phase 1: Shell Created
          </h3>
          <p className="text-blue-800">
            This is a placeholder page. No logic has been migrated from /admin yet.
            Phase 1 creates the namespace structure only.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            Next: Phase 2 will migrate dashboard → overview with real data.
          </p>
        </div>
      </div>
    </div>
  )
}
