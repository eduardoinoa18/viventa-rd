'use client'

import { useState, useEffect } from 'react'
import { FiX, FiUserPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface CreateAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Broker {
  id: string
  name: string
  company?: string
}

export default function CreateAgentModal({ isOpen, onClose, onSuccess }: CreateAgentModalProps) {
  const [loading, setLoading] = useState(false)
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loadingBrokers, setLoadingBrokers] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    brokerageId: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadBrokers()
    }
  }, [isOpen])

  const loadBrokers = async () => {
    setLoadingBrokers(true)
    try {
      const res = await fetch('/api/admin/users?role=broker')
      const json = await res.json()
      if (json.ok && Array.isArray(json.data)) {
        const brokerList = json.data.map((b: any) => ({
          id: b.id,
          name: b.name,
          company: b.company,
        }))
        setBrokers(brokerList)
      }
    } catch (error) {
      console.error('Error loading brokers:', error)
    } finally {
      setLoadingBrokers(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.brokerageId) {
      toast.error('Name, email, and broker are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          role: 'agent',
          brokerage: formData.brokerageId,
          sendInvite: true,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error || 'Failed to create agent')
        return
      }

      toast.success('Agent created and invitation sent')
      setFormData({ name: '', email: '', phone: '', brokerageId: '' })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating agent:', error)
      toast.error('Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiUserPlus className="w-5 h-5" />
            Create Agent
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., María López"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="maria@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Broker *
            </label>
            <select
              name="brokerageId"
              value={formData.brokerageId}
              onChange={handleChange}
              aria-label="Select broker"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {loadingBrokers ? 'Loading brokers...' : 'Select a broker'}
              </option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.name} {broker.company ? `(${broker.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingBrokers}
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
