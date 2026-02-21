// app/api/admin/roles/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'
import { logAdminAction } from '@/lib/admin/auditLog'

// GET - List all roles
export async function GET() {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const q = query(collection(db, 'admin_roles'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    const roles = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }))

    return NextResponse.json({ ok: true, roles })
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    if (error?.code === 'permission-denied' || error?.message?.includes('index')) {
      return NextResponse.json({ ok: true, roles: [] })
    }
    return NextResponse.json({ ok: false, error: 'Error al obtener roles' }, { status: 500 })
  }
}

// POST - Create new role
export async function POST(request: Request) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const { name, displayName, description, permissions, color } = await request.json()

    if (!name || !displayName) {
      return NextResponse.json({ ok: false, error: 'Nombre y displayName son requeridos' }, { status: 400 })
    }

    const docRef = await addDoc(collection(db, 'admin_roles'), {
      name,
      displayName,
      description: description || '',
      permissions: permissions || [],
      color: color || '#3B82F6',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    try {
      await logAdminAction({
        actorUid: authResult.uid,
        actorRole: authResult.role,
        action: 'ROLE_CREATED',
        targetType: 'admin_role',
        targetId: docRef.id,
        metadata: { name, displayName },
      })
    } catch {}

    return NextResponse.json({ ok: true, id: docRef.id })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json({ ok: false, error: 'Error al crear rol' }, { status: 500 })
  }
}

// PUT - Update role
export async function PUT(request: Request) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const { id, name, displayName, description, permissions, color } = await request.json()

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es requerido' }, { status: 400 })
    }

    await updateDoc(doc(db, 'admin_roles', id), {
      name,
      displayName,
      description,
      permissions,
      color,
      updatedAt: serverTimestamp()
    })

    try {
      await logAdminAction({
        actorUid: authResult.uid,
        actorRole: authResult.role,
        action: 'ROLE_UPDATED',
        targetType: 'admin_role',
        targetId: id,
        metadata: { name, displayName },
      })
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ ok: false, error: 'Error al actualizar rol' }, { status: 500 })
  }
}

// DELETE - Remove role
export async function DELETE(request: Request) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es requerido' }, { status: 400 })
    }

    await deleteDoc(doc(db, 'admin_roles', id))

    try {
      await logAdminAction({
        actorUid: authResult.uid,
        actorRole: authResult.role,
        action: 'ROLE_DELETED',
        targetType: 'admin_role',
        targetId: id,
        metadata: {},
      })
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ ok: false, error: 'Error al eliminar rol' }, { status: 500 })
  }
}
