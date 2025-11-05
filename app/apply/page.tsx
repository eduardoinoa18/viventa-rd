'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { db } from '../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { FiCheck, FiArrowLeft, FiArrowRight, FiBriefcase, FiUsers, FiStar, FiHelpCircle } from 'react-icons/fi'
import { uploadFile, validateFile, generateApplicationFilePath } from '@/lib/storageService'

type ApplicationType = 'agent' | 'broker' | 'new-agent'

interface FormData {
  // Step 1: Type Selection & Basic Info
  type: ApplicationType
  contact: string
  email: string
  phone: string
  
  // Step 2: Experience & Background (conditional)
  company: string
  license: string
  years: number
  volume12m: number
  brokerage: string
  
  // Step 2b: New Agent Path
  education: string
  whyRealEstate: string
  availability: string
  
  // Step 3: Professional Details
  address: string
  markets: string
  languages: string
  specialties: string
  currency: 'USD' | 'DOP'
  
  // Step 4: Broker-specific
  agents: number
  annualVolume12m: number
  offices: number
  crm: string
  insurance: boolean
  
  // Step 5: Additional Info & Motivation
  businessDetails: string
  website: string
  socialMedia: string
  referralSource: string
}

export default function ApplyPageNew() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [bizDocFile, setBizDocFile] = useState<File | null>(null)

  const [form, setForm] = useState<FormData>({
    type: 'agent',
    contact: '',
    email: '',
    phone: '',
    company: '',
    license: '',
    years: 0,
    volume12m: 0,
    brokerage: '',
    education: '',
    whyRealEstate: '',
    availability: '',
    address: '',
    markets: '',
    languages: '',
    specialties: '',
    currency: 'USD',
    agents: 0,
    annualVolume12m: 0,
    offices: 1,
    crm: '',
    insurance: false,
    businessDetails: '',
    website: '',
    socialMedia: '',
    referralSource: ''
  })

  const totalSteps = form.type === 'broker' ? 5 : form.type === 'new-agent' ? 4 : 5
  const progress = (currentStep / totalSteps) * 100

  function updateForm(updates: Partial<FormData>) {
    setForm(prev => ({ ...prev, ...updates }))
  }

  function nextStep() {
    // Validation for each step
    if (currentStep === 1) {
      if (!form.contact || !form.email || !form.phone) {
        toast.error('Por favor completa todos los campos requeridos')
        return
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function skipStep() {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      toast('Paso omitido - puedes completarlo después', { icon: '⏭️' })
    }
  }

  async function handleSubmit() {
    // Final validation
    if (!form.email || !form.contact || !form.phone) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    if (form.type === 'new-agent') {
      if (!form.whyRealEstate || form.whyRealEstate.length < 100) {
        toast.error('Por favor explica por qué quieres ser agente inmobiliario (mínimo 100 caracteres)')
        return
      }
    } else {
      if (!form.businessDetails || form.businessDetails.length < 50) {
        toast.error('Por favor describe tu experiencia y objetivos (mínimo 50 caracteres)')
        return
      }
    }

    setSubmitting(true)

    try {
      const isE2E = typeof window !== 'undefined' && 
        (window.localStorage.getItem('E2E_MOCK') === '1' || 
         new URLSearchParams(window.location.search).has('e2e'))

      if (isE2E) {
        await new Promise(res => setTimeout(res, 500))
        setSubmitted(true)
        return
      }

      let resumeUrl: string | undefined
      let documentUrl: string | undefined

      // Upload resume for agents
      if ((form.type === 'agent' || form.type === 'new-agent') && resumeFile) {
        const validation = validateFile(resumeFile)
        if (!validation.valid) {
          toast.error(validation.error || 'Archivo inválido')
          setSubmitting(false)
          return
        }
        const path = generateApplicationFilePath('agent', resumeFile.name)
        resumeUrl = await uploadFile(resumeFile, path, setUploadProgress)
      }

      // Upload documents for brokers
      if (form.type === 'broker' && bizDocFile) {
        const validation = validateFile(bizDocFile)
        if (!validation.valid) {
          toast.error(validation.error || 'Archivo inválido')
          setSubmitting(false)
          return
        }
        const path = generateApplicationFilePath('broker', bizDocFile.name)
        documentUrl = await uploadFile(bizDocFile, path, setUploadProgress)
      }

      // Create application document
      const applicationData: any = {
        ...form,
        status: 'pending',
        createdAt: serverTimestamp(),
        pathway: form.type === 'new-agent' ? 'new_agent_program' : 'experienced'
      }

      if (resumeUrl) applicationData.resumeUrl = resumeUrl
      if (documentUrl) applicationData.documentUrl = documentUrl

      const docRef = await addDoc(collection(db, 'applications'), applicationData)

      // Send confirmation email (fire-and-forget)
      fetch('/api/applications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          name: form.contact, 
          type: form.type,
          pathway: form.type === 'new-agent' ? 'new_agent' : 'experienced'
        })
      }).catch(err => console.error('Email error:', err))

      // Notify admin (fire-and-forget)
      fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.contact,
          email: form.email,
          phone: form.phone,
          message: `Nueva solicitud ${form.type === 'new-agent' ? '(Agente Nuevo)' : form.type}: ${form.contact}\n\nID: ${docRef.id}\n\nDetalles:\n${form.businessDetails || form.whyRealEstate}`,
          subject: `Nueva Solicitud: ${form.type === 'agent' ? 'Agente Experimentado' : form.type === 'new-agent' ? 'Agente Nuevo' : 'Bróker'} - ${form.contact}`,
          source: 'application_form'
        })
      }).catch(err => console.error('Notification error:', err))

      setSubmitted(true)
      toast.success('¡Solicitud enviada exitosamente!')
    } catch (error: any) {
      console.error('Application error:', error)
      toast.error(error?.message || 'Error al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-lg bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center animate-fade-in">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <FiCheck className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">¡Solicitud Recibida!</h1>
          <p className="text-lg text-gray-600 mb-2">
            Gracias por tu interés en unirte a VIVENTA
          </p>
          <p className="text-gray-500 mb-8">
            Revisaremos tu solicitud y te contactaremos en 24-48 horas.
          </p>
          
          {form.type === 'new-agent' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Programa de Agentes Nuevos:</strong> Recibirás información sobre nuestro programa de capacitación y mentoría.
              </p>
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors mb-6"
          >
            <FiArrowLeft className="text-xl" />
            Volver
          </button>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Únete a VIVENTA
          </h1>
          <p className="text-xl text-gray-600">
            Completa tu solicitud en {totalSteps} pasos simples
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Paso {currentStep} de {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-[#00A676] to-[#00A6A6] transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 transition-all duration-300">
          {/* Step 1: Type Selection & Basic Info */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                ¿Cómo quieres unirte?
              </h2>
              <p className="text-gray-600 mb-8">
                Selecciona la opción que mejor te describe
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => updateForm({ type: 'agent' })}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    form.type === 'agent'
                      ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <FiBriefcase className="mx-auto text-4xl mb-3 text-blue-600" />
                  <h3 className="font-bold text-lg mb-2">Agente Experimentado</h3>
                  <p className="text-sm text-gray-600">
                    Ya tienes experiencia en bienes raíces
                  </p>
                </button>

                <button
                  onClick={() => updateForm({ type: 'new-agent' })}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    form.type === 'new-agent'
                      ? 'border-green-600 bg-green-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                  }`}
                >
                  <FiStar className="mx-auto text-4xl mb-3 text-green-600" />
                  <h3 className="font-bold text-lg mb-2">Agente Nuevo</h3>
                  <p className="text-sm text-gray-600">
                    Quiero comenzar mi carrera inmobiliaria
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Capacitación incluida
                  </span>
                </button>

                <button
                  onClick={() => updateForm({ type: 'broker' })}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    form.type === 'broker'
                      ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <FiUsers className="mx-auto text-4xl mb-3 text-purple-600" />
                  <h3 className="font-bold text-lg mb-2">Bróker</h3>
                  <p className="text-sm text-gray-600">
                    Tengo mi propia inmobiliaria
                  </p>
                </button>
              </div>

              {form.type === 'new-agent' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <FiHelpCircle className="text-3xl text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 mb-2">
                        Programa para Agentes Nuevos
                      </h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Diseñado para personas sin experiencia previa que quieren iniciar en bienes raíces. Incluye:
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>✅ Capacitación básica en ventas inmobiliarias</li>
                        <li>✅ Mentoría con agentes experimentados</li>
                        <li>✅ Acceso a herramientas y recursos</li>
                        <li>✅ Apoyo en tus primeras transacciones</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Información de Contacto</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.contact}
                      onChange={e => updateForm({ contact: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="Juan Pérez García"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => updateForm({ email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="juan@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => updateForm({ phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="(809) 555-1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {form.type === 'broker' ? 'Empresa' : 'Inmobiliaria Actual'}
                      {form.type === 'new-agent' && ' (Opcional)'}
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={e => updateForm({ company: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder={form.type === 'new-agent' ? 'Ninguna (soy nuevo)' : 'Mi Empresa Inmobiliaria'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Experience (Experienced Agents/Brokers) */}
          {currentStep === 2 && form.type !== 'new-agent' && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Tu Experiencia Profesional
              </h2>
              <p className="text-gray-600 mb-8">
                Cuéntanos sobre tu trayectoria en bienes raíces
              </p>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {form.type === 'broker' ? 'Licencia de Bróker' : 'Número de Licencia'}
                      <span className="text-gray-500 text-xs ml-2">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.license}
                      onChange={e => updateForm({ license: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="RD-12345"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si no tienes licencia aún, déjalo en blanco
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Años de Experiencia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.years}
                      onChange={e => updateForm({ years: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Volumen de Ventas (últimos 12 meses)
                      <span className="text-gray-500 text-xs ml-2">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        value={form.volume12m}
                        onChange={e => updateForm({ volume12m: parseInt(e.target.value) || 0 })}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder="500000"
                      />
                    </div>
                  </div>

                  {form.type === 'agent' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Inmobiliaria Actual
                      </label>
                      <input
                        type="text"
                        value={form.brokerage}
                        onChange={e => updateForm({ brokerage: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder="RE/MAX, Century 21, etc."
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Currículum (CV) <span className="text-gray-500 text-xs">(Opcional pero recomendado)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-all">
                    <input
                      type="file"
                      id="resume"
                      accept=".pdf,.doc,.docx"
                      onChange={e => setResumeFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="resume" className="cursor-pointer">
                      <FiBriefcase className="mx-auto text-4xl text-gray-400 mb-2" />
                      <p className="font-medium text-gray-700">
                        {resumeFile ? resumeFile.name : 'Haz clic para adjuntar tu CV'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOC o DOCX - Máx. 5MB</p>
                    </label>
                  </div>
                  {uploadProgress > 0 && submitting && (
                    <div className="mt-2 text-sm text-blue-600">
                      Subiendo: {Math.round(uploadProgress)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2b: New Agent Path */}
          {currentStep === 2 && form.type === 'new-agent' && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Tu Motivación
              </h2>
              <p className="text-gray-600 mb-8">
                Queremos conocer por qué quieres ser agente inmobiliario
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Educación / Experiencia Laboral Previa <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.education}
                    onChange={e => updateForm({ education: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                    placeholder="Ej: Licenciatura en Administración, 5 años en ventas retail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ¿Por qué quieres ser agente inmobiliario? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.whyRealEstate}
                    onChange={e => updateForm({ whyRealEstate: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                    placeholder="Cuéntanos tu motivación, qué te atrae de los bienes raíces, y por qué crees que serías un buen agente. Mínimo 100 caracteres."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {form.whyRealEstate.length}/100 caracteres mínimos
                  </p>
                </div>

                  <div>
                    <label htmlFor="availability" className="block text-sm font-semibold text-gray-700 mb-2">
                      Disponibilidad <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="availability"
                      value={form.availability}
                      onChange={e => updateForm({ availability: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      aria-label="Disponibilidad"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="full-time">Tiempo completo (40+ horas/semana)</option>
                      <option value="part-time">Medio tiempo (20-30 horas/semana)</option>
                      <option value="flexible">Flexible (fines de semana/tardes)</option>
                    </select>
                  </div>
              </div>
            </div>
          )}

          {/* Step 3: Professional Details (All types) */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Detalles Profesionales
              </h2>
              <p className="text-gray-600 mb-8">
                Información adicional sobre tu perfil profesional
              </p>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dirección de Oficina
                      <span className="text-gray-500 text-xs ml-2">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => updateForm({ address: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="Av. Abraham Lincoln, Santo Domingo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Zonas de Trabajo
                    </label>
                    <input
                      type="text"
                      value={form.markets}
                      onChange={e => updateForm({ markets: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="Santo Domingo, Punta Cana, Santiago"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Idiomas
                    </label>
                    <input
                      type="text"
                      value={form.languages}
                      onChange={e => updateForm({ languages: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="Español, Inglés, Francés"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Especialidades
                      <span className="text-gray-500 text-xs ml-2">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.specialties}
                      onChange={e => updateForm({ specialties: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="Propiedades de lujo, Inversión, Vacacionales"
                    />
                  </div>

                  <div>
                    <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-2">
                      Moneda Preferida
                    </label>
                    <select
                      id="currency"
                      value={form.currency}
                      onChange={e => updateForm({ currency: e.target.value as 'USD' | 'DOP' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      aria-label="Moneda preferida"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="DOP">DOP (RD$)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <FiHelpCircle className="text-2xl text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-900">
                    <strong>Tip:</strong> Completa todos los campos para aumentar tus posibilidades de aprobación rápida
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Broker Details OR Final Details */}
          {currentStep === 4 && form.type === 'broker' && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Información de tu Inmobiliaria
              </h2>
              <p className="text-gray-600 mb-8">
                Detalles sobre tu empresa y equipo
              </p>

              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Número de Agentes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.agents}
                      onChange={e => updateForm({ agents: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Volumen Anual Total
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        value={form.annualVolume12m}
                        onChange={e => updateForm({ annualVolume12m: parseInt(e.target.value) || 0 })}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder="2000000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Número de Oficinas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.offices}
                      onChange={e => updateForm({ offices: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sistema CRM Actual
                    <span className="text-gray-500 text-xs ml-2">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.crm}
                    onChange={e => updateForm({ crm: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Salesforce, HubSpot, etc."
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <input
                    type="checkbox"
                    id="insurance"
                    checked={form.insurance}
                    onChange={e => updateForm({ insurance: e.target.checked })}
                    className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="insurance" className="text-sm text-purple-900">
                    <strong>Mi empresa cuenta con seguro E&O (Errors & Omissions)</strong>
                    <br />
                    <span className="text-xs">Esto protege a tu empresa y clientes de errores profesionales</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Documentos Corporativos
                    <span className="text-gray-500 text-xs ml-2">(Opcional pero recomendado)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-all">
                    <input
                      type="file"
                      id="bizDoc"
                      accept=".pdf,.doc,.docx"
                      onChange={e => setBizDocFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="bizDoc" className="cursor-pointer">
                      <FiUsers className="mx-auto text-4xl text-gray-400 mb-2" />
                      <p className="font-medium text-gray-700">
                        {bizDocFile ? bizDocFile.name : 'Adjunta licencia de negocio o certificaciones'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOC o DOCX - Máx. 10MB</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5 (or 4 for non-brokers): Motivation & Additional Info */}
          {((currentStep === 5 && form.type === 'broker') || 
            (currentStep === 4 && form.type === 'agent') ||
            (currentStep === 4 && form.type === 'new-agent')) && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Información Adicional
              </h2>
              <p className="text-gray-600 mb-8">
                Completa tu perfil con algunos detalles más
              </p>

              <div className="space-y-6">
                {form.type !== 'new-agent' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ¿Por qué quieres unirte a VIVENTA? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.businessDetails}
                      onChange={e => updateForm({ businessDetails: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                      placeholder="Cuéntanos sobre tu experiencia, objetivos, cómo planeas usar VIVENTA, y qué valor puedes aportar a la plataforma. Mínimo 50 caracteres."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {form.businessDetails.length}/50 caracteres mínimos
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sitio Web
                      <span className="text-gray-500 text-xs ml-2">(Opcional)</span>
                    </label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={e => updateForm({ website: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="https://tuempresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Redes Sociales
                      <span className="text-gray-500 text-xs ml-2">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.socialMedia}
                      onChange={e => updateForm({ socialMedia: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="@tu_usuario_instagram"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="referralSource" className="block text-sm font-semibold text-gray-700 mb-2">
                    ¿Cómo nos conociste?
                  </label>
                  <select
                    id="referralSource"
                    value={form.referralSource}
                    onChange={e => updateForm({ referralSource: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    aria-label="Fuente de referencia"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="google">Google / Búsqueda web</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="referral">Referido de otro agente/bróker</option>
                    <option value="event">Evento o conferencia</option>
                    <option value="ad">Publicidad online</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl">
                  <h4 className="font-bold text-lg text-gray-900 mb-2">
                    ¡Casi terminas! 🎉
                  </h4>
                  <p className="text-sm text-gray-700">
                    Revisa que toda la información esté correcta antes de enviar tu solicitud. 
                    Recibirás una respuesta en 24-48 horas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4 mt-10 pt-8 border-t-2">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <FiArrowLeft />
                Anterior
              </button>
            )}

            <div className="flex-1" />

            {/* Skip button for optional steps */}
            {((currentStep === 2 && form.type === 'agent') || 
              (currentStep === 3) ||
              (currentStep === 4 && form.type === 'broker')) && (
              <button
                onClick={skipStep}
                className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Omitir paso →
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
              >
                Siguiente
                <FiArrowRight />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <FiCheck />
                    Enviar Solicitud
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
