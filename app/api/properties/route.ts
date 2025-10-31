import { NextResponse } from "next/server"
import {
  getAllProperties,
  getPropertiesByAgent,
  createProperty,
  updateProperty,
  deleteProperty
} from "@/lib/firestoreService"
import { ActivityLogger } from "@/lib/activityLogger"

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
      
      // Log property creation
      await ActivityLogger.log({
        type: 'property',
        action: 'Property Created',
        userId: data.agentId || 'unknown',
        userName: data.agentName,
        userEmail: data.agentEmail,
        metadata: {
          propertyId: id,
          title: data.title || data.name,
          type: data.type || data.propertyType,
          price: data.price
        }
      })
      
      return NextResponse.json({ success: true, message: "Property created", id })
    } else if (action === 'update') {
      await updateProperty(data.id, data)
      
      // Log property update
      await ActivityLogger.log({
        type: 'property',
        action: 'Property Updated',
        userId: data.agentId || 'unknown',
        userName: data.agentName,
        userEmail: data.agentEmail,
        metadata: {
          propertyId: data.id,
          title: data.title || data.name,
          updatedFields: Object.keys(data).filter(k => !['id', 'agentId', 'agentName', 'agentEmail'].includes(k))
        }
      })
      
      return NextResponse.json({ success: true, message: "Property updated" })
    } else if (action === 'delete') {
      await deleteProperty(data.id)
      
      // Log property deletion
      await ActivityLogger.log({
        type: 'property',
        action: 'Property Deleted',
        userId: data.agentId || 'unknown',
        userName: data.agentName,
        userEmail: data.agentEmail,
        metadata: {
          propertyId: data.id,
          title: data.title || data.name
        }
      })
      
      return NextResponse.json({ success: true, message: "Property deleted" })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error managing property:', error)
    return NextResponse.json({ error: error.message || 'Failed to manage property' }, { status: 500 })
  }
}
