// app/admin/settings/page.tsx
'use client'
import { useEffect, useState } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { FiSettings, FiServer, FiRefreshCw, FiMail, FiShield, FiLink, FiBell, FiZap, FiGlobe, FiDollarSign, FiImage, FiDatabase, FiTrash2, FiAlertTriangle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'

// Firebase Cleanup Component
function DatabaseCleanupTab() {
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [deleteAuth, setDeleteAuth] = useState(false)

  async function runCleanup() {
    if (confirmation !== 'DELETE_ALL_TEST_DATA_PERMANENTLY') {
      toast.error('Invalid confirmation text')
      return
    }

    if (!confirm('⚠️ This will PERMANENTLY delete all selected data. Are you absolutely sure?')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/firebase/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation,
          deleteAuth,
          adminEmail: 'admin@viventa.com'
        })
      })

      const data = await res.json()
      
      if (data.ok) {
        toast.success(`Cleanup completed! ${data.totalDeleted} documents deleted.`)
        setResults(data)
        setConfirmation('')
      } else {
        toast.error(data.error || 'Cleanup failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Cleanup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <FiAlertTriangle className="text-3xl text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Danger Zone - Firebase Cleanup</h3>
            <p className="text-red-800 text-sm mb-3">
              This tool permanently deletes test data from Firebase. This action <strong>CANNOT BE UNDONE</strong>.
            </p>
            <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
              <li>All users, agents, brokers, and admins will be deleted</li>
              <li>All properties, applications, and leads will be deleted</li>
              <li>All conversations, messages, and notifications will be deleted</li>
              <li>Firebase Authentication users can optionally be deleted</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cleanup Form */}
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cleanup Configuration</h3>
            <p className="text-gray-600 text-sm">
              Configure what data to delete. Master admin emails will be protected.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
              <input
                type="checkbox"
                id="delete-auth"
                checked={deleteAuth}
                onChange={(e) => setDeleteAuth(e.target.checked)}
                className="w-5 h-5 text-[#00A676] rounded"
              />
              <label htmlFor="delete-auth" className="text-sm font-medium text-gray-700 cursor-pointer">
                Also delete Firebase Authentication users (excluding admin emails)
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Confirmation Text
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Type exactly: <code className="bg-gray-100 px-2 py-1 rounded">DELETE_ALL_TEST_DATA_PERMANENTLY</code>
              </p>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="Type confirmation text..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>

          <button
            onClick={runCleanup}
            disabled={loading || confirmation !== 'DELETE_ALL_TEST_DATA_PERMANENTLY'}
            className="w-full px-6 py-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <FiTrash2 />
            {loading ? 'Cleaning up...' : 'Run Firebase Cleanup'}
          </button>
        </div>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cleanup Results</h3>
            <div className="space-y-2">
              <p className="text-sm"><strong>Total Documents Deleted:</strong> {results.totalDeleted}</p>
              {Object.entries(results.results || {}).map(([collection, count]: [string, any]) => (
                <div key={collection} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm">
                  <span className="font-medium">{collection}</span>
                  <span className={count > 0 ? 'text-green-600' : count === 0 ? 'text-gray-500' : 'text-red-600'}>
                    {count >= 0 ? `${count} deleted` : 'Failed'}
                  </span>
                </div>
              ))}
              {results.errors && results.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="font-semibold text-red-900 mb-2">Errors:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {results.errors.map((err: string, i: number) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
import FormField from '../../../components/ui/FormField'
import TextInput from '../../../components/ui/TextInput'
import Select from '../../../components/ui/Select'
import { Toggle } from '../../../components/ui/Toggle'

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
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'integrations' | 'notifications' | 'gamification' | 'advanced' | 'status' | 'database'>('general')
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
      if (!res.ok) {
        console.error('Failed to load settings: HTTP', res.status)
        return
      }
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
    { id: 'gamification', label: 'Gamification', icon: <FiZap /> },
    { id: 'advanced', label: 'Advanced', icon: <FiZap /> },
    { id: 'database', label: 'Database', icon: <FiDatabase /> },
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
              <Button onClick={saveSettings} isLoading={loading} disabled={loading} size="lg">
                Save Changes
              </Button>
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
                <Card title="Site Information" className="">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="site-title" label="Site Title">
                      <TextInput
                        id="site-title"
                        type="text"
                        value={settings.siteTitle}
                        onChange={(e) => updateSetting('siteTitle', e.target.value)}
                      />
                    </FormField>
                    <FormField id="site-description" label="Site Description">
                      <TextInput
                        id="site-description"
                        type="text"
                        value={settings.siteDescription}
                        onChange={(e) => updateSetting('siteDescription', e.target.value)}
                      />
                    </FormField>
                    <FormField id="site-logo" label="Logo URL" className="md:col-span-2">
                      <TextInput
                        id="site-logo"
                        type="text"
                        value={settings.siteLogo}
                        onChange={(e) => updateSetting('siteLogo', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </FormField>
                  </div>
                </Card>

                <Card title="Contact Information" description="Public contact details for your platform">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="contact-email" label="Contact Email">
                      <TextInput
                        id="contact-email"
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => updateSetting('contactEmail', e.target.value)}
                      />
                    </FormField>
                    <FormField id="contact-phone" label="Contact Phone">
                      <TextInput
                        id="contact-phone"
                        type="tel"
                        value={settings.contactPhone}
                        onChange={(e) => updateSetting('contactPhone', e.target.value)}
                      />
                    </FormField>
                    <FormField id="address" label="Address" className="md:col-span-2">
                      <TextInput
                        id="address"
                        type="text"
                        value={settings.address}
                        onChange={(e) => updateSetting('address', e.target.value)}
                      />
                    </FormField>
                  </div>
                </Card>

                <Card title="Localization" description="Regional settings for your platform">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField id="timezone" label="Timezone">
                      <Select
                        id="timezone"
                        value={settings.timezone}
                        onChange={(e) => updateSetting('timezone', e.target.value)}
                      >
                        <option value="America/Santo_Domingo">America/Santo_Domingo</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="America/Los_Angeles">America/Los_Angeles</option>
                        <option value="Europe/Madrid">Europe/Madrid</option>
                      </Select>
                    </FormField>
                    <FormField id="language" label="Language">
                      <Select
                        id="language"
                        value={settings.language}
                        onChange={(e) => updateSetting('language', e.target.value)}
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </Select>
                    </FormField>
                    <FormField id="currency" label="Currency">
                      <Select
                        id="currency"
                        value={settings.currency}
                        onChange={(e) => updateSetting('currency', e.target.value)}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="DOP">DOP (RD$)</option>
                        <option value="EUR">EUR (€)</option>
                      </Select>
                    </FormField>
                  </div>
                </Card>

                <Card title="Social Media" description="Your social media profile links">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="facebook-url" label="Facebook URL">
                      <TextInput
                        id="facebook-url"
                        type="url"
                        value={settings.facebookUrl}
                        onChange={(e) => updateSetting('facebookUrl', e.target.value)}
                        placeholder="https://facebook.com/viventa"
                      />
                    </FormField>
                    <FormField id="instagram-url" label="Instagram URL">
                      <TextInput
                        id="instagram-url"
                        type="url"
                        value={settings.instagramUrl}
                        onChange={(e) => updateSetting('instagramUrl', e.target.value)}
                        placeholder="https://instagram.com/viventa"
                      />
                    </FormField>
                    <FormField id="twitter-url" label="Twitter/X URL">
                      <TextInput
                        id="twitter-url"
                        type="url"
                        value={settings.twitterUrl}
                        onChange={(e) => updateSetting('twitterUrl', e.target.value)}
                        placeholder="https://twitter.com/viventa"
                      />
                    </FormField>
                    <FormField id="linkedin-url" label="LinkedIn URL">
                      <TextInput
                        id="linkedin-url"
                        type="url"
                        value={settings.linkedinUrl}
                        onChange={(e) => updateSetting('linkedinUrl', e.target.value)}
                        placeholder="https://linkedin.com/company/viventa"
                      />
                    </FormField>
                  </div>
                </Card>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <Card title="Email Provider" description="Configure your email service provider">
                  <FormField id="email-provider" label="Email Service">
                    <Select
                      id="email-provider"
                      value={settings.emailProvider}
                      onChange={(e) => updateSetting('emailProvider', e.target.value)}
                    >
                      <option value="none">None (Disabled)</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="smtp">SMTP</option>
                    </Select>
                  </FormField>

                  {settings.emailProvider === 'sendgrid' && (
                    <FormField 
                      id="sendgrid-api-key" 
                      label="SendGrid API Key"
                      hint="Get your API key from SendGrid dashboard"
                    >
                      <TextInput
                        id="sendgrid-api-key"
                        type="password"
                        value={settings.sendgridApiKey}
                        onChange={(e) => updateSetting('sendgridApiKey', e.target.value)}
                        placeholder="SG.xxxxxxxxxxxx"
                      />
                    </FormField>
                  )}

                  {settings.emailProvider === 'smtp' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField id="smtp-host" label="SMTP Host">
                        <TextInput
                          id="smtp-host"
                          type="text"
                          value={settings.smtpHost}
                          onChange={(e) => updateSetting('smtpHost', e.target.value)}
                          placeholder="smtp.gmail.com"
                        />
                      </FormField>
                      <FormField id="smtp-port" label="SMTP Port">
                        <TextInput
                          id="smtp-port"
                          type="number"
                          value={settings.smtpPort.toString()}
                          onChange={(e) => updateSetting('smtpPort', parseInt(e.target.value))}
                        />
                      </FormField>
                      <FormField id="smtp-user" label="SMTP Username">
                        <TextInput
                          id="smtp-user"
                          type="text"
                          value={settings.smtpUser}
                          onChange={(e) => updateSetting('smtpUser', e.target.value)}
                        />
                      </FormField>
                      <FormField id="smtp-pass" label="SMTP Password">
                        <TextInput
                          id="smtp-pass"
                          type="password"
                          value={settings.smtpPass}
                          onChange={(e) => updateSetting('smtpPass', e.target.value)}
                        />
                      </FormField>
                    </div>
                  )}
                </Card>

                <Card title="Email Configuration" description="Set default email addresses for outgoing mail">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="email-from" label="From Email">
                      <TextInput
                        id="email-from"
                        type="email"
                        value={settings.emailFrom}
                        onChange={(e) => updateSetting('emailFrom', e.target.value)}
                        placeholder="noreply@viventa.com"
                      />
                    </FormField>
                    <FormField id="email-reply-to" label="Reply-To Email">
                      <TextInput
                        id="email-reply-to"
                        type="email"
                        value={settings.emailReplyTo}
                        onChange={(e) => updateSetting('emailReplyTo', e.target.value)}
                        placeholder="support@viventa.com"
                      />
                    </FormField>
                  </div>
                </Card>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card title="Authentication" description="Configure authentication and access controls">
                  <Toggle
                    id="enable-two-factor"
                    label="Enable Two-Factor Authentication"
                    description="Require 2FA for admin accounts"
                    checked={settings.enableTwoFactor}
                    onChange={(checked) => updateSetting('enableTwoFactor', checked)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField id="session-timeout" label="Session Timeout (minutes)">
                      <TextInput
                        id="session-timeout"
                        type="number"
                        value={settings.sessionTimeout.toString()}
                        onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                      />
                    </FormField>
                    <FormField id="password-min-length" label="Min Password Length">
                      <TextInput
                        id="password-min-length"
                        type="number"
                        value={settings.passwordMinLength.toString()}
                        onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                      />
                    </FormField>
                  </div>

                  <Toggle
                    id="require-strong-password"
                    label="Require Strong Passwords"
                    description="Uppercase, lowercase, numbers, and symbols"
                    checked={settings.requireStrongPassword}
                    onChange={(checked) => updateSetting('requireStrongPassword', checked)}
                  />

                  <FormField 
                    id="allowed-domains" 
                    label="Allowed Email Domains (comma-separated)"
                    hint="Leave empty to allow all domains"
                    className="mt-4"
                  >
                    <TextInput
                      id="allowed-domains"
                      type="text"
                      value={settings.allowedDomains}
                      onChange={(e) => updateSetting('allowedDomains', e.target.value)}
                      placeholder="viventa.com, example.com"
                    />
                  </FormField>
                </Card>
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <Card 
                  title={
                    <span className="flex items-center gap-2">
                      <FiDollarSign /> Stripe Payment Integration
                    </span>
                  }
                  description="Configure Stripe for payment processing"
                >
                  <div className="space-y-4">
                    <FormField id="stripe-publishable-key" label="Publishable Key">
                      <TextInput
                        id="stripe-publishable-key"
                        type="text"
                        value={settings.stripePublishableKey}
                        onChange={(e) => updateSetting('stripePublishableKey', e.target.value)}
                        placeholder="pk_test_..."
                      />
                    </FormField>
                    <FormField id="stripe-secret-key" label="Secret Key">
                      <TextInput
                        id="stripe-secret-key"
                        type="password"
                        value={settings.stripeSecretKey}
                        onChange={(e) => updateSetting('stripeSecretKey', e.target.value)}
                        placeholder="sk_test_..."
                      />
                    </FormField>
                  </div>
                </Card>

                <Card title="Analytics" description="Third-party analytics integrations">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="google-analytics-id" label="Google Analytics ID">
                      <TextInput
                        id="google-analytics-id"
                        type="text"
                        value={settings.googleAnalyticsId}
                        onChange={(e) => updateSetting('googleAnalyticsId', e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                      />
                    </FormField>
                    <FormField id="facebook-pixel-id" label="Facebook Pixel ID">
                      <TextInput
                        id="facebook-pixel-id"
                        type="text"
                        value={settings.facebookPixelId}
                        onChange={(e) => updateSetting('facebookPixelId', e.target.value)}
                        placeholder="1234567890"
                      />
                    </FormField>
                  </div>
                </Card>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <Card title="Notification Channels" description="Configure how notifications are delivered">
                  <Toggle
                    id="admin-email-notifications"
                    label="Admin Email Notifications"
                    description="Receive email alerts for important events"
                    checked={settings.adminEmailNotifications}
                    onChange={(checked) => updateSetting('adminEmailNotifications', checked)}
                  />
                  <Toggle
                    id="user-email-notifications"
                    label="User Email Notifications"
                    description="Allow users to receive email notifications"
                    checked={settings.userEmailNotifications}
                    onChange={(checked) => updateSetting('userEmailNotifications', checked)}
                  />
                  <Toggle
                    id="push-notifications"
                    label="Push Notifications"
                    description="Enable browser push notifications"
                    checked={settings.pushNotifications}
                    onChange={(checked) => updateSetting('pushNotifications', checked)}
                  />
                  <Toggle
                    id="sms-notifications"
                    label="SMS Notifications"
                    description="Send SMS alerts (requires Twilio)"
                    checked={settings.smsNotifications}
                    onChange={(checked) => updateSetting('smsNotifications', checked)}
                  />
                </Card>

                <Card title="Event Notifications" description="Configure alerts for specific events">
                  <Toggle
                    id="notify-new-lead"
                    label="New Lead Notifications"
                    description="Alert when new lead is created"
                    checked={settings.notifyOnNewLead}
                    onChange={(checked) => updateSetting('notifyOnNewLead', checked)}
                  />
                  <Toggle
                    id="notify-new-application"
                    label="New Application Notifications"
                    description="Alert when agent/broker applies"
                    checked={settings.notifyOnNewApplication}
                    onChange={(checked) => updateSetting('notifyOnNewApplication', checked)}
                  />
                  <Toggle
                    id="notify-new-property"
                    label="New Property Notifications"
                    description="Alert when new property is submitted"
                    checked={settings.notifyOnNewProperty}
                    onChange={(checked) => updateSetting('notifyOnNewProperty', checked)}
                  />
                </Card>
              </div>
            )}

            {/* Gamification */}
            {activeTab === 'gamification' && (
              <div className="space-y-6">
                {/* Coming Soon Banner */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white text-center shadow-lg">
                  <FiZap className="text-6xl mx-auto mb-4 opacity-90" />
                  <h2 className="text-3xl font-bold mb-2">Gamification System</h2>
                  <p className="text-lg opacity-90">Coming Soon</p>
                  <p className="text-sm opacity-75 mt-2">Advanced points, badges, levels & rewards system in development</p>
                </div>

                {/* Preview: Points System */}
                <div className="bg-white rounded-lg shadow p-6 opacity-75">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545] flex items-center gap-2">
                    <FiDollarSign /> Points System
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-normal">Preview</span>
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="font-medium mb-2">Action Rewards</div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between"><span>Profile completion</span><span>+100 pts</span></div>
                        <div className="flex justify-between"><span>Property view</span><span>+5 pts</span></div>
                        <div className="flex justify-between"><span>Save favorite</span><span>+10 pts</span></div>
                        <div className="flex justify-between"><span>Property inquiry</span><span>+50 pts</span></div>
                        <div className="flex justify-between"><span>Property listing</span><span>+200 pts</span></div>
                        <div className="flex justify-between"><span>Social post</span><span>+25 pts</span></div>
                        <div className="flex justify-between"><span>Referral signup</span><span>+500 pts</span></div>
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="font-medium mb-2">Point Redemption</div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between"><span>Premium listing boost</span><span>1,000 pts</span></div>
                        <div className="flex justify-between"><span>Featured badge (7 days)</span><span>2,500 pts</span></div>
                        <div className="flex justify-between"><span>Profile verification</span><span>500 pts</span></div>
                        <div className="flex justify-between"><span>Analytics access (30d)</span><span>3,000 pts</span></div>
                        <div className="flex justify-between"><span>Gift card $10</span><span>5,000 pts</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview: Badges */}
                <div className="bg-white rounded-lg shadow p-6 opacity-75">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545] flex items-center gap-2">
                    <FiImage /> Achievement Badges
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-normal">Preview</span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg text-center border-2 border-yellow-300">
                      <div className="text-3xl mb-2">🏆</div>
                      <div className="font-semibold text-sm">First Listing</div>
                      <div className="text-xs text-gray-600">Post your first property</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-center border-2 border-blue-300">
                      <div className="text-3xl mb-2">⭐</div>
                      <div className="font-semibold text-sm">Power User</div>
                      <div className="text-xs text-gray-600">30 days active streak</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg text-center border-2 border-green-300">
                      <div className="text-3xl mb-2">💎</div>
                      <div className="font-semibold text-sm">Verified Pro</div>
                      <div className="text-xs text-gray-600">Complete verification</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg text-center border-2 border-purple-300">
                      <div className="text-3xl mb-2">🚀</div>
                      <div className="font-semibold text-sm">Top Referrer</div>
                      <div className="text-xs text-gray-600">Refer 10+ users</div>
                    </div>
                  </div>
                </div>

                {/* Preview: Leaderboards */}
                <div className="bg-white rounded-lg shadow p-6 opacity-75">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545] flex items-center gap-2">
                    <FiZap /> Leaderboards & Levels
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-normal">Preview</span>
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium mb-3">User Levels</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">🥉 Bronze (0-999 pts)</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">🥈 Silver (1,000-4,999 pts)</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">🥇 Gold (5,000-14,999 pts)</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded">
                          <span className="text-sm font-semibold">💎 Platinum (15,000+ pts)</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-3">Leaderboard Types</div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="p-2 bg-blue-50 rounded">📊 Most Active Users (Weekly)</div>
                        <div className="p-2 bg-green-50 rounded">🏠 Top Listers (Monthly)</div>
                        <div className="p-2 bg-purple-50 rounded">💬 Social Champions (All-time)</div>
                        <div className="p-2 bg-yellow-50 rounded">🎯 Referral Masters (All-time)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview: Metrics Dashboard */}
                <div className="bg-white rounded-lg shadow p-6 opacity-75">
                  <h2 className="text-xl font-semibold mb-4 text-[#0B2545] flex items-center gap-2">
                    <FiServer /> Gamification Analytics
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-normal">Preview</span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">-</div>
                      <div className="text-sm text-gray-600">Total Points Awarded</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">-</div>
                      <div className="text-sm text-gray-600">Active Players</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">-</div>
                      <div className="text-sm text-gray-600">Badges Earned</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">-</div>
                      <div className="text-sm text-gray-600">Rewards Redeemed</div>
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
                        <span className="sr-only">Toggle maintenance mode</span>
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
                        <span className="sr-only">Toggle caching</span>
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.cacheEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label htmlFor="rate-limit" className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (requests/minute)</label>
                      <input
                        id="rate-limit"
                        type="number"
                        value={settings.rateLimitPerMinute}
                        onChange={(e) => updateSetting('rateLimitPerMinute', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="log-level" className="block text-sm font-medium text-gray-700 mb-2">Log Level</label>
                      <select
                        id="log-level"
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
                        <span className="sr-only">Toggle API access</span>
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.enableApiAccess ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.enableApiAccess && (
                      <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                        <div className="flex gap-2">
                          <input
                            id="api-key"
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

            {/* Database Tab - Firebase Cleanup */}
            {activeTab === 'database' && <DatabaseCleanupTab />}

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
