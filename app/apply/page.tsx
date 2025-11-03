'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { db } from '../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { FiSend, FiUsers, FiBriefcase, FiArrowLeft } from 'react-icons/fi'
import { uploadFile, validateFile, generateApplicationFilePath } from '@/lib/storageService'

export default function ApplyPage(){
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    type:'agent',
    contact:'', email:'', phone:'', company:'', address:'', markets:'', currency:'USD',
    license:'', years:0, volume12m:0, brokerage:'', languages:'', specialties:'',
    agents:0, annualVolume12m:0, offices:1, crm:'', insurance:false,
    businessDetails:'', website:'', socialMedia:'', referralSource:''
  })
  const [submitted,setSubmitted] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [bizDocFile, setBizDocFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  async function submit(){
    console.log('[Apply] Submit clicked', { type: form.type })
    if(!form.email || !form.contact || !form.phone){ 
      toast.error('Por favor completa todos los campos requeridos (*)')
      return 
    }
    if(!form.businessDetails || form.businessDetails.length < 50){ 
      toast.error('Por favor describe por qué quieres unirte a VIVENTA (mínimo 50 caracteres). Esto ayuda a acelerar tu aprobación.')
      return 
    }
    try {
      setSubmitting(true)
      // E2E mock mode: skip real uploads/Writes when enabled via env or query
      const isE2E =
        (typeof window !== 'undefined' && (window.localStorage.getItem('E2E_MOCK') === '1' || new URLSearchParams(window.location.search).has('e2e')))
        || process.env.NEXT_PUBLIC_E2E === '1'

      const withTimeout = <T,>(p: Promise<T>, ms = 15000): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('timeout')), ms)
          p.then((val) => { clearTimeout(timer); resolve(val) })
           .catch((err) => { clearTimeout(timer); reject(err) })
        })
      }
      if (isE2E) {
        // Simulate success or failure quickly for tests
        const shouldFail = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fail')
        await new Promise((res) => setTimeout(res, 300))
        if (shouldFail) throw new Error('Simulated failure (E2E)')
        setSubmitted(true)
        return
      }
      let resumeUrl: string | undefined
      let documentUrl: string | undefined

      if (form.type === 'agent' && resumeFile) {
  const v = validateFile(resumeFile)
  if (!v.valid) { toast.error(v.error || 'Archivo inválido'); setSubmitting(false); return }
        const path = generateApplicationFilePath('agent', resumeFile.name)
        console.log('[Apply] Uploading agent resume...')
        resumeUrl = await withTimeout(uploadFile(resumeFile, path, (p) => setUploadProgress(p)), 20000)
        console.log('[Apply] Resume uploaded:', { resumeUrl })
      }

      if (form.type === 'broker' && bizDocFile) {
  const v = validateFile(bizDocFile)
  if (!v.valid) { toast.error(v.error || 'Archivo inválido'); setSubmitting(false); return }
        const path = generateApplicationFilePath('broker', bizDocFile.name)
        console.log('[Apply] Uploading broker document...')
        documentUrl = await withTimeout(uploadFile(bizDocFile, path, (p) => setUploadProgress(p)), 20000)
        console.log('[Apply] Broker document uploaded:', { documentUrl })
      }

      console.log('[Apply] Creating Firestore application doc...')
      // Only include resumeUrl/documentUrl if they are defined (Firestore rejects undefined)
      const applicationData: any = {
        ...form,
        status:'pending',
        createdAt: serverTimestamp(),
      }
      if (resumeUrl) applicationData.resumeUrl = resumeUrl
      if (documentUrl) applicationData.documentUrl = documentUrl
      
      const docRef = await withTimeout(addDoc(collection(db,'applications'), applicationData), 15000) as any
      console.log('[Apply] Application created:', { id: docRef.id })

      // Immediately show success UI; background notifications won't block UX
      setSubmitted(true)

      // Fire-and-forget notifications with a soft timeout so the UI never hangs

      // Applicant confirmation (non-blocking)
      void withTimeout(fetch('/api/applications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.contact, type: form.type })
      }), 8000).catch((emailErr) => console.error('Email sending failed:', emailErr))

      // Admin notification (non-blocking)
      void withTimeout(fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.contact,
          email: form.email,
          phone: form.phone,
          message: `Nueva solicitud de ${form.type}: ${form.contact}\n\nID: ${docRef.id}\nEmail: ${form.email}\nTeléfono: ${form.phone}\nEmpresa: ${form.company}\n\nDetalles del negocio:\n${form.businessDetails}`,
          subject: `Nueva Solicitud: ${form.type === 'agent' ? 'Agente' : 'Bróker'} - ${form.contact}`,
          source: 'application_form'
        })
      }), 8000).catch((notifyErr) => console.error('Admin notification failed:', notifyErr))
    } catch (e: any) {
      console.error('Application submit failed', e)
      toast.error(e?.message || 'No se pudo enviar la solicitud. Intenta de nuevo.')
    } finally {
      console.log('[Apply] Submit finished (success or error), resetting state')
      setSubmitting(false)
    }
  }

  if(submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in-up">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full animate-bounce">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Solicitud Enviada!</h1>
          <p className="text-gray-600 mb-6">Te contactaremos en 24–48 horas.</p>
          <button 
            onClick={() => router.push('/')}
            className="inline-block px-6 py-3 bg-[#004AAD] text-white rounded-lg font-semibold hover:bg-[#003d8f] transition-all hover:scale-105 active:scale-95"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Navigation */}
        <button 
          onClick={() => router.push('/')} 
          className="mb-6 inline-flex items-center gap-2 text-[#004AAD] font-semibold hover:text-[#003d8f] transition-all active:scale-95 group"
        >
          <FiArrowLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
          <span>Volver al inicio</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Únete a VIVENTA</h1>
          <p className="text-gray-600 mb-6">Completa el formulario para registrarte</p>
          
          <div className="mb-6 flex gap-3">
            <button onClick={()=>setForm({...form,type:'agent'})} className={`flex-1 p-4 border-2 rounded-lg ${form.type==='agent'?'border-blue-600 bg-blue-50':'border-gray-200'}`}>
              <FiBriefcase className="mx-auto text-2xl mb-2"/> Agente
            </button>
            <button onClick={()=>setForm({...form,type:'broker'})} className={`flex-1 p-4 border-2 rounded-lg ${form.type==='broker'?'border-blue-600 bg-blue-50':'border-gray-200'}`}>
              <FiUsers className="mx-auto text-2xl mb-2"/> Bróker
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Nombre *</label>
              <input value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} className="w-full px-4 py-3 border rounded-lg" placeholder="Juan Pérez"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email *</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-4 py-3 border rounded-lg" placeholder="juan@ejemplo.com"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Teléfono *</label>
              <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full px-4 py-3 border rounded-lg" placeholder="(809) 555-1234"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" htmlFor="company">{form.type==='agent'?'Agencia':'Empresa'}</label>
              <input id="company" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" htmlFor="address">Dirección</label>
              <input id="address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Zonas</label>
              <input value={form.markets} onChange={e=>setForm({...form,markets:e.target.value})} className="w-full px-4 py-3 border rounded-lg" placeholder="Santo Domingo, Punta Cana"/>
            </div>
          </div>

          {form.type==='agent' && (
            <div className="mb-6 border-t pt-6">
              <h3 className="font-bold text-lg mb-4">Información del Agente</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-2" htmlFor="license">Licencia</label><input id="license" value={form.license} onChange={e=>setForm({...form,license:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div><label className="block text-sm font-semibold mb-2" htmlFor="years">Años experiencia</label><input id="years" type="number" value={form.years} onChange={e=>setForm({...form,years:+e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div><label className="block text-sm font-semibold mb-2" htmlFor="volume12m">Volumen 12m</label><input id="volume12m" type="number" value={form.volume12m} onChange={e=>setForm({...form,volume12m:+e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div><label className="block text-sm font-semibold mb-2" htmlFor="brokerage">Inmobiliaria actual</label><input id="brokerage" value={form.brokerage} onChange={e=>setForm({...form,brokerage:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-2" htmlFor="languages">Idiomas</label><input id="languages" value={form.languages} onChange={e=>setForm({...form,languages:e.target.value})} className="w-full px-4 py-3 border rounded-lg" placeholder="Español, Inglés"/></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-2" htmlFor="specialties">Especialidades</label><input id="specialties" value={form.specialties} onChange={e=>setForm({...form,specialties:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2" htmlFor="resume">Currículum (Opcional - Recomendado)</label>
                  <input id="resume" type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e)=> setResumeFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 border rounded-lg" aria-label="Adjuntar currículum" />
                  <p className="text-xs text-gray-500 mt-1">Adjuntar tu currículum ayuda a acelerar el proceso de aprobación</p>
                  {uploadProgress > 0 && submitting && (
                    <div className="text-xs text-blue-600 mt-1">Subiendo: {Math.round(uploadProgress)}%</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Business Details Section - Both Agent & Broker */}
          <div className="mb-6 border-t pt-6">
            <h3 className="font-bold text-lg mb-2">Detalles de tu Negocio</h3>
            <p className="text-sm text-gray-600 mb-4">
              📝 <strong>Importante:</strong> Completar esta sección aumenta tus posibilidades de aprobación rápida
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">
                  ¿Por qué quieres unirte a VIVENTA? *
                </label>
                <textarea 
                  value={form.businessDetails} 
                  onChange={e=>setForm({...form,businessDetails:e.target.value})} 
                  className="w-full px-4 py-3 border rounded-lg resize-none"
                  rows={4}
                  placeholder="Cuéntanos sobre tu experiencia, objetivos, y cómo planeas usar la plataforma..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Sitio Web</label>
                <input value={form.website} onChange={e=>setForm({...form,website:e.target.value})} className="w-full px-4 py-3 border rounded-lg" placeholder="https://tuempresa.com"/>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Redes Sociales</label>
                <input value={form.socialMedia} onChange={e=>setForm({...form,socialMedia:e.target.value})} className="w-full px-4 py-3 border rounded-lg" placeholder="Instagram, Facebook, LinkedIn"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2" htmlFor="referralSource">¿Cómo nos conociste?</label>
                <select id="referralSource" value={form.referralSource} onChange={e=>setForm({...form,referralSource:e.target.value})} className="w-full px-4 py-3 border rounded-lg" aria-label="Fuente de referencia">
                  <option value="">Selecciona una opción</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="referral">Referido de otro agente</option>
                  <option value="event">Evento/Conferencia</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {form.type==='broker' && (
            <div className="mb-6 border-t pt-6">
              <h3 className="font-bold text-lg mb-4">Información del Bróker</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-semibold mb-2" htmlFor="agents">N° agentes</label><input id="agents" type="number" value={form.agents} onChange={e=>setForm({...form,agents:+e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div><label className="block text-sm font-semibold mb-2" htmlFor="annualVolume">Volumen anual</label><input id="annualVolume" type="number" value={form.annualVolume12m} onChange={e=>setForm({...form,annualVolume12m:+e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div><label className="block text-sm font-semibold mb-2" htmlFor="offices">N° oficinas</label><input id="offices" type="number" value={form.offices} onChange={e=>setForm({...form,offices:+e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-2" htmlFor="crm">CRM</label><input id="crm" value={form.crm} onChange={e=>setForm({...form,crm:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div className="md:col-span-3 flex items-center gap-2 p-3 bg-blue-50 rounded-lg"><input id="insurance" type="checkbox" checked={form.insurance} onChange={e=>setForm({...form,insurance:e.target.checked})} className="w-5 h-5" aria-label="Seguro E&O"/><label htmlFor="insurance" className="text-sm font-medium">Tenemos seguro E&O</label></div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold mb-2" htmlFor="bizDoc">Documento de negocio (Opcional - Recomendado)</label>
                  <input id="bizDoc" type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e)=> setBizDocFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 border rounded-lg" aria-label="Adjuntar documento de negocio" />
                  <p className="text-xs text-gray-500 mt-1">Licencia de negocio, certificaciones o documentos corporativos</p>
                  {uploadProgress > 0 && submitting && (
                    <div className="text-xs text-blue-600 mt-1">Subiendo: {Math.round(uploadProgress)}%</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={submit} 
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FiSend className="group-hover:translate-x-1 transition-transform" />
            <span>{submitting ? 'Enviando…' : 'Enviar Solicitud'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
