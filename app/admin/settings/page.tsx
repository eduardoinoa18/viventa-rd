// app/admin/settings/page.tsx
'use client'
import { useEffect, useState } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'

export default function AdminSettingsPage() {
  const [siteTitle, setSiteTitle] = useState('VIVENTA')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [saved, setSaved] = useState(false)
  const [diag, setDiag] = useState<any>(null)
  const [diagError, setDiagError] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/diagnostics')
        const json = await res.json()
        if (json.ok) setDiag(json.data)
        else setDiagError(json.error || 'Failed to load diagnostics')
      } catch (e) {
        setDiagError('Network error loading diagnostics')
      }
    })()
  }, [])

  function handleSave() {
    // In production: await fetch('/api/admin/settings', { method: 'POST', body: JSON.stringify({ siteTitle, maintenanceMode }) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <h1 className="text-3xl font-bold text-[#0B2545] mb-6">System Settings</h1>

          <div className="max-w-4xl space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Diagnostics</h2>
              {diagError && (
                <div className="mb-4 px-4 py-2 bg-red-50 text-red-800 border border-red-200 rounded">{diagError}</div>
              )}
              {!diag ? (
                <div className="text-gray-500">Loading...</div>
              ) : (
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
                  <Section title="Mapbox" items={[
                    {label:'Token', ok: diag.mapbox.token},
                  ]} />
                  <Section title="Admin Auth" items={[
                    {label:'Allow Any (override)', ok: diag.adminAuth.allowAny},
                    {label:'Return Dev Code', ok: diag.adminAuth.allowDevResponse},
                    {label:'Allowlist Configured', ok: diag.adminAuth.allowlistConfigured},
                  ]} tip={!diag.adminAuth.allowlistConfigured ? 'Set MASTER_ADMIN_EMAILS to restrict access in production' : undefined} />
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">General Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Title
                  </label>
                  <input 
                    type="text"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-t">
                  <div>
                    <div className="font-medium">Maintenance Mode</div>
                    <div className="text-sm text-gray-500">Temporarily disable public access</div>
                  </div>
                  <button
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      maintenanceMode ? 'bg-[#00A676]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] transition-colors"
                >
                  Save Changes
                </button>
                {saved && (
                  <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                    ✓ Saved successfully
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
              <p className="text-gray-600 mb-4">Irreversible actions. Use with caution.</p>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
                Clear All Cache
              </button>
            </div>
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
