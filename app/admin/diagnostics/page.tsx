'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { FiRefreshCw, FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi'

export default function AdminDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/diagnostics')
      const json = await res.json()
      if (json.ok) setDiagnostics(json.data)
    } catch (e) {
      console.error('Failed to load diagnostics', e)
    } finally {
      setLoading(false)
    }
  }

  function StatusIndicator({ status }: { status: boolean | string }) {
    if (status === true) return <FiCheck className="text-green-600 text-xl" />
    if (status === false) return <FiX className="text-red-600 text-xl" />
    return <FiAlertTriangle className="text-yellow-600 text-xl" />
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545]">System Diagnostics</h1>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {loading && !diagnostics ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto mb-4"></div>
              <p>Loading diagnostics...</p>
            </div>
          ) : diagnostics ? (
            <div className="space-y-6">
              {/* Firebase Status */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-[#0B2545] to-[#00A676] p-4">
                  <h2 className="text-xl font-bold text-white">Firebase Configuration</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(diagnostics.firebase || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{key}</span>
                        <StatusIndicator status={value as boolean} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Firestore Collections Data */}
              {diagnostics.firestoreData && typeof diagnostics.firestoreData === 'object' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-gradient-to-r from-[#00A676] to-[#00A6A6] p-4">
                    <h2 className="text-xl font-bold text-white">Firestore Collections</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {Object.entries(diagnostics.firestoreData).map(([collectionName, collectionData]: [string, any]) => {
                      if (collectionName === 'error') {
                        return (
                          <div key="error" className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                            <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                              <FiX /> Firebase Connection Error
                            </div>
                            <p className="text-red-700">{collectionData}</p>
                          </div>
                        )
                      }

                      return (
                        <div key={collectionName} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              {collectionData.exists ? (
                                <FiCheck className="text-green-600" />
                              ) : (
                                <FiX className="text-red-600" />
                              )}
                              {collectionName}
                            </h3>
                            {collectionData.count !== undefined && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {collectionData.count} documents
                              </span>
                            )}
                          </div>
                          
                          {collectionData.error && (
                            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                              Error: {collectionData.error}
                            </div>
                          )}
                          
                          {collectionData.sampleData && collectionData.sampleData.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600 mb-2">Sample data:</p>
                              <div className="bg-gray-50 rounded p-3 text-xs font-mono space-y-2">
                                {collectionData.sampleData.map((item: any, idx: number) => (
                                  <div key={idx} className="flex flex-wrap gap-x-4 gap-y-1 text-gray-700">
                                    <span><span className="text-gray-500">ID:</span> {item.id}</span>
                                    {item.role && <span><span className="text-gray-500">Role:</span> {item.role}</span>}
                                    {item.status && <span><span className="text-gray-500">Status:</span> {item.status}</span>}
                                    {item.email && <span><span className="text-gray-500">Email:</span> {item.email}</span>}
                                    <span><span className="text-gray-500">Created:</span> {item.createdAt}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {collectionData.count === 0 && (
                            <div className="text-yellow-600 text-sm bg-yellow-50 p-2 rounded flex items-center gap-2">
                              <FiAlertTriangle /> Collection is empty - no documents found
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Other Services */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Algolia */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-blue-600 p-4">
                    <h2 className="text-lg font-bold text-white">Algolia Search</h2>
                  </div>
                  <div className="p-4 space-y-2">
                    {Object.entries(diagnostics.algolia || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-700">{key}</span>
                        <StatusIndicator status={value as boolean} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-purple-600 p-4">
                    <h2 className="text-lg font-bold text-white">Email Service</h2>
                  </div>
                  <div className="p-4 space-y-2">
                    {Object.entries(diagnostics.email || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-700">{key}</span>
                        <StatusIndicator status={value as boolean} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-center text-sm text-gray-500">
                Last checked: {diagnostics.timestamp ? new Date(diagnostics.timestamp).toLocaleString() : 'Unknown'}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p>Failed to load diagnostics</p>
            </div>
          )}
        </main>
      </div>
    </ProtectedClient>
  )
}
