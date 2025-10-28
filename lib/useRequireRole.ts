"use client"
import { useEffect, useState } from 'react'
import { auth, db } from './firebaseClient'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import AdminCodeModal from '../components/AdminCodeModal'

export type Role = 'client' | 'agent' | 'admin' | 'brokerage_admin' | 'master_admin'

export function useRequireRole(allowed: Role[] = ['agent','admin','brokerage_admin','master_admin']) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ok, setOk] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const unsub = auth?.onAuthStateChanged(async (u: any) => {
      if (!u) {
        setOk(false)
        setLoading(false)
        router.replace('/login')
        return
      }
      const ref = doc(db, 'users', u.uid)
      const snap = await getDoc(ref)
      const role = (snap.exists() ? (snap.data() as any).role : 'client') as Role
      const allowedOk = allowed.includes(role)
      // Check custom claims for admin_verified_until
      const claims = (await auth.currentUser?.getIdTokenResult())?.claims || {}
      if ((role === 'admin' || role === 'master_admin') && allowedOk) {
        const now = Date.now()
        const verifiedUntil = claims.admin_verified_until as number | undefined
        if (!verifiedUntil || verifiedUntil < now) {
          setShowModal(true)
          setOk(false)
          setLoading(false)
          return
        }
      }
      setOk(allowedOk)
      setLoading(false)
      if (!allowedOk) router.replace('/')
    })
    return () => unsub && unsub()
  }, [router, allowed])

  return { loading, ok, showModal, setShowModal }
}
