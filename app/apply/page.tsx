'use client'
import { useState } from 'react'
import { db } from '../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function ApplyPage(){
  const [form, setForm] = useState<any>({ type:'broker', company:'', contact:'', email:'', phone:'', whatsapp:'', website:'', agents:0, years:0, markets:'', license:'', address:'', currency:'USD', notes:'' })
  const [submitted,setSubmitted] = useState(false)
  function upd(k:string,v:any){ setForm((s:any)=>({...s,[k]:v})) }
  async function submit(){
    if(!form.email){ alert('Email is required'); return }
    await addDoc(collection(db,'applications'), { ...form, status:'pending', createdAt: serverTimestamp() })
    setSubmitted(true)
  }
  if(submitted) return <div className="p-6 bg-white rounded shadow"><h1 className="text-2xl font-bold">Application submitted</h1><p className="mt-2">We will review your application within 24–48 hours and contact you.</p></div>
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">Apply to VIVENTA</h1>
      <p className="text-gray-600 mt-2">Tell us about your brokerage or agency so we can onboard you smoothly.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">I am a</label>
          <select value={form.type} onChange={e=>upd('type', e.target.value)} className="w-full px-3 py-2 border rounded"><option value="broker">Brokerage</option><option value="agent">Agent</option><option value="developer">Developer</option></select>
        </div>
        <div>
          <label className="text-sm font-medium">Company</label>
          <input value={form.company} onChange={e=>upd('company', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">Contact person</label>
          <input value={form.contact} onChange={e=>upd('contact', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input value={form.email} onChange={e=>upd('email', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input value={form.phone} onChange={e=>upd('phone', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">WhatsApp</label>
          <input value={form.whatsapp} onChange={e=>upd('whatsapp', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">Website</label>
          <input value={form.website} onChange={e=>upd('website', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">Number of agents</label>
          <input type="number" value={form.agents} onChange={e=>upd('agents', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">Years in business</label>
          <input type="number" value={form.years} onChange={e=>upd('years', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">Markets covered</label>
          <input value={form.markets} onChange={e=>upd('markets', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">Primary currency</label>
          <select value={form.currency} onChange={e=>upd('currency', e.target.value)} className="w-full px-3 py-2 border rounded"><option>USD</option><option>DOP</option></select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Office address</label>
          <input value={form.address} onChange={e=>upd('address', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Notes (overview, positioning, strengths)</label>
          <textarea value={form.notes} onChange={e=>upd('notes', e.target.value)} className="w-full px-3 py-2 border rounded" rows={4}/>
        </div>
      </div>
      <div className="mt-6">
        <button onClick={submit} className="px-5 py-2 bg-[#004AAD] text-white rounded">Submit application</button>
      </div>
    </div>
  )
}
