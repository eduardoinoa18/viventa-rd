'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    agents:0, annualVolume12m:0, offices:1, crm:'', insurance:false
  })
  const [submitted,setSubmitted] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [bizDocFile, setBizDocFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  async function submit(){
    if(!form.email || !form.contact){ alert('Completa los campos requeridos'); return }
    try {
      setSubmitting(true)
      let resumeUrl: string | undefined
      let documentUrl: string | undefined

      if (form.type === 'agent' && resumeFile) {
        const v = validateFile(resumeFile)
        if (!v.valid) { alert(v.error); setSubmitting(false); return }
        const path = generateApplicationFilePath('agent', resumeFile.name)
        resumeUrl = await uploadFile(resumeFile, path, (p) => setUploadProgress(p))
      }

      if (form.type === 'broker' && bizDocFile) {
        const v = validateFile(bizDocFile)
        if (!v.valid) { alert(v.error); setSubmitting(false); return }
        const path = generateApplicationFilePath('broker', bizDocFile.name)
        documentUrl = await uploadFile(bizDocFile, path, (p) => setUploadProgress(p))
      }

      await addDoc(collection(db,'applications'), {
        ...form,
        status:'pending',
        createdAt: serverTimestamp(),
        resumeUrl,
        documentUrl,
      })
      setSubmitted(true)
    } catch (e: any) {
      console.error('Application submit failed', e)
      alert(e?.message || 'No se pudo enviar la solicitud. Intenta de nuevo.')
    } finally {
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
              <label className="block text-sm font-semibold mb-2">{form.type==='agent'?'Agencia':'Empresa'}</label>
              <input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Dirección</label>
              <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/>
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
                <div><label className="block text-sm font-semibold mb-2">Licencia</label><input value={form.license} onChange={e=>setForm({...form,license:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div><label className="block text-sm font-semibold mb-2">Años experiencia</label><input type="number" value={form.years} onChange={e=>setForm({...form,years:+e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div><label className="block text-sm font-semibold mb-2">Volumen 12m</label><input type="number" value={form.volume12m} onChange={e=>setForm({...form,volume12m:+e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div><label className="block text-sm font-semibold mb-2">Inmobiliaria actual</label><input value={form.brokerage} onChange={e=>setForm({...form,brokerage:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-2">Idiomas</label><input value={form.languages} onChange={e=>setForm({...form,languages:e.target.value})} className="w-full px-4 py-3 border rounded-lg" placeholder="Español, Inglés"/></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-2">Especialidades</label><input value={form.specialties} onChange={e=>setForm({...form,specialties:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Currículum (PDF/DOC/DOCX, máx 10MB)</label>
                  <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e)=> setResumeFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 border rounded-lg" />
                  {uploadProgress > 0 && submitting && (
                    <div className="text-xs text-gray-500 mt-1">Subiendo: {Math.round(uploadProgress)}%</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {form.type==='broker' && (
            <div className="mb-6 border-t pt-6">
              <h3 className="font-bold text-lg mb-4">Información del Bróker</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-semibold mb-2">N° agentes</label><input type="number" value={form.agents} onChange={e=>setForm({...form,agents:+e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div><label className="block text-sm font-semibold mb-2">Volumen anual</label><input type="number" value={form.annualVolume12m} onChange={e=>setForm({...form,annualVolume12m:+e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div><label className="block text-sm font-semibold mb-2">N° oficinas</label><input type="number" value={form.offices} onChange={e=>setForm({...form,offices:+e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-2">CRM</label><input value={form.crm} onChange={e=>setForm({...form,crm:e.target.value})} className="w-full px-4 py-3 border rounded-lg"/></div>
                <div className="md:col-span-3 flex items-center gap-2 p-3 bg-blue-50 rounded-lg"><input type="checkbox" checked={form.insurance} onChange={e=>setForm({...form,insurance:e.target.checked})} className="w-5 h-5"/><label className="text-sm font-medium">Tenemos seguro E&O</label></div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold mb-2">Documento de negocio (PDF/DOC/DOCX, máx 10MB)</label>
                  <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e)=> setBizDocFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 border rounded-lg" />
                  {uploadProgress > 0 && submitting && (
                    <div className="text-xs text-gray-500 mt-1">Subiendo: {Math.round(uploadProgress)}%</div>
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
