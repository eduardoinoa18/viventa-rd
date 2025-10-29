// app/api/messages/conversations/route.ts
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'

function getCookie(req: NextRequest, name: string): string | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export async function GET(req: NextRequest) {
  try {
    const uid = getCookie(req, 'viventa_uid')
    if (!uid) return NextResponse.json({ ok: false, conversations: [] }, { status: 200 })

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      orderBy('updatedAt', 'desc')
    )
    const snap = await getDocs(q)
    const conversations = snap.docs.map((d:any)=> ({ id: d.id, ...d.data() }))
    return NextResponse.json({ ok: true, conversations })
  } catch (e) {
    console.error('conversations GET error', e)
    return NextResponse.json({ ok: true, conversations: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = getCookie(req, 'viventa_uid')
    if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    const { otherUserId, title } = await req.json()
    if (!otherUserId) return NextResponse.json({ ok: false, error: 'Missing otherUserId' }, { status: 400 })

    // Create a conversation (dedup could be added later)
    const docRef = await addDoc(collection(db, 'conversations'), {
      participants: [uid, otherUserId],
      title: title || 'Conversación',
      lastMessage: '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    })
    return NextResponse.json({ ok: true, id: docRef.id })
  } catch (e) {
    console.error('conversations POST error', e)
    return NextResponse.json({ ok: false, error: 'Failed to create conversation' }, { status: 500 })
  }
}
