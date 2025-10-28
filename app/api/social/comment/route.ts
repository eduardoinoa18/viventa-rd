// app/api/social/comment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore'

function getCookie(req: NextRequest, name: string): string | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export async function POST(req: NextRequest) {
  try {
    const { postId, text } = await req.json()
    const uid = getCookie(req, 'viventa_uid')
    const role = getCookie(req, 'viventa_role')
    const name = getCookie(req, 'viventa_name')

    if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    if (!postId || !text) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

    // Privacy: anonymize non-professional users
    const displayName = ['agent','broker','admin','master_admin'].includes(role || '')
      ? (name || 'Agente')
      : 'Usuario'

    await addDoc(collection(db, 'social_comments'), {
      postId,
      userId: uid,
      role: role || 'user',
      displayName,
      text: String(text).slice(0, 500),
      createdAt: serverTimestamp()
    })

    await updateDoc(doc(db, 'social_posts', postId), { commentsCount: increment(1) })

    // Gamification: content_commented (for the commenter)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/gamification/stats`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, action: 'content_commented' })
      })
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('social comment POST error', e)
    return NextResponse.json({ ok: false, error: 'Failed to comment' }, { status: 500 })
  }
}
