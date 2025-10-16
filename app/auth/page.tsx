'use client'
import { useEffect, useState } from 'react'
import { auth } from '../../lib/firebaseClient'
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
export default function AuthPage(){
  const [user,setUser] = useState<any>(null)
  useEffect(()=> auth.onAuthStateChanged((u: any)=> setUser(u)),[])
  async function loginGoogle(){
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }
  async function logout(){ await signOut(auth) }
  return (
    <div>
      <h1 className="text-2xl font-bold">Login / Registro</h1>
      {!user ? (
        <div className="mt-4">
          <button onClick={loginGoogle} className="px-4 py-2 bg-[#00A6A6] text-white rounded">Sign in with Google</button>
        </div>
      ) : (
        <div className="mt-4 p-4 bg-white rounded shadow">
          <div className="font-semibold">{user.displayName}</div>
          <div className="text-sm">{user.email}</div>
          <button onClick={logout} className="mt-3 px-3 py-2 border rounded">Sign out</button>
        </div>
      )}
    </div>
  )
}
