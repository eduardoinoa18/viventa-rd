// app/api/social/like/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ ok: false, error: 'Post ID required' }, { status: 400 })
    }

    // TODO: Check if user already liked
    // For now, just increment
    await updateDoc(doc(db, 'social_posts', postId), {
      likes: increment(1)
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json({ ok: false, error: 'Error al dar like' }, { status: 500 })
  }
}
