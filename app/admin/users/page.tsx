// app/admin/users/page.tsx
'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'

type UserRow = { uid: string; name: string; email: string; role: string; status: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])

  useEffect(() => {
    // Replace with fetch('/api/admin/users') in production
    setUsers([
      { uid: 'u1', name: 'María Pérez', email: 'maria@demo.com', role: 'agent', status: 'approved' },
      { uid: 'u2', name: 'Carlos Gómez', email: 'carlos@demo.com', role: 'broker', status: 'approved' },
      { uid: 'u3', name: 'Admin Test', email: 'admin@viventa.com', role: 'master_admin', status: 'active' },
      { uid: 'u4', name: 'Ana García', email: 'ana@demo.com', role: 'agent', status: 'pending' }
    ])
  }, [])

  function handleSuspend(uid: string) {
    setUsers(users.map(u => u.uid === uid ? { ...u, status: 'suspended' } : u))
    // In production: await fetch('/api/admin/users/suspend', { method: 'POST', body: JSON.stringify({ uid }) })
  }

  function handleApprove(uid: string) {
    setUsers(users.map(u => u.uid === uid ? { ...u, status: 'approved' } : u))
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545]">User Management</h1>
            <button className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]">
              + Add User
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">{u.name}</td>
                    <td className="p-4 text-gray-600">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        u.status === 'approved' ? 'bg-green-100 text-green-800' :
                        u.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {u.status === 'pending' && (
                          <button 
                            onClick={() => handleApprove(u.uid)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Approve
                          </button>
                        )}
                        <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                          Edit
                        </button>
                        {u.status !== 'suspended' && (
                          <button 
                            onClick={() => handleSuspend(u.uid)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
