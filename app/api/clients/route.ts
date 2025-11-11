import { NextResponse } from "next/server"
import {

export const dynamic = 'force-dynamic'
  getClientsByAgent,
  createClient,
  updateClient,
  deleteClient
} from "@/lib/firestoreService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    const clients = await getClientsByAgent(agentId)
    return NextResponse.json({ clients })
  } catch (error: any) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, ...data } = body

    if (action === 'create') {
      const id = await createClient(data)
      return NextResponse.json({ success: true, message: "Client created", id })
    } else if (action === 'update') {
      await updateClient(data.id, data)
      return NextResponse.json({ success: true, message: "Client updated" })
    } else if (action === 'delete') {
      await deleteClient(data.id)
      return NextResponse.json({ success: true, message: "Client deleted" })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error managing client:', error)
    return NextResponse.json({ error: error.message || 'Failed to manage client' }, { status: 500 })
  }
}
