'use client'
import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebaseClient'
import toast from 'react-hot-toast'

type TargetType = 'all' | 'roles' | 'users' | 'test'

export default function AdminPushPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('test')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [userIds, setUserIds] = useState('')
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  const roles = ['client', 'agent', 'broker', 'admin']

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required')
      return
    }

    if (targetType === 'roles' && !selectedRoles.length) {
      toast.error('Select at least one role')
      return
    }

    if (targetType === 'users' && !userIds.trim()) {
      toast.error('Enter at least one user ID')
      return
    }

    if (!functions) {
      toast.error('Firebase Functions not initialized')
      return
    }

    setSending(true)
    setLastResult(null)

    try {
      const sendPush = httpsCallable(functions, 'sendPushNotification')
      const payload: any = {
        title,
        body,
        targetType,
        imageUrl: imageUrl.trim() || undefined
      }

      if (targetType === 'roles') {
        payload.targetRoles = selectedRoles
      } else if (targetType === 'users') {
        payload.userIds = userIds.split(',').map(id => id.trim()).filter(Boolean)
      }

      const result = await sendPush(payload)
      setLastResult(result.data)
      toast.success(`Push sent: ${(result.data as any).sent} delivered`)
    } catch (error: any) {
      console.error('Send push error:', error)
      toast.error(error.message || 'Failed to send push')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Send Push Notification</h1>

          {/* Compose Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., New property alert!"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={60}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/60 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification message..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{body.length}/200 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (optional)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Target Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="target"
                    checked={targetType === 'test'}
                    onChange={() => setTargetType('test')}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Test (admin only)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="target"
                    checked={targetType === 'all'}
                    onChange={() => setTargetType('all')}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">All users</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="target"
                    checked={targetType === 'roles'}
                    onChange={() => setTargetType('roles')}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">By role</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="target"
                    checked={targetType === 'users'}
                    onChange={() => setTargetType('users')}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Specific users (comma-separated UIDs)</span>
                </label>
              </div>
            </div>

            {/* Role Selection */}
            {targetType === 'roles' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {roles.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedRoles.includes(role)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User IDs Input */}
            {targetType === 'users' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User IDs (comma-separated)
                </label>
                <textarea
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                  placeholder="uid1, uid2, uid3..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            )}

            {/* Preview */}
            {title && body && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 mb-2">PREVIEW</p>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded mb-3"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <p className="font-semibold text-gray-900 mb-1">{title}</p>
                  <p className="text-sm text-gray-600">{body}</p>
                  <p className="text-xs text-gray-400 mt-2">viventa.com</p>
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || !title || !body}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? 'Sending...' : 'Send Push Notification'}
            </button>

            {/* Result */}
            {lastResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 mb-1">✓ Sent successfully</p>
                <p className="text-xs text-green-700">
                  Delivered: {lastResult.sent} / {lastResult.total} tokens
                  {lastResult.failed > 0 && ` (${lastResult.failed} failed)`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">💡 Tips</p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Test mode sends only to your own token (admin user)</li>
            <li>Keep titles under 50 chars and body under 150 for best mobile display</li>
            <li>Images should be HTTPS, 2:1 aspect ratio recommended</li>
            <li>Check Firestore <code>push_logs</code> collection for delivery stats</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
