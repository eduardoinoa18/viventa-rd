import { NextResponse } from "next/server"
import {
  getAllProperties,
  getPropertiesByAgent,
  createProperty,
  updateProperty,
  deleteProperty
} from "@/lib/firestoreService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')

    const properties = agentId
      ? await getPropertiesByAgent(agentId)
      : await getAllProperties()

    return NextResponse.json({ properties })
  } catch (error: any) {
    console.error('Error fetching properties:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch properties' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, ...data } = body

    if (action === 'create') {
      const id = await createProperty(data)
      return NextResponse.json({ success: true, message: "Property created", id })
    } else if (action === 'update') {
      await updateProperty(data.id, data)
      return NextResponse.json({ success: true, message: "Property updated" })
    } else if (action === 'delete') {
      await deleteProperty(data.id)
      return NextResponse.json({ success: true, message: "Property deleted" })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error managing property:', error)
    return NextResponse.json({ error: error.message || 'Failed to manage property' }, { status: 500 })
  }
}
