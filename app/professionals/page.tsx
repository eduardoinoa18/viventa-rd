'use client'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebaseClient'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { FiDollarSign, FiUsers, FiTrendingUp, FiMessageSquare } from 'react-icons/fi'

export default function ProfessionalsPage(){
  const [pricing, setPricing] = useState<any>({ plans: [] })
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [message,setMessage]=useState('')

  useEffect(()=>{ (async()=>{
    const snap = await getDoc(doc(db,'settings','pricing'))
    if(snap.exists()) setPricing(snap.data())
  })() },[])

  async function submitLead(){
    if(!email) return alert('Email required')
    await addDoc(collection(db,'marketing_leads'), { name,email,message, createdAt: serverTimestamp(), source:'professionals' })
    setName(''); setEmail(''); setMessage(''); alert('Thanks! We will contact you shortly.')
  }

  return (
    <div>
      <section className="relative bg-[url('/hero-pro.jpg')] bg-cover bg-center rounded-lg overflow-hidden">
        <div className="bg-black/50 p-10 md:p-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white">VIVENTA para Profesionales</h1>
          <p className="mt-4 text-white/90 max-w-2xl">Una plataforma MLS moderna para corredores, agentes y desarrolladores en la República Dominicana. Rápida, colaborativa y lista para escalar.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href="#pricing" className="px-5 py-3 bg-[#00A6A6] text-white rounded inline-flex items-center gap-2"><FiTrendingUp /> Ver precios</a>
            <a href="https://wa.me/18095551234" target="_blank" className="px-5 py-3 bg-white text-[#004AAD] rounded inline-flex items-center gap-2"><FiMessageSquare /> WhatsApp</a>
          </div>
        </div>
      </section>

      <section className="mt-10 grid md:grid-cols-3 gap-6">
        {pricing.plans?.length>0 ? pricing.plans.map((p:any)=> (
          <div key={p.id||p.name} className="bg-white rounded shadow p-6">
            <div className="text-xl font-bold">{p.name}</div>
            <div className="text-3xl font-extrabold mt-2 inline-flex items-center gap-1"><FiDollarSign /> {p.price}</div>
            <ul className="mt-3 text-sm text-gray-700 list-disc list-inside space-y-1">
              {(p.features||[]).map((f:string, i:number)=> <li key={i}>{f}</li>)}
            </ul>
            <a href="/apply" className="mt-4 px-4 py-2 bg-[#004AAD] text-white rounded inline-flex items-center gap-2"><FiTrendingUp /> Solicitar acceso</a>
          </div>
        )): (
          <div className="md:col-span-3 text-gray-500">Próximamente planes y precios.</div>
        )}
      </section>

      <section className="mt-14 grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold">¿Listo para conversar?</h2>
          <p className="text-gray-600 mt-1">Déjanos tus datos y te contactaremos.</p>
          <div className="mt-4 space-y-3">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre" className="w-full px-3 py-2 border rounded"/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded"/>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Mensaje" className="w-full px-3 py-2 border rounded" rows={4}/>
            <button onClick={submitLead} className="px-4 py-2 bg-[#00A6A6] text-white rounded inline-flex items-center gap-2"><FiUsers /> Enviar</button>
          </div>
        </div>
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold">Desarrolladores</h2>
          <p className="text-gray-600 mt-1">¿Quieres destacar tu proyecto en VIVENTA? Envíanos una solicitud y te guiamos.</p>
          <a href="/apply" className="mt-4 px-4 py-2 bg-[#FF6B35] text-white rounded inline-flex items-center gap-2"><FiTrendingUp /> Aplicar ahora</a>
        </div>
      </section>
    </div>
  )
}
