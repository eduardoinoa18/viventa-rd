// app/auth/invite/[token]/page.tsx
'use client'
/* eslint-disable react/no-unescaped-entities */
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FiCheck, FiX, FiLoader, FiMail, FiUser, FiBriefcase } from 'react-icons/fi'

type InvitationType = 'agent' | 'broker' | 'user'

interface InvitationData {
  email: string
  name: string
  message: string
  inviteType: InvitationType
  status: string
  expiresAt: string
}

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) {
      verifyInvitation()
    }
  }, [token])

  const verifyInvitation = async () => {
    try {
      const res = await fetch(`/api/invitations/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setError(data.error || 'Invalid or expired invitation')
        return
      }

      setInvitation(data.invitation)
    } catch (err: any) {
      console.error('Error verifying invitation:', err)
      setError('Failed to verify invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = () => {
    if (!invitation) return

    // Redirect to appropriate page based on invite type with pre-filled data
    if (invitation.inviteType === 'user') {
      // Redirect to signup with email pre-filled
      router.push(`/signup?email=${encodeURIComponent(invitation.email)}&name=${encodeURIComponent(invitation.name)}&invite=${token}`)
    } else {
      // Redirect to apply page with data pre-filled
      router.push(`/apply?email=${encodeURIComponent(invitation.email)}&name=${encodeURIComponent(invitation.name)}&type=${invitation.inviteType}&invite=${token}`)
    }
  }

  const getIcon = () => {
    if (!invitation) return <FiMail />
    switch (invitation.inviteType) {
      case 'agent':
        return <FiUser className="w-16 h-16" />
      case 'broker':
        return <FiBriefcase className="w-16 h-16" />
      default:
        return <FiMail className="w-16 h-16" />
    }
  }

  const getTitle = () => {
    if (!invitation) return 'Invitation'
    switch (invitation.inviteType) {
      case 'agent':
        return 'Real Estate Agent Invitation'
      case 'broker':
        return 'Broker Invitation'
      default:
        return 'Platform Invitation'
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full">
          <FiLoader className="w-16 h-16 text-[#00A676] mx-auto mb-6 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Invitation...</h2>
          <p className="text-gray-600">Please wait while we check your invitation</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <FiX className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Invalid Invitation</h2>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-8">
            This invitation may have expired or already been used.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/apply')}
              className="px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#00C896] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Apply Without Invitation
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Valid Invitation State
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#00A676] to-[#00C896] rounded-full mb-6">
            <div className="text-white">{getIcon()}</div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">You&apos;re Invited! 🎉</h1>
          <p className="text-xl text-gray-600">{getTitle()}</p>
        </div>

        {/* Invitation Details */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Invited as:</label>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {invitation.inviteType === 'agent'
                  ? 'Real Estate Agent'
                  : invitation.inviteType === 'broker'
                  ? 'Broker / Brokerage'
                  : 'Platform User'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Your Name:</label>
              <p className="text-lg font-semibold text-gray-900">{invitation.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email:</label>
              <p className="text-lg font-semibold text-gray-900">{invitation.email}</p>
            </div>
            {invitation.message && (
              <div>
                <label className="text-sm font-medium text-gray-600">Personal Message:</label>
                <p className="text-gray-700 bg-white p-4 rounded-lg mt-2 italic">
                  &quot;{invitation.message}&quot;
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-600">Expires:</label>
              <p className="text-gray-700">
                {new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        {invitation.inviteType !== 'user' && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-3">What&apos;s Included:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Professional profile on VIVENTA platform</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Access to listing management tools</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Connect with qualified buyers and sellers</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Performance analytics and insights</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Growing network of real estate professionals</span>
              </li>
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleAcceptInvitation}
            className="w-full px-8 py-4 bg-gradient-to-r from-[#00A676] to-[#00C896] text-white rounded-2xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all mb-4"
          >
            Accept Invitation & Get Started →
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Maybe Later
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          By accepting this invitation, you agree to VIVENTA&apos;s Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
