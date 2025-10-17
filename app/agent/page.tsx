'use client'
import { useEffect, useState } from 'react'
import { auth, db, storage } from '../../lib/firebaseClient'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

export default function AgentDashboard(){
  const [user,setUser]=useState<any>(null)
  const [title,setTitle]=useState(''); const [price,setPrice]=useState(''); const [img,setImg]=useState<File|null>(null)
  const [listings,setListings]=useState<any[]>([])

  useEffect(()=> auth.onAuthStateChanged((u: any)=> setUser(u)),[])

  async function login(){ const provider=new GoogleAuthProvider(); await signInWithPopup(auth,provider) }
  async function addListing(){
    if(!user) return alert('Login required')
    let url=''
    if(img){
      const fileRef = ref(storage, `listing_images/${Date.now()}_${img.name}`)
      const snap = await uploadBytesResumable(fileRef, img)
      url = await getDownloadURL(snap.ref)
    }
    await addDoc(collection(db,'listings'), { title, price_usd: parseFloat(price), images: url? [url]: [], createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), status:'active' })
    setTitle(''); setPrice(''); setImg(null); loadMyListings()
  }
  async function loadMyListings(){
    if(!user) return
    const q = query(collection(db,'listings'), where('createdBy','==', user.uid))
    const snap = await getDocs(q)
  setListings(snap.docs.map((d: any)=> ({id:d.id, ...d.data()})))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Agent Dashboard</h1>
      {!user ? (
        <div className="mt-4">
          <button onClick={login} className="px-4 py-2 bg-[#00A6A6] text-white rounded">Sign in with Google</button>
        </div>
      ) : (
        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold">New listing</h3>
            <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full px-3 py-2 border rounded"/>
            <input placeholder="Price USD" value={price} onChange={e=>setPrice(e.target.value)} className="mt-2 w-full px-3 py-2 border rounded"/>
            <input type="file" className="mt-2" onChange={e=> setImg(e.target.files? e.target.files[0] : null)} />
            <button onClick={addListing} className="mt-3 px-3 py-2 bg-[#FF6B35] text-white rounded">Create</button>
          </div>
          <div>
            <h3 className="font-semibold">My listings</h3>
            <div className="mt-3 space-y-3">
              <button onClick={loadMyListings} className="px-3 py-2 border rounded">Load</button>
              {listings.map(l=>(
                <div key={l.id} className="p-3 bg-white rounded shadow">
                  <div className="font-medium">{l.title}</div>
                  <div className="text-sm text-gray-600">USD {l.price_usd}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
