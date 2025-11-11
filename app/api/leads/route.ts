import { NextResponse } from "next/server"
import { getLeadsByAgent, createLead, updateLead, deleteLead } from "@/lib/firestoreService"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    const leads = await getLeadsByAgent(agentId)
    return NextResponse.json({ leads })
  } catch (error: unknown) {
    console.error('Error fetching leads:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch leads'
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
      const phone = String((data as any).phone || '')
      const agentId = String((data as any).agentId || '')
      const message = (data as any).message as string | undefined
      const propertyId = (data as any).propertyId as string | undefined
      const propertyTitle = (data as any).propertyTitle as string | undefined
      const status = ((data as any).status as any) || 'new'
      const source = ((data as any).source as any) || 'website'

      if (!name || !email || !phone || !agentId) {
        return NextResponse.json({ error: 'name, email, phone, and agentId are required' }, { status: 400 })
      }

      const createPayload = {
        name,
        email,
        phone,
        agentId,
        status,
        source,
        message,
        propertyId,
        propertyTitle
      }

      const id = await createLead(createPayload)
      return NextResponse.json({ success: true, message: "Lead created", id })
    } else if (action === 'update') {
      if (!data.id) return NextResponse.json({ error: 'id required for update' }, { status: 400 })
      await updateLead(data.id, data)
      return NextResponse.json({ success: true, message: "Lead updated" })
    } else if (action === 'delete') {
      if (!data.id) return NextResponse.json({ error: 'id required for delete' }, { status: 400 })
      await deleteLead(data.id)
      return NextResponse.json({ success: true, message: "Lead deleted" })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Error managing lead:', error)
    const message = error instanceof Error ? error.message : 'Failed to manage lead'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
