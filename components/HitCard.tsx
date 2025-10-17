'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '../lib/firebaseClient'
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { t } from '../lib/i18n'

export default function HitCard({ hit }: any){
  const [saved, setSaved] = useState(false)
  useEffect(()=> {
    const uid = auth.currentUser?.uid
    if(!uid) return
    const ref = doc(db, 'users', uid, 'favorites', hit.objectID)
  getDoc(ref).then((snap: any)=> setSaved(snap.exists()))
  },[hit])

  async function toggleSave(){
    const user = auth.currentUser
    if(!user) return alert('Please login')
    const ref = doc(db, 'users', user.uid, 'favorites', hit.objectID)
    if(saved){ await deleteDoc(ref); setSaved(false) } else { await setDoc(ref, { listingId: hit.objectID, savedAt: new Date() }); setSaved(true) }
  }

  return (
    <div className="border rounded overflow-hidden">
      <div className="h-48 bg-gray-100">
        <img src={hit.main_photo_url || '/placeholder.png'} className="w-full h-full object-cover"/>
      </div>
      <div className="p-3">
        <div className="font-semibold">{hit.title}</div>
        <div className="text-sm text-gray-600">{hit.city} • {hit.neighborhood}</div>
        <div className="text-lg font-bold mt-2">USD {hit.price_usd}</div>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={toggleSave} className="px-3 py-1 border rounded text-sm">{saved? t('saved') : t('save')}</button>
          <a className="px-3 py-1 bg-[#00A6A6] text-white rounded text-sm" href={`/listing/${hit.objectID}`}>{t('contact_agent')}</a>
        </div>
      </div>
    </div>
  )
}
