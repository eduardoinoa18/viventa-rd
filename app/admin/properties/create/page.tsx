// app/admin/properties/create/page.tsx
'use client'
import { useState } from 'react'
import ProtectedClient from '../../../auth/ProtectedClient'
import AdminSidebar from '../../../../components/AdminSidebar'
import AdminTopbar from '../../../../components/AdminTopbar'
import { createProperty, type Property } from '../../../../lib/firestoreService'

export default function CreatePropertyPage() {
  const [form, setForm] = useState<Partial<Property>>({
    title: '',
    description: '',
    price: 0,
    location: '',
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    propertyType: 'apartment',
    listingType: 'sale',
    images: [],
    agentId: '',
    agentName: '',
    status: 'pending',
    featured: false,
  })
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function addImage() {
    if (!imageUrl.trim()) return
    setForm({ ...form, images: [...(form.images || []), imageUrl.trim()] })
    setImageUrl('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        price: Number(form.price || 0),
        location: form.location,
        bedrooms: Number(form.bedrooms || 0),
        bathrooms: Number(form.bathrooms || 0),
        area: Number(form.area || 0),
        propertyType: form.propertyType,
        listingType: form.listingType,
        images: form.images || [],
        agentId: form.agentId,
        agentName: form.agentName,
        status: form.status,
        featured: Boolean(form.featured),
      }
      await createProperty(payload)
      setMessage('Listing created successfully.')
      setForm({
        title: '', description: '', price: 0, location: '', bedrooms: 1, bathrooms: 1, area: 0,
        propertyType: 'apartment', listingType: 'sale', images: [], agentId: '', agentName: '', status: 'pending', featured: false,
      })
    } catch (e) {
      setMessage('Failed to create listing.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <h1 className="text-3xl font-bold text-[#0B2545] mb-6">Create Listing</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="px-3 py-2 border rounded" placeholder="Title" value={form.title as any} onChange={e=>setForm({...form, title: e.target.value})} required />
              <input className="px-3 py-2 border rounded" placeholder="Location (City, Area)" value={form.location as any} onChange={e=>setForm({...form, location: e.target.value})} required />
              <input className="px-3 py-2 border rounded" type="number" placeholder="Price (USD)" value={form.price as any} onChange={e=>setForm({...form, price: Number(e.target.value)})} required />
              <div className="grid grid-cols-2 gap-2">
                <input className="px-3 py-2 border rounded" type="number" placeholder="Bedrooms" value={form.bedrooms as any} onChange={e=>setForm({...form, bedrooms: Number(e.target.value)})} />
                <input className="px-3 py-2 border rounded" type="number" placeholder="Bathrooms" value={form.bathrooms as any} onChange={e=>setForm({...form, bathrooms: Number(e.target.value)})} />
              </div>
              <input className="px-3 py-2 border rounded" type="number" placeholder="Area (m²)" value={form.area as any} onChange={e=>setForm({...form, area: Number(e.target.value)})} />
              <select className="px-3 py-2 border rounded" value={form.propertyType as any} onChange={e=>setForm({...form, propertyType: e.target.value as any})}>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
              <select className="px-3 py-2 border rounded" value={form.listingType as any} onChange={e=>setForm({...form, listingType: e.target.value as any})}>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
              <input className="px-3 py-2 border rounded" placeholder="Agent ID" value={form.agentId as any} onChange={e=>setForm({...form, agentId: e.target.value})} />
              <input className="px-3 py-2 border rounded" placeholder="Agent Name" value={form.agentName as any} onChange={e=>setForm({...form, agentName: e.target.value})} />
              <div className="md:col-span-2">
                <textarea className="w-full px-3 py-2 border rounded" rows={4} placeholder="Description" value={form.description as any} onChange={e=>setForm({...form, description: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 border rounded" placeholder="Image URL" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
                  <button type="button" onClick={addImage} className="px-4 py-2 border rounded">Add Image</button>
                </div>
                {form.images && form.images.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {form.images.map((u, i) => (
                      <img key={i} src={u} alt="img" className="w-24 h-24 object-cover rounded border" />
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex gap-2 mt-2">
                <button disabled={saving} className="px-5 py-2 bg-[#00A676] text-white rounded disabled:opacity-50">{saving ? 'Saving…' : 'Create Listing'}</button>
                {message && <div className="px-3 py-2 text-sm text-gray-600">{message}</div>}
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
