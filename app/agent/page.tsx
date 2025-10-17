'use client'
import { useEffect, useState } from 'react'
import { auth, firestore, storage } from '../../lib/firebaseClient'
import { useRequireRole } from '../../lib/useRequireRole'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

export default function AgentPage(){
  const guard = useRequireRole(['agent','admin','brokerage_admin','master_admin'])
  if (guard.loading) return <div>Loading…</div>
  if (!guard.ok) return null
  const [user, setUser] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [imageFile, setImageFile] = useState<File|null>(null)

  useEffect(()=> {
    const unsub = auth.onAuthStateChanged((u: any)=> setUser(u))
    return ()=> unsub()
  },[])

  async function login(){
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }
  async function addListing(){
    if(!user) return alert('Please login')
    let imageUrl = ''
    if(imageFile){
      const fileRef = ref(storage, `listing_images/${Date.now()}_${imageFile.name}`)
      const snap = await uploadBytesResumable(fileRef, imageFile)
      imageUrl = await getDownloadURL(snap.ref)
    }
    const doc = await addDoc(collection(firestore,'listings'), {
      title, price: parseFloat(price), images: imageUrl ? [imageUrl] : [],
      createdBy: user.uid, createdAt: serverTimestamp(), status: 'active'
    })
    alert('Listing created: '+doc.id)
    setTitle(''); setPrice(''); setImageFile(null)
    loadListings()
  }
  async function loadListings(){
    if(!user) return
    const q = query(collection(firestore,'listings'), where('createdBy','==',user.uid))
    const snap = await getDocs(q)
  setListings(snap.docs.map((d: any)=> ({id:d.id, ...d.data()})))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Agent Dashboard</h1>
      {!user ? (
        <div className="mt-4">
          <p>Sign in to manage your listings</p>
          <button onClick={login} className="mt-3 px-4 py-2 bg-[#00A6A6] text-white rounded">Sign in with Google</button>
        </div>
      ) : (
        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold">Nueva propiedad</h3>
            <input className="mt-2 w-full px-3 py-2 border rounded" placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)}/>
            <input className="mt-2 w-full px-3 py-2 border rounded" placeholder="Precio USD" value={price} onChange={e=>setPrice(e.target.value)}/>
            <input className="mt-2" type="file" onChange={(e: React.ChangeEvent<HTMLInputElement>)=> setImageFile(e.target.files ? e.target.files[0] : null)}/>
            <button onClick={addListing} className="mt-3 px-3 py-2 bg-[#FF6B35] text-white rounded">Crear</button>
          </div>

          <div>
            <h3 className="font-semibold">Tus propiedades</h3>
            <div className="mt-3 space-y-3">
              <button onClick={loadListings} className="px-3 py-2 border rounded">Cargar mis listados</button>
              {listings.map(l=>(
                <div key={l.id} className="p-3 bg-white rounded shadow">
                  <div className="font-medium">{l.title}</div>
                  <div className="text-sm text-gray-600">USD {l.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
