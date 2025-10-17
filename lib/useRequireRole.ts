"use client"
import { useEffect, useState } from 'react'
import { auth, firestore } from './firebaseClient'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export type Role = 'client' | 'agent' | 'admin' | 'brokerage_admin' | 'master_admin'

export function useRequireRole(allowed: Role[] = ['agent','admin','brokerage_admin','master_admin']) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const unsub = auth?.onAuthStateChanged(async (u: any) => {
      if (!u) {
        setOk(false)
        setLoading(false)
        router.replace('/auth')
        return
      }
      const ref = doc(firestore, 'users', u.uid)
      const snap = await getDoc(ref)
      const role = (snap.exists() ? (snap.data() as any).role : 'client') as Role
      const allowedOk = allowed.includes(role)
      setOk(allowedOk)
      setLoading(false)
      if (!allowedOk) router.replace('/')
    })
    return () => unsub && unsub()
  }, [router, allowed])

  return { loading, ok }
}
