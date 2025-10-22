import { NextResponse } from "next/server"
import {
  getConversationsForUser,
  getMessagesByConversation,
  sendMessage,
  markMessageAsRead
} from "@/lib/firestoreService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const conversationId = searchParams.get('conversationId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    if (conversationId) {
      const messages = await getMessagesByConversation(conversationId)
      return NextResponse.json({ messages })
    } else {
      const conversations = await getConversationsForUser(userId)
      return NextResponse.json({ conversations })
    }
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, ...data } = body

    if (action === 'send') {
      const id = await sendMessage(data)
      return NextResponse.json({ success: true, message: "Message sent", id })
    } else if (action === 'markRead') {
      await markMessageAsRead(data.id)
      return NextResponse.json({ success: true, message: "Message marked as read" })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error managing message:', error)
    return NextResponse.json({ error: error.message || 'Failed to manage message' }, { status: 500 })
  }
}
