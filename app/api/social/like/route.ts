// app/api/social/like/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore'

function getCookie(req: NextRequest, name: string): string | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json()
    const uid = getCookie(req, 'viventa_uid')
    if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    if (!postId) return NextResponse.json({ ok: false, error: 'postId required' }, { status: 400 })

    // Toggle like (ensure one per user per post)
    const likesCol = collection(db, 'social_likes')
    const q = query(likesCol, where('postId', '==', postId), where('userId', '==', uid))
    const snap = await getDocs(q)
    const postRef = doc(db, 'social_posts', postId)

    if (snap.empty) {
      await addDoc(likesCol, { postId, userId: uid, createdAt: serverTimestamp() })
      await updateDoc(postRef, { likesCount: increment(1) })
      // Gamification: content_liked
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/gamification/stats`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, action: 'content_liked' })
        })
      } catch {}
      return NextResponse.json({ ok: true, liked: true })
    } else {
      // Unlike
      await Promise.all(snap.docs.map((d: any) => deleteDoc(doc(db, 'social_likes', d.id))))
      await updateDoc(postRef, { likesCount: increment(-1) })
      return NextResponse.json({ ok: true, liked: false })
    }
  } catch (e) {
    console.error('social like POST error', e)
    return NextResponse.json({ ok: false, error: 'Failed to like' }, { status: 500 })
  }
}
