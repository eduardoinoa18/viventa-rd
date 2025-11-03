// app/admin/settings/page.tsx
'use client'
import { useEffect, useState } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { FiSettings, FiServer, FiRefreshCw, FiMail, FiShield, FiLink, FiBell, FiZap, FiGlobe, FiDollarSign, FiImage } from 'react-icons/fi'
import toast from 'react-hot-toast'

type SettingsData = {
  // General
  siteTitle: string
  siteDescription: string
  siteLogo: string
  contactEmail: string
  contactPhone: string
  address: string
  timezone: string
  language: string
  currency: string
  
  // Email
  emailProvider: 'sendgrid' | 'smtp' | 'none'
  sendgridApiKey: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  emailFrom: string
  emailReplyTo: string
  
  // Security
  enableTwoFactor: boolean
  sessionTimeout: number
  passwordMinLength: number
  requireStrongPassword: boolean
  allowedDomains: string
  
  // Integrations
  stripePublishableKey: string
  stripeSecretKey: string
  algoliaAppId: string
  algoliaApiKey: string
  algoliaIndex: string
  firebaseProjectId: string
  googleAnalyticsId: string
  facebookPixelId: string
  
  // Notifications
  adminEmailNotifications: boolean
  userEmailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  notifyOnNewLead: boolean
  notifyOnNewApplication: boolean
  notifyOnNewProperty: boolean
  
  // Advanced
  maintenanceMode: boolean
  cacheEnabled: boolean
  rateLimitPerMinute: number
  enableApiAccess: boolean
  apiKey: string
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  
  // Social Media
  facebookUrl: string
  instagramUrl: string
  twitterUrl: string
  linkedinUrl: string
  youtubeUrl: string
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'integrations' | 'notifications' | 'advanced' | 'status'>('general')
  const [settings, setSettings] = useState<SettingsData>({
    siteTitle: 'VIVENTA',
    siteDescription: 'Tu Espacio, Tu Futuro',
    siteLogo: '',
    contactEmail: 'info@viventa.com',
    contactPhone: '+1 (809) 123-4567',
    address: 'Santo Domingo, República Dominicana',
    timezone: 'America/Santo_Domingo',
    language: 'es',
    currency: 'USD',
    emailProvider: 'none',
    sendgridApiKey: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    emailFrom: 'noreply@viventa.com',
    emailReplyTo: 'support@viventa.com',
    enableTwoFactor: false,
    sessionTimeout: 60,
    passwordMinLength: 8,
    requireStrongPassword: true,
    allowedDomains: '',
    stripePublishableKey: '',
    stripeSecretKey: '',
    algoliaAppId: '',
    algoliaApiKey: '',
    algoliaIndex: 'properties',
    firebaseProjectId: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
    adminEmailNotifications: true,
    userEmailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    notifyOnNewLead: true,
    notifyOnNewApplication: true,
    notifyOnNewProperty: true,
    maintenanceMode: false,
    cacheEnabled: true,
    rateLimitPerMinute: 100,
    enableApiAccess: false,
    apiKey: '',
    logLevel: 'info',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    youtubeUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [diag, setDiag] = useState<any>(null)
  const [diagError, setDiagError] = useState<string>('')

  useEffect(() => {
    loadSettings()
    loadDiagnostics()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const json = await res.json()
      if (json.ok) {
        setSettings({ ...settings, ...json.data })
      }
    } catch (e) {
      console.error('Failed to load settings', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadDiagnostics() {
    try {
      const res = await fetch('/api/admin/diagnostics')
      const json = await res.json()
      if (json.ok) setDiag(json.data)
      else setDiagError(json.error || 'Failed to load diagnostics')
    } catch (e) {
      setDiagError('Network error loading diagnostics')
    }
  }

  async function saveSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const json = await res.json()
      if (json.ok) {
        toast.success('Settings saved successfully')
      } else {
        toast.error(json.error || 'Failed to save settings')
      }
    } catch (e) {
      console.error('Failed to save settings', e)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  function updateSetting(key: keyof SettingsData, value: any) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const tabs = [
    { id: 'general', label: 'General', icon: <FiGlobe /> },
    { id: 'email', label: 'Email', icon: <FiMail /> },
    { id: 'security', label: 'Security', icon: <FiShield /> },
    { id: 'integrations', label: 'Integrations', icon: <FiLink /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'advanced', label: 'Advanced', icon: <FiZap /> },
    { id: 'status', label: 'System Status', icon: <FiServer /> },
  ]

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0B2545] flex items-center gap-2">
                <FiSettings /> Platform Settings
              </h1>
              <p className="text-gray-600 mt-1">Configure your platform settings and integrations</p>
            </div>
            {activeTab !== 'status' && (
              <button
                onClick={saveSettings}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-[#00A676] text-[#00A676]'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="max-w-5xl space-y-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Site Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Site Title</label>
                      <input
                        type="text"
                        value={settings.siteTitle}
                        onChange={(e) => updateSetting('siteTitle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                      <input
                        type="text"
                        value={settings.siteDescription}
                        onChange={(e) => updateSetting('siteDescription', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                      <input
                        type="text"
                        value={settings.siteLogo}
                        onChange={(e) => updateSetting('siteLogo', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => updateSetting('contactEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        value={settings.contactPhone}
                        onChange={(e) => updateSetting('contactPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={settings.address}
                        onChange={(e) => updateSetting('address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Localization</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => updateSetting('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      >
                        <option value="America/Santo_Domingo">America/Santo_Domingo</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="America/Los_Angeles">America/Los_Angeles</option>
                        <option value="Europe/Madrid">Europe/Madrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => updateSetting('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        value={settings.currency}
                        onChange={(e) => updateSetting('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="DOP">DOP (RD$)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Social Media</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                      <input
                        type="url"
                        value={settings.facebookUrl}
                        onChange={(e) => updateSetting('facebookUrl', e.target.value)}
                        placeholder="https://facebook.com/viventa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                      <input
                        type="url"
                        value={settings.instagramUrl}
                        onChange={(e) => updateSetting('instagramUrl', e.target.value)}
                        placeholder="https://instagram.com/viventa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Twitter/X URL</label>
                      <input
                        type="url"
                        value={settings.twitterUrl}
                        onChange={(e) => updateSetting('twitterUrl', e.target.value)}
                        placeholder="https://twitter.com/viventa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                      <input
                        type="url"
                        value={settings.linkedinUrl}
                        onChange={(e) => updateSetting('linkedinUrl', e.target.value)}
                        placeholder="https://linkedin.com/company/viventa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Email Provider</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Service</label>
                    <select
                      value={settings.emailProvider}
                      onChange={(e) => updateSetting('emailProvider', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    >
                      <option value="none">None (Disabled)</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="smtp">SMTP</option>
                    </select>
                  </div>

                  {settings.emailProvider === 'sendgrid' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SendGrid API Key</label>
                      <input
                        type="password"
                        value={settings.sendgridApiKey}
                        onChange={(e) => updateSetting('sendgridApiKey', e.target.value)}
                        placeholder="SG.xxxxxxxxxxxx"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Get your API key from SendGrid dashboard</p>
                    </div>
                  )}

                  {settings.emailProvider === 'smtp' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                        <input
                          type="text"
                          value={settings.smtpHost}
                          onChange={(e) => updateSetting('smtpHost', e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                        <input
                          type="number"
                          value={settings.smtpPort}
                          onChange={(e) => updateSetting('smtpPort', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                        <input
                          type="text"
                          value={settings.smtpUser}
                          onChange={(e) => updateSetting('smtpUser', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                        <input
                          type="password"
                          value={settings.smtpPass}
                          onChange={(e) => updateSetting('smtpPass', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Email Configuration</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                      <input
                        type="email"
                        value={settings.emailFrom}
                        onChange={(e) => updateSetting('emailFrom', e.target.value)}
                        placeholder="noreply@viventa.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reply-To Email</label>
                      <input
                        type="email"
                        value={settings.emailReplyTo}
                        onChange={(e) => updateSetting('emailReplyTo', e.target.value)}
                        placeholder="support@viventa.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Authentication</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">Enable Two-Factor Authentication</div>
                        <div className="text-sm text-gray-500">Require 2FA for admin accounts</div>
                      </div>
                      <button
                        onClick={() => updateSetting('enableTwoFactor', !settings.enableTwoFactor)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.enableTwoFactor ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.enableTwoFactor ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                        <input
                          type="number"
                          value={settings.sessionTimeout}
                          onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Password Length</label>
                        <input
                          type="number"
                          value={settings.passwordMinLength}
                          onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t">
                      <div>
                        <div className="font-medium">Require Strong Passwords</div>
                        <div className="text-sm text-gray-500">Uppercase, lowercase, numbers, and symbols</div>
                      </div>
                      <button
                        onClick={() => updateSetting('requireStrongPassword', !settings.requireStrongPassword)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.requireStrongPassword ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.requireStrongPassword ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Email Domains (comma-separated)</label>
                      <input
                        type="text"
                        value={settings.allowedDomains}
                        onChange={(e) => updateSetting('allowedDomains', e.target.value)}
                        placeholder="viventa.com, example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to allow all domains</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545] flex items-center gap-2">
                    <FiDollarSign /> Stripe Payment Integration
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Publishable Key</label>
                      <input
                        type="text"
                        value={settings.stripePublishableKey}
                        onChange={(e) => updateSetting('stripePublishableKey', e.target.value)}
                        placeholder="pk_test_..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                      <input
                        type="password"
                        value={settings.stripeSecretKey}
                        onChange={(e) => updateSetting('stripeSecretKey', e.target.value)}
                        placeholder="sk_test_..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Algolia Search</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">App ID</label>
                      <input
                        type="text"
                        value={settings.algoliaAppId}
                        onChange={(e) => updateSetting('algoliaAppId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                      <input
                        type="password"
                        value={settings.algoliaApiKey}
                        onChange={(e) => updateSetting('algoliaApiKey', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Index Name</label>
                      <input
                        type="text"
                        value={settings.algoliaIndex}
                        onChange={(e) => updateSetting('algoliaIndex', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Analytics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics ID</label>
                      <input
                        type="text"
                        value={settings.googleAnalyticsId}
                        onChange={(e) => updateSetting('googleAnalyticsId', e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Pixel ID</label>
                      <input
                        type="text"
                        value={settings.facebookPixelId}
                        onChange={(e) => updateSetting('facebookPixelId', e.target.value)}
                        placeholder="1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Notification Channels</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">Admin Email Notifications</div>
                        <div className="text-sm text-gray-500">Receive email alerts for important events</div>
                      </div>
                      <button
                        onClick={() => updateSetting('adminEmailNotifications', !settings.adminEmailNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.adminEmailNotifications ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.adminEmailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">User Email Notifications</div>
                        <div className="text-sm text-gray-500">Allow users to receive email notifications</div>
                      </div>
                      <button
                        onClick={() => updateSetting('userEmailNotifications', !settings.userEmailNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.userEmailNotifications ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.userEmailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">Push Notifications</div>
                        <div className="text-sm text-gray-500">Enable browser push notifications</div>
                      </div>
                      <button
                        onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.pushNotifications ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">SMS Notifications</div>
                        <div className="text-sm text-gray-500">Send SMS alerts (requires Twilio)</div>
                      </div>
                      <button
                        onClick={() => updateSetting('smsNotifications', !settings.smsNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.smsNotifications ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Event Notifications</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">New Lead Notifications</div>
                        <div className="text-sm text-gray-500">Alert when new lead is created</div>
                      </div>
                      <button
                        onClick={() => updateSetting('notifyOnNewLead', !settings.notifyOnNewLead)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.notifyOnNewLead ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.notifyOnNewLead ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">New Application Notifications</div>
                        <div className="text-sm text-gray-500">Alert when agent/broker applies</div>
                      </div>
                      <button
                        onClick={() => updateSetting('notifyOnNewApplication', !settings.notifyOnNewApplication)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.notifyOnNewApplication ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.notifyOnNewApplication ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">New Property Notifications</div>
                        <div className="text-sm text-gray-500">Alert when new property is submitted</div>
                      </div>
                      <button
                        onClick={() => updateSetting('notifyOnNewProperty', !settings.notifyOnNewProperty)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.notifyOnNewProperty ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.notifyOnNewProperty ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">System</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">Maintenance Mode</div>
                        <div className="text-sm text-gray-500">Temporarily disable public access</div>
                      </div>
                      <button
                        onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">Enable Caching</div>
                        <div className="text-sm text-gray-500">Cache responses for better performance</div>
                      </div>
                      <button
                        onClick={() => updateSetting('cacheEnabled', !settings.cacheEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.cacheEnabled ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.cacheEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (requests/minute)</label>
                      <input
                        type="number"
                        value={settings.rateLimitPerMinute}
                        onChange={(e) => updateSetting('rateLimitPerMinute', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Log Level</label>
                      <select
                        value={settings.logLevel}
                        onChange={(e) => updateSetting('logLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      >
                        <option value="error">Error Only</option>
                        <option value="warn">Warnings</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug (Verbose)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">API Access</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <div className="font-medium">Enable API Access</div>
                        <div className="text-sm text-gray-500">Allow external API requests</div>
                      </div>
                      <button
                        onClick={() => updateSetting('enableApiAccess', !settings.enableApiAccess)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.enableApiAccess ? 'bg-[#00A676]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.enableApiAccess ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.enableApiAccess && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={settings.apiKey || 'Generate a new API key'}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                          <button
                            onClick={() => updateSetting('apiKey', 'viv_' + Math.random().toString(36).substring(2, 15))}
                            className="px-4 py-2 bg-[#0B2545] text-white rounded-lg hover:bg-[#0B2545]/90"
                          >
                            Generate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
                  <p className="text-gray-700 mb-4">Irreversible actions. Use with extreme caution.</p>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
                      Clear All Cache
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
                      Reset Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* System Status Tab (keep existing) */}
            {activeTab === 'status' && (
              <>
                {diagError && (
                  <div className="mb-4 px-4 py-2 bg-red-50 text-red-800 border border-red-200 rounded">{diagError}</div>
                )}
                {!diag ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto mb-4 ${loading ? '' : 'hidden'}`}></div>
                    <div className="text-gray-500">{loading ? 'Loading...' : 'Failed to load diagnostics'}</div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-[#0B2545]">Configuration Status</h2>
                        <button
                          onClick={loadDiagnostics}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Section title="Firebase" items={[
                          {label:'API Key', ok: diag.firebase.apiKey},
                          {label:'Auth Domain', ok: diag.firebase.authDomain},
                          {label:'Project ID', ok: diag.firebase.projectId},
                          {label:'App ID', ok: diag.firebase.appId},
                        ]} />
                        <Section title="Algolia" items={[
                          {label:'App ID', ok: diag.algolia.appId},
                          {label:'Search Key', ok: diag.algolia.searchKey},
                          {label:'Index', ok: diag.algolia.index},
                        ]} tip={!diag.algolia.appId || !diag.algolia.searchKey ? 'Set NEXT_PUBLIC_ALGOLIA_* to enable search' : undefined} />
                        <Section title="Email" items={[
                          {label:'SendGrid', ok: diag.email.sendgrid},
                          {label:'SMTP', ok: diag.email.smtp},
                          {label:'From Address', ok: diag.email.from},
                        ]} tip={!diag.email.sendgrid && !diag.email.smtp ? 'Configure SENDGRID_API_KEY or SMTP_* to send codes' : undefined} />
                        <Section title="Admin Auth" items={[
                          {label:'Allow Any (override)', ok: diag.adminAuth.allowAny},
                          {label:'Return Dev Code', ok: diag.adminAuth.allowDevResponse},
                          {label:'Allowlist Configured', ok: diag.adminAuth.allowlistConfigured},
                        ]} tip={!diag.adminAuth.allowlistConfigured ? 'Set MASTER_ADMIN_EMAILS to restrict access in production' : undefined} />
                      </div>
                    </div>

                    {diag.firestoreData && typeof diag.firestoreData === 'object' && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Firestore Collections</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(diag.firestoreData).map(([collectionName, collectionData]: [string, any]) => {
                            if (collectionName === 'error') {
                              return (
                                <div key="error" className="col-span-full p-4 bg-red-50 border-l-4 border-red-500 rounded">
                                  <div className="font-semibold text-red-800">Firebase Connection Error</div>
                                  <div className="text-red-700 text-sm">{collectionData}</div>
                                </div>
                              )
                            }

                            return (
                              <div key={collectionName} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-sm font-semibold text-gray-800">{collectionName}</h3>
                                  {collectionData.exists ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                      {collectionData.count} docs
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                      Error
                                    </span>
                                  )}
                                </div>
                                {collectionData.error && (
                                  <div className="text-red-600 text-xs">{collectionData.error}</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="text-center text-sm text-gray-500">
                      Last checked: {diag.timestamp ? new Date(diag.timestamp).toLocaleString() : 'Unknown'}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}

function Badge({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${ok ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
      {ok ? 'OK' : 'Missing'}
    </span>
  )
}

function Section({ title, items, tip }: { title: string; items: {label:string; ok:boolean}[]; tip?: string }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="font-semibold text-[#0B2545] mb-3">{title}</div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{it.label}</span>
            <Badge ok={it.ok} />
          </li>
        ))}
      </ul>
      {tip && <div className="text-xs text-gray-500 mt-3">{tip}</div>}
    </div>
  )
}
