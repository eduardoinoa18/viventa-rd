'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { FiUserPlus, FiEdit, FiUserX, FiUserCheck, FiTrash2, FiSearch, FiFilter, FiMail, FiPhone, FiKey, FiLogIn, FiMenu, FiChevronDown, FiMoreVertical } from 'react-icons/fi'
import toast from 'react-hot-toast'
import CreateBrokerModal from '@/components/admin/CreateBrokerModal'
import CreateAgentModal from '@/components/admin/CreateAgentModal'
import CreateConstructoraModal from '@/components/admin/CreateConstructoraModal'
import CreateBuyerModal from '@/components/admin/CreateBuyerModal'
import EditUserModal from '@/components/admin/EditUserModal'
import OnboardingQuestionnaireModal from '@/components/admin/OnboardingQuestionnaireModal'
import NotificationCenter from '@/components/NotificationCenter'

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
  createdAt?: any
  complianceReviewRequired?: boolean
  complianceReviewStatus?: string
  onboardingQuestionnaire?: Record<string, any>
  onboardingStatus?: string
  publicProfileEnabled?: boolean
}

type UsersOverview = {
  totals: {
    totalUsers: number
    invitedPending: number
    stalledInvites: number
    suspendedUsers: number
    unverifiedActive: number
    onboardingCompletionRate: number
  }
  pendingApplications: {
    total: number
    byType: Record<string, number>
  }
  governance: {
    lifecycleEvents7d: number
  }
}

export default function MasterUsersPage() {
  const [sessionRole, setSessionRole] = useState<string>('master_admin')
  const [sessionUid, setSessionUid] = useState<string>('')
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonationAdminEmail, setImpersonationAdminEmail] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [overview, setOverview] = useState<UsersOverview | null>(null)
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
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [onboardingUser, setOnboardingUser] = useState<User | null>(null)
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)

  const isBrokerView = sessionRole === 'broker'
  const canViewPeople = sessionRole === 'master_admin' || sessionRole === 'admin' || sessionRole === 'broker'
  const masterOpsLinks = [
    { href: '/master/offices', label: 'Offices' },
    { href: '/master/users', label: 'People' },
    { href: '/master/buyers', label: 'Buyers' },
    { href: '/master/applications', label: 'Applications' },
    { href: '/master/leads', label: 'Leads' },
    { href: '/master/listings', label: 'Listings' },
    { href: '/master/activity', label: 'Activity' },
    { href: '/master/analytics', label: 'Analytics' },
    { href: '/master/settings', label: 'Settings' },
  ]

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
    const init = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' })
        const sessionJson = await sessionRes.json().catch(() => ({}))
        const nextRole = String(sessionJson?.session?.role || 'master_admin')
        const nextUid = String(sessionJson?.session?.uid || '')
        const impersonation = sessionJson?.session?.impersonation
        setSessionRole(nextRole)
        setSessionUid(nextUid)
        setIsImpersonating(Boolean(impersonation?.active))
        setImpersonationAdminEmail(String(impersonation?.adminEmail || ''))
        if (nextRole === 'master_admin' || nextRole === 'admin' || nextRole === 'broker') {
          await loadUsers(nextRole)
        } else {
          setUsers([])
          setOverview(null)
          setLoading(false)
        }
      } finally {
        setSessionReady(true)
      }
    }

    init()
  }, [])

  const getUiErrorMessage = (status?: number) => {
    if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente para continuar.'
    if (status === 403) return 'No tienes permisos para ver la gestión de usuarios.'
    return 'No se pudo cargar la lista de usuarios.'
  }

  async function loadUsers(currentRole: string = sessionRole) {
    setLoading(true)
    setError(null)
    try {
      if (currentRole === 'broker') {
        const teamRes = await fetch('/api/broker/team')
        const teamJson = await teamRes.json().catch(() => ({}))
        if (!teamRes.ok || !teamJson?.ok) {
          const message = teamJson?.error || getUiErrorMessage(teamRes.status)
          setError(message)
          toast.error(message)
          setUsers([])
          setOverview(null)
          return
        }

        const mappedTeam = Array.isArray(teamJson?.members)
          ? teamJson.members.map((member: any) => ({
              id: String(member.id || ''),
              uid: String(member.id || ''),
              name: String(member.name || member.email || 'Miembro'),
              email: String(member.email || ''),
              role: String(member.role || 'agent'),
              status: String(member.status || 'active'),
              brokerage: '',
              company: '',
            }))
          : []

        setUsers(mappedTeam)
        setOverview(null)
        return
      }

      const [usersRes, overviewRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/users/overview'),
      ])

      const [json, overviewJson] = await Promise.all([usersRes.json(), overviewRes.json()])
      if (!usersRes.ok || !json.ok) {
        const message = json?.error || getUiErrorMessage(usersRes.status)
        setError(message)
        toast.error(message)
        setUsers([])
        return
      }

      if (Array.isArray(json.data)) {
        setUsers(json.data)
      }

      if (overviewRes.ok && overviewJson?.ok && overviewJson?.data) {
        setOverview(overviewJson.data as UsersOverview)
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

  async function togglePublicProfile(user: User) {
    const uid = user.uid || user.id
    const nextValue = user.publicProfileEnabled === false
    const actionLabel = nextValue ? 'show' : 'hide'
    if (!confirm(`Do you want to ${actionLabel} this profile publicly?`)) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uid,
          publicProfileEnabled: nextValue,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || 'Failed to update public profile visibility')
        return
      }

      toast.success(nextValue ? 'Public profile enabled' : 'Public profile hidden')
      loadUsers()
    } catch (error) {
      console.error('Failed to toggle public profile visibility', error)
      toast.error('Failed to update public profile visibility')
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

  async function resetPassword(user: User) {
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.id, email: user.email }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error || 'Failed to generate reset link')
        return
      }

      if (json.resetLink) {
        try {
          await navigator.clipboard.writeText(json.resetLink)
          toast.success('Reset link copied to clipboard')
        } catch {
          toast.success('Reset link generated')
          window.prompt('Copy reset link:', json.resetLink)
        }
      } else {
        toast.success('Password reset prepared')
      }
    } catch (e) {
      console.error('Failed to generate reset link', e)
      toast.error('Failed to generate reset link')
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

  const getRiskMeta = (user: User) => {
    let score = 0
    const reasons: string[] = []

    if (user.disabled || user.status === 'suspended' || user.status === 'inactive') {
      score += 40
      reasons.push('suspended_or_disabled')
    }

    if (!user.emailVerified && user.status === 'active') {
      score += 20
      reasons.push('active_without_email_verification')
    }

    if (user.status === 'invited') {
      score += 15
      reasons.push('invite_pending')
    }

    if (!user.phone) {
      score += 10
      reasons.push('missing_phone')
    }

    if (user.complianceReviewRequired) {
      score += 25
      reasons.push('compliance_review_pending')
    }

    const capped = Math.min(100, score)
    const level = capped >= 60 ? 'high' : capped >= 30 ? 'medium' : 'low'
    return { score: capped, level, reasons }
  }

  async function forceComplianceCheck(user: User) {
    const reason = window.prompt('Compliance review reason (optional):', 'manual_master_admin_review')
    if (reason === null) return

    try {
      const res = await fetch('/api/admin/users/compliance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, reason: reason?.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error || 'Failed to request compliance review')
        return
      }
      toast.success('Compliance check requested')
      loadUsers()
    } catch (error) {
      console.error('force compliance check error', error)
      toast.error('Failed to request compliance review')
    }
  }

  async function loginAsUser(user: User) {
    if (sessionRole !== 'master_admin') {
      toast.error('Only master admin can use Login as user')
      return
    }

    const targetId = String(user.uid || user.id || '')
    if (!targetId) {
      toast.error('User id is missing')
      return
    }

    if (targetId === sessionUid) {
      toast.error('You are already logged in as this user')
      return
    }

    if (!confirm(`Login as ${user.name || user.email}? This will replace your current session.`)) return

    setImpersonatingUserId(targetId)
    try {
      const res = await fetch('/api/admin/users/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetId }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        const message = json?.error?.message || json?.error || 'Failed to impersonate user'
        toast.error(message)
        return
      }

      toast.success(`Logged in as ${json?.impersonated?.name || user.name || user.email}`)
      window.location.href = String(json?.redirect || '/dashboard')
    } catch (error) {
      console.error('login as user error', error)
      toast.error('Failed to impersonate user')
    } finally {
      setImpersonatingUserId(null)
    }
  }

  const isDangerousActionsLocked = isImpersonating

  if (sessionReady && !canViewPeople) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-2xl font-bold text-amber-900">People management is restricted</h1>
            <p className="mt-2 text-sm text-amber-800">
              This module is available to admin and broker roles only. Your role should continue in dashboard operational flows.
            </p>
            <div className="mt-4">
              <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium hover:bg-[#12355f]">Go to My Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{isBrokerView ? 'Team Management' : 'User Management'}</h1>
              <p className="text-gray-600">
                {isBrokerView
                  ? 'Manage your office team and track onboarding progress'
                  : 'Manage all users across the platform'}
              </p>
            </div>
            {!isBrokerView && (
              <div className="flex items-center gap-2">
                {sessionUid ? <NotificationCenter userId={sessionUid} /> : null}
                <details className="relative">
                  <summary className="list-none inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                    <FiMenu className="h-4 w-4" />
                    Master Modules
                    <FiChevronDown className="h-4 w-4" />
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                    {masterOpsLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </details>

                <details className="relative">
                  <summary className="list-none inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0B2545] px-4 py-2 text-sm font-medium text-white hover:bg-[#12355f] [&::-webkit-details-marker]:hidden">
                    <FiUserPlus className="h-4 w-4" />
                    People Actions
                    <FiChevronDown className="h-4 w-4" />
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                    <button
                      onClick={(event) => {
                        setShowBrokerModal(true)
                        const menu = event.currentTarget.closest('details')
                        menu?.removeAttribute('open')
                      }}
                      disabled={isDangerousActionsLocked}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiUserPlus className="h-4 w-4" />
                      Create Broker
                    </button>
                    <button
                      onClick={(event) => {
                        setShowAgentModal(true)
                        const menu = event.currentTarget.closest('details')
                        menu?.removeAttribute('open')
                      }}
                      disabled={isDangerousActionsLocked}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiUserPlus className="h-4 w-4" />
                      Create Agent
                    </button>
                    <button
                      onClick={(event) => {
                        setShowConstructoraModal(true)
                        const menu = event.currentTarget.closest('details')
                        menu?.removeAttribute('open')
                      }}
                      disabled={isDangerousActionsLocked}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiUserPlus className="h-4 w-4" />
                      Create Constructora
                    </button>
                    <button
                      onClick={(event) => {
                        setShowBuyerModal(true)
                        const menu = event.currentTarget.closest('details')
                        menu?.removeAttribute('open')
                      }}
                      disabled={isDangerousActionsLocked}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiUserPlus className="h-4 w-4" />
                      Create Buyer
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={(event) => {
                        loadUsers()
                        const menu = event.currentTarget.closest('details')
                        menu?.removeAttribute('open')
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Refresh people list
                    </button>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {!isBrokerView && (
          <div className="mb-6 overflow-x-auto rounded-lg border border-gray-200 bg-white p-2">
            <div className="flex min-w-max items-center gap-2">
              {masterOpsLinks.map((link) => {
                const active = link.href === '/master/users'
                return (
                  <Link
                    key={`tab-${link.href}`}
                    href={link.href}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${active ? 'bg-[#0B2545] text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {isDangerousActionsLocked && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <div className="font-semibold">Admin actions are disabled while impersonating a user.</div>
            <div className="mt-1">
              Logged in as: <span className="font-medium">{impersonationAdminEmail || 'original admin'}</span>. Use <span className="font-medium">Stop Impersonation</span> to restore full admin controls.
            </div>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-[#0B2545]/20 bg-[#0B2545]/5 p-4">
          <div className="text-sm font-semibold text-[#0B2545]">
            {isBrokerView ? 'Team Onboarding Flow' : 'People & Onboarding Flow'}
          </div>
          {isBrokerView ? (
            <div className="mt-2 text-xs text-gray-700">
              <span className="font-medium">Invited</span> → Completa acceso y perfil → <span className="font-medium">Active</span>. Usa “Onboarding” por usuario para revisar el cuestionario.
            </div>
          ) : (
            <div className="mt-2 grid gap-2 text-xs text-gray-700 md:grid-cols-3">
              <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2"><span className="font-semibold">Agent:</span> Application → Criteria review → Office assignment → Active</div>
              <div className="rounded border border-purple-200 bg-purple-50 px-3 py-2"><span className="font-semibold">Broker:</span> Application → Compliance checks → Brokerage setup → Active</div>
              <div className="rounded border border-orange-200 bg-orange-50 px-3 py-2"><span className="font-semibold">Constructora:</span> Application → Business verification → Project readiness → Active</div>
            </div>
          )}
          {!isBrokerView && (
            <div className="mt-2 text-xs text-gray-600">
              Detailed intake and approval queue: <Link href="/master/applications" className="font-semibold text-[#0B2545] hover:underline">Applications</Link>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-indigo-200 p-4">
              <div className="text-sm font-medium text-indigo-700">Pending Invites</div>
              <div className="text-3xl font-bold text-indigo-900">{overview.totals.invitedPending}</div>
            </div>
            <div className="bg-white rounded-lg border border-amber-200 p-4">
              <div className="text-sm font-medium text-amber-700">Stalled &gt;72h</div>
              <div className="text-3xl font-bold text-amber-900">{overview.totals.stalledInvites}</div>
            </div>
            <div className="bg-white rounded-lg border border-rose-200 p-4">
              <div className="text-sm font-medium text-rose-700">Suspended</div>
              <div className="text-3xl font-bold text-rose-900">{overview.totals.suspendedUsers}</div>
            </div>
            <div className="bg-white rounded-lg border border-orange-200 p-4">
              <div className="text-sm font-medium text-orange-700">Unverified Active</div>
              <div className="text-3xl font-bold text-orange-900">{overview.totals.unverifiedActive}</div>
            </div>
            <div className="bg-white rounded-lg border border-emerald-200 p-4">
              <div className="text-sm font-medium text-emerald-700">Onboarding Complete</div>
              <div className="text-3xl font-bold text-emerald-900">{overview.totals.onboardingCompletionRate}%</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm font-medium text-slate-700">Lifecycle Events (7d)</div>
              <div className="text-3xl font-bold text-slate-900">{overview.governance.lifecycleEvents7d}</div>
            </div>
          </div>
        )}

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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick Views</span>
            <button type="button" onClick={() => { setRoleFilter('all'); setStatusFilter('all') }} className={`text-xs px-3 py-1.5 rounded-lg border ${roleFilter === 'all' && statusFilter === 'all' ? 'border-[#0B2545] bg-[#0B2545] text-white' : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700'}`}>{isBrokerView ? 'All Team' : 'All People'}</button>
            <button type="button" onClick={() => { setRoleFilter('agent'); setStatusFilter('all') }} className={`text-xs px-3 py-1.5 rounded-lg border ${roleFilter === 'agent' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700'}`}>Agents</button>
            <button type="button" onClick={() => { setRoleFilter('broker'); setStatusFilter('all') }} className={`text-xs px-3 py-1.5 rounded-lg border ${roleFilter === 'broker' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700'}`}>Brokers</button>
            {!isBrokerView && (
              <>
                <button type="button" onClick={() => { setRoleFilter('constructora'); setStatusFilter('all') }} className={`text-xs px-3 py-1.5 rounded-lg border ${roleFilter === 'constructora' ? 'border-orange-600 bg-orange-600 text-white' : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700'}`}>Constructoras</button>
                <button type="button" onClick={() => { setRoleFilter('buyer'); setStatusFilter('all') }} className={`text-xs px-3 py-1.5 rounded-lg border ${roleFilter === 'buyer' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700'}`}>Buyers</button>
              </>
            )}
            <button type="button" onClick={() => { setRoleFilter('all'); setStatusFilter('active') }} className={`text-xs px-3 py-1.5 rounded-lg border ${statusFilter === 'active' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700'}`}>Active</button>
            <button type="button" onClick={() => { setRoleFilter('all'); setStatusFilter('inactive') }} className={`text-xs px-3 py-1.5 rounded-lg border ${statusFilter === 'inactive' ? 'border-red-600 bg-red-600 text-white' : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700'}`}>Inactive</button>
            <button type="button" onClick={() => { setSearchQuery(''); setRoleFilter('all'); setStatusFilter('all') }} className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700">Clear Filters</button>
          </div>
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
                {!isBrokerView && <option value="buyer">Buyers</option>}
                {!isBrokerView && <option value="constructora">Constructoras</option>}
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Risk</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const roleBadge = getRoleBadge(user.role)
                    const isDisabled = user.disabled || user.status === 'inactive' || user.status === 'suspended'
                    const isInvited = user.status === 'invited'
                    const risk = getRiskMeta(user)
                    const isProfessional = user.role === 'agent' || user.role === 'broker' || user.role === 'constructora'
                    const isPublicProfileEnabled = user.publicProfileEnabled !== false
                    
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
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            risk.level === 'high'
                              ? 'bg-red-100 text-red-800'
                              : risk.level === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {risk.level.toUpperCase()} ({risk.score})
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end">
                            <details className="relative">
                              <summary className="list-none inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                                <FiMoreVertical className="w-4 h-4" />
                                Actions
                                <FiChevronDown className="w-4 h-4" />
                              </summary>
                              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                                <Link
                                  href={`/master/users/${user.id}`}
                                  onClick={(event) => {
                                    const menu = event.currentTarget.closest('details')
                                    menu?.removeAttribute('open')
                                  }}
                                  className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                  View profile
                                </Link>
                                {isInvited && (
                                  <button
                                    onClick={(event) => {
                                      resendInvite(user.id)
                                      const menu = event.currentTarget.closest('details')
                                      menu?.removeAttribute('open')
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-indigo-700 hover:bg-indigo-50"
                                  >
                                    <FiMail className="w-4 h-4" />
                                    Resend Invite
                                  </button>
                                )}
                                <button
                                  onClick={(event) => {
                                    setEditingUser(user)
                                    setShowEditModal(true)
                                    const menu = event.currentTarget.closest('details')
                                    menu?.removeAttribute('open')
                                  }}
                                  disabled={isDangerousActionsLocked}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiEdit className="w-4 h-4" />
                                  Edit user
                                </button>
                                <button
                                  onClick={(event) => {
                                    setOnboardingUser(user)
                                    setShowOnboardingModal(true)
                                    const menu = event.currentTarget.closest('details')
                                    menu?.removeAttribute('open')
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-cyan-700 hover:bg-cyan-50"
                                >
                                  Onboarding
                                </button>
                                {sessionRole === 'master_admin' && user.role !== 'master_admin' && (
                                  <button
                                    onClick={(event) => {
                                      loginAsUser(user)
                                      const menu = event.currentTarget.closest('details')
                                      menu?.removeAttribute('open')
                                    }}
                                    disabled={impersonatingUserId === (user.uid || user.id)}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <FiLogIn className="w-4 h-4" />
                                    {impersonatingUserId === (user.uid || user.id) ? 'Logging in...' : 'Login as'}
                                  </button>
                                )}
                                <button
                                  onClick={(event) => {
                                    resetPassword(user)
                                    const menu = event.currentTarget.closest('details')
                                    menu?.removeAttribute('open')
                                  }}
                                  disabled={isBrokerView || isDangerousActionsLocked}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiKey className="w-4 h-4" />
                                  Reset password
                                </button>
                                <button
                                  onClick={(event) => {
                                    forceComplianceCheck(user)
                                    const menu = event.currentTarget.closest('details')
                                    menu?.removeAttribute('open')
                                  }}
                                  disabled={isBrokerView || isDangerousActionsLocked}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Compliance check
                                </button>
                                {isProfessional && (
                                  <button
                                    onClick={(event) => {
                                      togglePublicProfile(user)
                                      const menu = event.currentTarget.closest('details')
                                      menu?.removeAttribute('open')
                                    }}
                                    disabled={isBrokerView || isDangerousActionsLocked}
                                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                                      isPublicProfileEnabled
                                        ? 'text-emerald-700 hover:bg-emerald-50'
                                        : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {isPublicProfileEnabled ? 'Public profile: ON' : 'Public profile: OFF'}
                                  </button>
                                )}
                                <button
                                  onClick={(event) => {
                                    toggleStatus(user.uid || user.id, isDisabled)
                                    const menu = event.currentTarget.closest('details')
                                    menu?.removeAttribute('open')
                                  }}
                                  disabled={isBrokerView || isDangerousActionsLocked}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isDisabled ? <FiUserCheck className="w-4 h-4" /> : <FiUserX className="w-4 h-4" />}
                                  {isDisabled ? 'Enable user' : 'Disable user'}
                                </button>
                                <div className="my-1 border-t border-gray-100" />
                                <button
                                  onClick={(event) => {
                                    deleteUser(user.uid || user.id, user.name)
                                    const menu = event.currentTarget.closest('details')
                                    menu?.removeAttribute('open')
                                  }}
                                  disabled={isBrokerView || isDangerousActionsLocked}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                  Delete user
                                </button>
                              </div>
                            </details>
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
      {!isBrokerView && (
        <>
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
        </>
      )}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingUser(null)
        }}
        onSuccess={() => loadUsers()}
        user={editingUser}
      />
      <OnboardingQuestionnaireModal
        isOpen={showOnboardingModal}
        onClose={() => {
          setShowOnboardingModal(false)
          setOnboardingUser(null)
        }}
        onSaved={() => loadUsers()}
        user={onboardingUser}
      />
    </div>
  )
}

