import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../lib/firebaseClient'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

export default function ApplicationsQueue(){
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [items,setItems] = useState<any[]>([])
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,'applications'), (snap:any)=>{
      setItems(snap.docs.map((d:any)=>({id:d.id, ...d.data()})))
    })
    return ()=>unsub()
  },[])

  async function setStatus(id:string, status:'approved'|'rejected'|'more_info'){
    try {
      if (status === 'approved') {
        const fn = httpsCallable(functions, 'processApplication')
        await fn({ appId: id, action: 'approve' })
      } else if (status === 'more_info') {
        const fn = httpsCallable(functions, 'processApplication')
        await fn({ appId: id, action: 'more_info' })
      } else {
        const fn = httpsCallable(functions, 'processApplication')
        await fn({ appId: id, action: 'reject' })
      }
    } catch (e:any) {
      alert(e.message || 'Failed to process')
    }
  }

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={()=>setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Applications</h2>
      <div className="space-y-3">
        {items.map(app => (
          <div key={app.id} className="bg-white rounded shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{app.company} • {app.type}</div>
                <div className="text-sm text-gray-600">{app.contact} • {app.email} • Agents: {app.agents}</div>
              </div>
              <div className="space-x-2">
                <button onClick={()=>setStatus(app.id,'approved')} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                <button onClick={()=>setStatus(app.id,'more_info')} className="px-3 py-1 bg-yellow-600 text-white rounded">More info</button>
                <button onClick={()=>setStatus(app.id,'rejected')} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
              </div>
            </div>
            <div className="mt-2 text-gray-700 text-sm">{app.notes}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
