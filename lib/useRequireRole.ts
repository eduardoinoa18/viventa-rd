"use client"
import { useEffect, useState } from 'react'
import { auth, db } from './firebaseClient'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export type Role = 'client' | 'agent' | 'admin' | 'brokerage_admin' | 'master_admin'

interface UserData {
  role: Role;
  [key: string]: unknown;
}

export function useRequireRole(allowed: Role[] = ['agent','admin','brokerage_admin','master_admin']) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ok, setOk] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const unsub = auth?.onAuthStateChanged(async (u: { uid: string; getIdTokenResult: () => Promise<{ claims: Record<string, unknown> }> } | null) => {
      if (!u) {
        setOk(false)
        setLoading(false)
        router.replace('/login')
        return
      }
      const ref = doc(db, 'users', u.uid)
      const snap = await getDoc(ref)
      const userData = snap.exists() ? snap.data() as UserData : { role: 'client' as Role }
      const role = userData.role
      const allowedOk = allowed.includes(role)
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
