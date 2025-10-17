'use client'
import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { doc, getDoc } from 'firebase/firestore'
import { useParams } from 'next/navigation'

export default function ListingDetail(){
  const params = useParams()
  const id = params?.id
  const [listing,setListing] = useState<any>(null)
  useEffect(()=> {
    if(!id) return
    getDoc(doc(db,'listings',id as string)).then((snap: any)=> { if(snap.exists()) setListing(snap.data()) })
  },[id])
  if(!listing) return <div>Loading...</div>
  return (
    <div>
      <h1 className="text-2xl font-bold">{listing.title}</h1>
      <div className="mt-4 grid md:grid-cols-2 gap-6">
        <div>
          <div className="h-72 bg-gray-100 rounded mb-3">
            {listing.images && listing.images[0] && <img src={listing.images[0]} className="w-full h-full object-cover rounded" />}
          </div>
        </div>
        <div>
          <div className="font-semibold">USD {listing.price_usd}</div>
          <div className="text-gray-600 mt-2">{listing.description || 'Sin descripción'}</div>
        </div>
      </div>
    </div>
  )
}
