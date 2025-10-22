import { NextResponse } from "next/server"
import {
  getLeadsByAgent,
  createLead,
  updateLead,
  deleteLead
} from "@/lib/firestoreService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    const leads = await getLeadsByAgent(agentId)
    return NextResponse.json({ leads })
  } catch (error: any) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, ...data } = body

    if (action === 'create') {
      const id = await createLead(data)
      return NextResponse.json({ success: true, message: "Lead created", id })
    } else if (action === 'update') {
      await updateLead(data.id, data)
      return NextResponse.json({ success: true, message: "Lead updated" })
    } else if (action === 'delete') {
      await deleteLead(data.id)
      return NextResponse.json({ success: true, message: "Lead deleted" })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error managing lead:', error)
    return NextResponse.json({ error: error.message || 'Failed to manage lead' }, { status: 500 })
  }
}
