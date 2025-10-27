'use client'
import { useState } from 'react'
import { db } from '../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { FiSend, FiUsers, FiBriefcase } from 'react-icons/fi'

export default function ApplyPage(){
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    type:'agent',
    contact:'', email:'', phone:'', company:'', address:'', markets:'', currency:'USD',
    license:'', years:0, volume12m:0, brokerage:'', languages:'', specialties:'',
    agents:0, annualVolume12m:0, offices:1, crm:'', insurance:false
  })
  const [submitted,setSubmitted] = useState(false)

  async function submit(){
    if(!form.email || !form.contact){ alert('Completa los campos requeridos'); return }
    await addDoc(collection(db,'applications'), { ...form, status:'pending', createdAt: serverTimestamp() })
    setSubmitted(true)
  }

  if(submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Solicitud Enviada!</h1>
          <p className="text-gray-600 mb-6">Te contactaremos en 24–48 horas.</p>
          <a href="/" className="inline-block px-6 py-3 bg-[#004AAD] text-white rounded-lg font-semibold">Volver</a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
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
              </div>
            </div>
          )}

          <button onClick={submit} className="w-full px-6 py-4 bg-[#00A6A6] text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#008f8f]">
            <FiSend /> Enviar Solicitud
          </button>
        </div>
      </div>
    </div>
  )
}
