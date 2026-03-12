// app/api/admin/roles/route.ts
import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

// GET - List all roles
export async function GET() {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const snapshot = await db.collection('admin_roles').orderBy('createdAt', 'desc').get()
    const roles = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }))

    return NextResponse.json({ ok: true, roles })
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    // Return empty array if collection doesn't exist or permission denied
    if (error?.code === 'permission-denied' || error?.message?.includes('index')) {
      return NextResponse.json({ ok: true, roles: [] })
    }
    return NextResponse.json({ ok: false, error: 'Error al obtener roles' }, { status: 500 })
  }
}

// POST - Create new role
export async function POST(request: Request) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const { name, displayName, description, permissions, color } = await request.json()

    if (!name || !displayName) {
      return NextResponse.json({ ok: false, error: 'Nombre y displayName son requeridos' }, { status: 400 })
    }

    const docRef = await db.collection('admin_roles').add({
      name,
      displayName,
      description: description || '',
      permissions: permissions || [],
      color: color || '#3B82F6',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({ ok: true, id: docRef.id })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json({ ok: false, error: 'Error al crear rol' }, { status: 500 })
  }
}

// PUT - Update role
export async function PUT(request: Request) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const { id, name, displayName, description, permissions, color } = await request.json()

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es requerido' }, { status: 400 })
    }

    await db.collection('admin_roles').doc(id).update({
      name,
      displayName,
      description,
      permissions,
      color,
      updatedAt: new Date()
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ ok: false, error: 'Error al actualizar rol' }, { status: 500 })
  }
}

// DELETE - Remove role
export async function DELETE(request: Request) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es requerido' }, { status: 400 })
    }

    await db.collection('admin_roles').doc(id).delete()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ ok: false, error: 'Error al eliminar rol' }, { status: 500 })
  }
}
