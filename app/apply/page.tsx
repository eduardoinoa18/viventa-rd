'use client'
import { useState } from 'react'
import { db } from '../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { FiSend, FiUsers, FiBriefcase, FiDollarSign, FiGlobe, FiPhone, FiClipboard } from 'react-icons/fi'

export default function ApplyPage(){
  const [form, setForm] = useState<any>({
    type:'broker',
    // Common
    company:'', contact:'', email:'', phone:'', whatsapp:'', website:'', address:'', markets:'', currency:'USD', notes:'',
    // Agent fields
    agent: { license:'', licenseJurisdiction:'', years:0, volume12m:0, transactions12m:0, brokerage:'', languages:'', specialties:'', social:{ instagram:'', linkedin:'', website:'' } },
    // Broker fields
  broker: { agents:0, years:0, annualVolume12m:0, annualVolume24m:0, avgPrice:0, activeListings:0, offices:1, crm:'', complianceContact:'', insurance:false },
    // Developer fields
    developer: { projects:0, pipeline:'', website:'' }
  })
  const [submitted,setSubmitted] = useState(false)
  function upd(k:string,v:any){ setForm((s:any)=>({...s,[k]:v})) }
  function updn(ns:'agent'|'broker'|'developer', k:string, v:any){ setForm((s:any)=>({...s, [ns]: { ...(s as any)[ns], [k]: v } })) }
  function updns(ns:'agent'|'broker'|'developer', path: string, v:any){
    // supports nested e.g. social.instagram
    const [k1,k2] = path.split('.')
    setForm((s:any)=>({
      ...s,
      [ns]: { ...(s as any)[ns], [k1]: k2 ? { ...((s as any)[ns]?.[k1]||{}), [k2]: v } : v }
    }))
  }
  async function submit(){
    if(!form.email){ alert('Email is required'); return }
    await addDoc(collection(db,'applications'), { ...form, status:'pending', createdAt: serverTimestamp() })
    setSubmitted(true)
  }
  if(submitted) return <div className="p-6 bg-white rounded shadow"><h1 className="text-2xl font-bold">Application submitted</h1><p className="mt-2">We will review your application within 24–48 hours and contact you.</p></div>
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold">Apply to VIVENTA</h1>
      <p className="text-gray-600 mt-2">Tell us about your brokerage or agency so we can onboard you smoothly.</p>

      <div className="mt-6 grid md:grid-cols-2 gap-4 bg-white rounded shadow p-4">
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
          <label className="text-sm font-medium inline-flex items-center gap-2"><FiPhone /> Phone</label>
          <input value={form.phone} onChange={e=>upd('phone', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">WhatsApp</label>
          <input value={form.whatsapp} onChange={e=>upd('whatsapp', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium inline-flex items-center gap-2"><FiGlobe /> Website</label>
          <input value={form.website} onChange={e=>upd('website', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
        <div>
          <label className="text-sm font-medium">Markets covered</label>
          <input value={form.markets} onChange={e=>upd('markets', e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="e.g. Santo Domingo, Punta Cana"/>
        </div>
        <div>
          <label className="text-sm font-medium">Primary currency</label>
          <select value={form.currency} onChange={e=>upd('currency', e.target.value)} className="w-full px-3 py-2 border rounded"><option>USD</option><option>DOP</option></select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Office address</label>
          <input value={form.address} onChange={e=>upd('address', e.target.value)} className="w-full px-3 py-2 border rounded"/>
        </div>
      </div>

      {/* Agent Section */}
      {form.type === 'agent' && (
        <div className="mt-8 bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 inline-flex items-center gap-2"><FiBriefcase /> Agent details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">License number</label>
              <input value={form.agent.license} onChange={e=>updn('agent','license', e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">License jurisdiction</label>
              <input value={form.agent.licenseJurisdiction} onChange={e=>updn('agent','licenseJurisdiction', e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">Years of experience</label>
              <input type="number" value={form.agent.years} onChange={e=>updn('agent','years', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium inline-flex items-center gap-2"><FiDollarSign /> Closed volume (last 12m)</label>
              <input type="number" value={form.agent.volume12m} onChange={e=>updn('agent','volume12m', +e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Amount in primary currency"/>
            </div>
            <div>
              <label className="text-sm font-medium">Transactions (last 12m)</label>
              <input type="number" value={form.agent.transactions12m} onChange={e=>updn('agent','transactions12m', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">Current brokerage</label>
              <input value={form.agent.brokerage} onChange={e=>updn('agent','brokerage', e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Languages</label>
              <input value={form.agent.languages} onChange={e=>updn('agent','languages', e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Spanish, English, French"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Specialties (luxury, rentals, commercial, pre-construction, etc.)</label>
              <input value={form.agent.specialties} onChange={e=>updn('agent','specialties', e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">Instagram</label>
              <input value={form.agent.social.instagram} onChange={e=>updns('agent','social.instagram', e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">LinkedIn</label>
              <input value={form.agent.social.linkedin} onChange={e=>updns('agent','social.linkedin', e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Personal website</label>
              <input value={form.agent.social.website} onChange={e=>updns('agent','social.website', e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
          </div>
        </div>
      )}

      {/* Broker Section */}
      {form.type === 'broker' && (
        <div className="mt-8 bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 inline-flex items-center gap-2"><FiUsers /> Brokerage details</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Number of agents</label>
              <input type="number" value={form.broker.agents} onChange={e=>updn('broker','agents', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">Years in business</label>
              <input type="number" value={form.broker.years} onChange={e=>updn('broker','years', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium inline-flex items-center gap-2"><FiDollarSign /> Annual sales volume (last 12m)</label>
              <input type="number" value={form.broker.annualVolume12m} onChange={e=>updn('broker','annualVolume12m', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium inline-flex items-center gap-2"><FiDollarSign /> Annual sales volume (last 24m)</label>
              <input type="number" value={form.broker.annualVolume24m} onChange={e=>updn('broker','annualVolume24m', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">Average price point</label>
              <input type="number" value={form.broker.avgPrice} onChange={e=>updn('broker','avgPrice', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">Active listings</label>
              <input type="number" value={form.broker.activeListings} onChange={e=>updn('broker','activeListings', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">Number of offices</label>
              <input type="number" value={form.broker.offices} onChange={e=>updn('broker','offices', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">CRM used</label>
              <input value={form.broker.crm} onChange={e=>updn('broker','crm', e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">Compliance contact (name/email)</label>
              <input value={form.broker.complianceContact} onChange={e=>updn('broker','complianceContact', e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div className="md:col-span-3 flex items-center gap-2">
              <input id="ins" type="checkbox" checked={!!form.broker.insurance} onChange={e=>updn('broker','insurance', e.target.checked)} />
              <label htmlFor="ins" className="text-sm">We maintain E&O/professional liability insurance</label>
            </div>
          </div>
        </div>
      )}

      {/* Developer Section */}
      {form.type === 'developer' && (
        <div className="mt-8 bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 inline-flex items-center gap-2"><FiClipboard /> Developer details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Active projects</label>
              <input type="number" value={form.developer.projects} onChange={e=>updn('developer','projects', +e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <input value={form.developer.website} onChange={e=>updn('developer','website', e.target.value)} className="w-full px-3 py-2 border rounded"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Pipeline overview</label>
              <textarea value={form.developer.pipeline} onChange={e=>updn('developer','pipeline', e.target.value)} className="w-full px-3 py-2 border rounded" rows={4}/>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <button onClick={submit} className="px-5 py-2 bg-[#004AAD] text-white rounded inline-flex items-center gap-2"><FiSend /> Submit application</button>
      </div>
    </div>
  )
}
