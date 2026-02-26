'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { FiUserPlus, FiEdit, FiUserX, FiUserCheck, FiTrash2, FiSearch, FiFilter, FiMail, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'
import CreateBrokerModal from '@/components/admin/CreateBrokerModal'
import CreateAgentModal from '@/components/admin/CreateAgentModal'
import CreateConstructoraModal from '@/components/admin/CreateConstructoraModal'
import CreateBuyerModal from '@/components/admin/CreateBuyerModal'
import EditUserModal from '@/components/admin/EditUserModal'

type User = {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  status: string
  brokerage?: string
  company?: string
  photoURL?: string
  emailVerified?: boolean
  disabled?: boolean
  lastLoginAt?: any
  uid?: string
  agentCode?: string
  brokerCode?: string
}

export default function MasterUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modal states
  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [showConstructoraModal, setShowConstructoraModal] = useState(false)
  const [showBuyerModal, setShowBuyerModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    agents: users.filter(u => u.role === 'agent').length,
    brokers: users.filter(u => u.role === 'broker').length,
    buyers: users.filter(u => u.role === 'buyer' || u.role === 'user').length,
    invited: users.filter(u => u.status === 'invited').length,
    active: users.filter(u => u.status === 'active' && !u.disabled).length,
    inactive: users.filter(u => u.status === 'inactive' || u.status === 'suspended' || u.disabled).length,
  }), [users])

  // Filtered users
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'buyer') {
        filtered = filtered.filter(u => u.role === 'buyer' || u.role === 'user')
      } else {
        filtered = filtered.filter(u => u.role === roleFilter)
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(u => u.status === 'active' && !u.disabled)
      } else {
        filtered = filtered.filter(u => u.status === 'inactive' || u.disabled)
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query) ||
        u.agentCode?.toLowerCase().includes(query) ||
        u.brokerCode?.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => a.name?.localeCompare(b.name || '') || 0)
  }, [users, roleFilter, statusFilter, searchQuery])

  useEffect(() => {
    loadUsers()
  }, [])

  const getUiErrorMessage = (status?: number) => {
    if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente para continuar.'
    if (status === 403) return 'No tienes permisos para ver la gestión de usuarios.'
    return 'No se pudo cargar la lista de usuarios.'
  }

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      const json = await res.json()
      if (!res.ok || !json.ok) {
        const message = json?.error || getUiErrorMessage(res.status)
        setError(message)
        toast.error(message)
        setUsers([])
        return
      }

      if (Array.isArray(json.data)) {
        setUsers(json.data)
      }
    } catch (e) {
      console.error('Failed to load users', e)
      const message = getUiErrorMessage()
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleStatus(uid: string, currentDisabled: boolean) {
    const action = currentDisabled ? 'enable' : 'disable'
    if (!confirm(`${action === 'enable' ? 'Enable' : 'Disable'} this user account?`)) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: uid, 
          disabled: !currentDisabled,
          status: currentDisabled ? 'active' : 'inactive'
        }),
      })
      const json = await res.json()
      if (json.ok) {
        toast.success(`User ${action}d successfully`)
        loadUsers()
      } else {
        toast.error(json.error || `Failed to ${action} user`)
      }
    } catch (e) {
      console.error(`Failed to ${action} user`, e)
      toast.error(`Failed to ${action} user`)
    }
  }

  async function deleteUser(uid: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uid }),
      })
      const json = await res.json()
      if (json.ok) {
        toast.success('User deleted')
        loadUsers()
      } else {
        toast.error(json.error || 'Failed to delete user')
      }
    } catch (e) {
      console.error('Failed to delete user', e)
      toast.error('Failed to delete user')
    }
  }

  async function resendInvite(userId: string) {
    try {
      const res = await fetch('/api/admin/users/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error || 'Failed to resend invite')
        return
      }
      toast.success('Invitation resent successfully')
      loadUsers()
    } catch (e) {
      console.error('Failed to resend invite', e)
      toast.error('Failed to resend invite')
    }
  }

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      agent: 'bg-blue-100 text-blue-800',
      broker: 'bg-purple-100 text-purple-800',
      buyer: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800',
      master_admin: 'bg-red-100 text-red-800',
    }
    const labels: Record<string, string> = {
      agent: 'Agent',
      broker: 'Broker',
      buyer: 'Buyer',
      user: 'User',
      master_admin: 'Master Admin',
    }
    return { style: styles[role] || 'bg-gray-100 text-gray-800', label: labels[role] || role }
  }

  const formatDate = (date: any) => {
    if (!date) return '—'
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      return d.toLocaleDateString()
    } catch {
      return '—'
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage all users across the platform</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBrokerModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiUserPlus className="w-4 h-4" />
                Broker
              </button>
              <button
                onClick={() => setShowAgentModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiUserPlus className="w-4 h-4" />
                Agent
              </button>
              <button
                onClick={() => setShowConstructoraModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                <FiUserPlus className="w-4 h-4" />
                Constructora
              </button>
              <button
                onClick={() => setShowBuyerModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiUserPlus className="w-4 h-4" />
                Buyer
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600">Total Users</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4 cursor-pointer hover:border-blue-300" onClick={() => setRoleFilter('agent')}>
            <div className="text-sm font-medium text-blue-700">Agents</div>
            <div className="text-3xl font-bold text-blue-900">{stats.agents}</div>
          </div>
          <div className="bg-white rounded-lg border border-purple-200 p-4 cursor-pointer hover:border-purple-300" onClick={() => setRoleFilter('broker')}>
            <div className="text-sm font-medium text-purple-700">Brokers</div>
            <div className="text-3xl font-bold text-purple-900">{stats.brokers}</div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 cursor-pointer hover:border-green-300" onClick={() => setRoleFilter('buyer')}>
            <div className="text-sm font-medium text-green-700">Buyers</div>
            <div className="text-3xl font-bold text-green-900">{stats.buyers}</div>
          </div>
          <div className="bg-white rounded-lg border border-emerald-200 p-4 cursor-pointer hover:border-emerald-300" onClick={() => setStatusFilter('active')}>
            <div className="text-sm font-medium text-emerald-700 flex items-center gap-1">
              <FiUserCheck className="w-4 h-4" />
              Active
            </div>
            <div className="text-3xl font-bold text-emerald-900">{stats.active}</div>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4 cursor-pointer hover:border-red-300" onClick={() => setStatusFilter('inactive')}>
            <div className="text-sm font-medium text-red-700 flex items-center gap-1">
              <FiUserX className="w-4 h-4" />
              Inactive
            </div>
            <div className="text-3xl font-bold text-red-900">{stats.inactive}</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by role"
              >
                <option value="all">All Roles</option>
                <option value="agent">Agents</option>
                <option value="broker">Brokers</option>
                <option value="buyer">Buyers</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {error && !loading && (
            <div className="p-4 border-b border-red-100 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando usuarios...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-gray-500 text-lg">No se encontraron usuarios</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const roleBadge = getRoleBadge(user.role)
                    const isDisabled = user.disabled || user.status === 'inactive' || user.status === 'suspended'
                    const isInvited = user.status === 'invited'
                    
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${isDisabled ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.name} className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">{user.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FiMail className="w-3 h-3" />
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <FiPhone className="w-3 h-3" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${roleBadge.style}`}>
                            {roleBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-gray-700">
                            {user.agentCode || user.brokerCode || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.brokerage || user.company || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            isInvited
                              ? 'bg-yellow-100 text-yellow-800'
                              : isDisabled
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isInvited ? 'Invited' : isDisabled ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Link
                              href={`/master/users/${user.id}`}
                              className="inline-flex items-center gap-2 px-3 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 text-sm font-medium rounded-lg transition-colors"
                              title="View user performance"
                            >
                              View
                            </Link>
                            {isInvited && (
                              <button
                                onClick={() => resendInvite(user.id)}
                                className="inline-flex items-center gap-2 px-3 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-sm font-medium rounded-lg transition-colors"
                                title="Resend invite"
                              >
                                <FiMail className="w-4 h-4" />
                                Resend Invite
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingUser(user)
                                setShowEditModal(true)
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 text-sm font-medium rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <FiEdit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => toggleStatus(user.uid || user.id, isDisabled)}
                              className={`inline-flex items-center gap-2 px-3 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                                isDisabled
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'bg-yellow-500 hover:bg-yellow-600'
                              }`}
                              title={isDisabled ? 'Enable user' : 'Disable user'}
                            >
                              {isDisabled ? <FiUserCheck className="w-4 h-4" /> : <FiUserX className="w-4 h-4" />}
                              {isDisabled ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              onClick={() => deleteUser(user.uid || user.id, user.name)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                              title="Delete user"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Role Creation Modals */}
      <CreateBrokerModal
        isOpen={showBrokerModal}
        onClose={() => setShowBrokerModal(false)}
        onSuccess={() => loadUsers()}
      />
      <CreateAgentModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        onSuccess={() => loadUsers()}
      />
      <CreateConstructoraModal
        isOpen={showConstructoraModal}
        onClose={() => setShowConstructoraModal(false)}
        onSuccess={() => loadUsers()}
      />
      <CreateBuyerModal
        isOpen={showBuyerModal}
        onClose={() => setShowBuyerModal(false)}
        onSuccess={() => loadUsers()}
      />
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingUser(null)
        }}
        onSuccess={() => loadUsers()}
        user={editingUser}
      />
    </div>
  )
}

