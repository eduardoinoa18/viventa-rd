'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import ProfessionalSidebar from '@/components/ProfessionalSidebar'
import { FiSave, FiUpload, FiUser, FiGlobe, FiMail, FiPhone, FiBriefcase } from 'react-icons/fi'

export default function AgentProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
    specialties: '',
    languages: 'Español',
    website: '',
    company: '',
  })
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'agent') {
      router.replace('/agent/login')
      return
    }
    setUser(s)
    // In production load profile details
  }, [])

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      // POST to /api/profile (to implement)
      await new Promise((res) => setTimeout(res, 800))
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ProfessionalSidebar
        role="agent"
        userName={user.name}
        professionalCode={user.professionalCode || user.agentCode}
      />
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0B2545] mb-2">Mi Perfil Profesional</h1>
            <p className="text-gray-600">Actualiza tu información pública y de contacto</p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-10">
              <div className="md:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00A676] to-[#00C896] mx-auto flex items-center justify-center text-white text-4xl font-bold mb-4">
                    {user.name?.[0] || 'A'}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Foto de perfil</p>
                  <button className="px-4 py-2 text-sm font-medium bg-[#0B2545] text-white rounded-lg hover:bg-[#123960] inline-flex items-center gap-2">
                    <FiUpload /> Subir nueva
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                    <input
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(809) 555-1234"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sitio Web</label>
                    <input
                      value={form.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Especialidades (separadas por coma)</label>
                  <input
                    value={form.specialties}
                    onChange={(e) => handleChange('specialties', e.target.value)}
                    placeholder="Residencial, Comercial, Alquileres"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Idiomas</label>
                    <input
                      value={form.languages}
                      onChange={(e) => handleChange('languages', e.target.value)}
                      placeholder="Español, Inglés"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Empresa / Brokerage</label>
                    <input
                      value={form.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      placeholder="Nombre de empresa"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Biografía</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    rows={5}
                    placeholder="Cuenta tu experiencia, enfoque y logros profesionales..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                </div>
                <div className="pt-4">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#00C896] text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <FiSave /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
        </div>
      </main>
    </div>
  )
}
