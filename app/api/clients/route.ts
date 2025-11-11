import { NextResponse } from "next/server"
import { getClientsByAgent, createClient, updateClient, deleteClient } from "@/lib/firestoreService"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    const clients = await getClientsByAgent(agentId)
    return NextResponse.json({ clients })
  } catch (error: unknown) {
    console.error('Error fetching clients:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch clients'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, ...data } = body as { action?: string; id?: string; [key: string]: unknown }

    if (action === 'create') {
      const name = String((data as any).name || '')
      const email = String((data as any).email || '')
      const agentId = String((data as any).agentId || '')
      const phone = (data as any).phone as string | undefined
      const status = ((data as any).status as any) || 'active'
      const notes = (data as any).notes as string | undefined

      if (!name || !email || !agentId) {
        return NextResponse.json({ error: 'name, email, and agentId are required' }, { status: 400 })
      }

      const createPayload = { name, email, agentId, phone, status, notes }
      const id = await createClient(createPayload)
      return NextResponse.json({ success: true, message: "Client created", id })
    } else if (action === 'update') {
      if (!data.id) return NextResponse.json({ error: 'id required for update' }, { status: 400 })
      await updateClient(data.id, data)
      return NextResponse.json({ success: true, message: "Client updated" })
    } else if (action === 'delete') {
      if (!data.id) return NextResponse.json({ error: 'id required for delete' }, { status: 400 })
      await deleteClient(data.id)
      return NextResponse.json({ success: true, message: "Client deleted" })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Error managing client:', error)
    const message = error instanceof Error ? error.message : 'Failed to manage client'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
