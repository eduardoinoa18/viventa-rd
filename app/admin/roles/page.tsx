'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiUsers, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  displayName: string
  description: string
  permissions: string[]
  color: string
  createdAt: any
}

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  roleName: string
  createdAt: any
  lastLogin: any
  active: boolean
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // Users Management
  { id: 'users.view', name: 'Ver Usuarios', description: 'Ver lista de usuarios', category: 'Usuarios' },
  { id: 'users.edit', name: 'Editar Usuarios', description: 'Modificar información de usuarios', category: 'Usuarios' },
  { id: 'users.delete', name: 'Eliminar Usuarios', description: 'Eliminar cuentas de usuarios', category: 'Usuarios' },
  
  // Properties Management
  { id: 'properties.view', name: 'Ver Propiedades', description: 'Ver listado de propiedades', category: 'Propiedades' },
  { id: 'properties.create', name: 'Crear Propiedades', description: 'Agregar nuevas propiedades', category: 'Propiedades' },
  { id: 'properties.edit', name: 'Editar Propiedades', description: 'Modificar propiedades existentes', category: 'Propiedades' },
  { id: 'properties.delete', name: 'Eliminar Propiedades', description: 'Eliminar propiedades', category: 'Propiedades' },
  { id: 'properties.approve', name: 'Aprobar Propiedades', description: 'Aprobar propiedades pendientes', category: 'Propiedades' },
  
  // Agents & Brokers
  { id: 'agents.view', name: 'Ver Agentes', description: 'Ver lista de agentes', category: 'Agentes' },
  { id: 'agents.approve', name: 'Aprobar Agentes', description: 'Aprobar aplicaciones de agentes', category: 'Agentes' },
  { id: 'agents.edit', name: 'Editar Agentes', description: 'Modificar información de agentes', category: 'Agentes' },
  { id: 'brokers.view', name: 'Ver Brokers', description: 'Ver lista de brokers', category: 'Agentes' },
  { id: 'brokers.approve', name: 'Aprobar Brokers', description: 'Aprobar aplicaciones de brokers', category: 'Agentes' },
  
  // Billing & Finance
  { id: 'billing.view', name: 'Ver Facturación', description: 'Acceso a dashboard de facturación', category: 'Facturación' },
  { id: 'billing.manage', name: 'Gestionar Facturación', description: 'Gestionar suscripciones y pagos', category: 'Facturación' },
  
  // Support & Contact
  { id: 'support.view', name: 'Ver Mensajes', description: 'Ver mensajes de contacto', category: 'Soporte' },
  { id: 'support.respond', name: 'Responder Mensajes', description: 'Responder a usuarios', category: 'Soporte' },
  { id: 'chat.access', name: 'Acceso a Chat', description: 'Acceder al sistema de chat', category: 'Soporte' },
  
  // Settings & Admin
  { id: 'settings.view', name: 'Ver Configuración', description: 'Ver configuraciones del sistema', category: 'Configuración' },
  { id: 'settings.edit', name: 'Editar Configuración', description: 'Modificar configuraciones', category: 'Configuración' },
  { id: 'analytics.view', name: 'Ver Analíticas', description: 'Acceso a reportes y analíticas', category: 'Analíticas' },
  
  // Admin Management (Master Admin only)
  { id: 'admin.roles', name: 'Gestionar Roles', description: 'Crear y editar roles', category: 'Administración' },
  { id: 'admin.users', name: 'Gestionar Admins', description: 'Crear y gestionar usuarios admin', category: 'Administración' },
]

export default function RolesManagementPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'admins'>('roles')
  const [roles, setRoles] = useState<Role[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  
  const [newRole, setNewRole] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[],
    color: '#3B82F6'
  })

  const [newAdmin, setNewAdmin] = useState({
    email: '',
    name: '',
    role: '',
    password: ''
  })

  useEffect(() => {
    fetchRoles()
    fetchAdminUsers()
  }, [])

  async function fetchRoles() {
    try {
      const res = await fetch('/api/admin/roles')
      const data = await res.json()
      if (data.ok) setRoles(data.roles)
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  async function fetchAdminUsers() {
    try {
      const res = await fetch('/api/admin/roles/users')
      const data = await res.json()
      if (data.ok) setAdminUsers(data.users)
    } catch (error) {
      console.error('Error fetching admin users:', error)
    }
  }

  async function saveRole() {
    if (!newRole.name || !newRole.displayName) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    try {
      const res = await fetch('/api/admin/roles', {
        method: editingRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRole ? { ...newRole, id: editingRole.id } : newRole)
      })

      const data = await res.json()
      if (data.ok) {
        toast.success(editingRole ? 'Rol actualizado' : 'Rol creado')
        setShowRoleModal(false)
        setEditingRole(null)
        setNewRole({ name: '', displayName: '', description: '', permissions: [], color: '#3B82F6' })
        fetchRoles()
      } else {
        toast.error(data.error || 'Error al guardar rol')
      }
    } catch (error) {
      toast.error('Error al guardar rol')
      console.error(error)
    }
  }

  async function createAdmin() {
    if (!newAdmin.email || !newAdmin.name || !newAdmin.role || !newAdmin.password) {
      toast.error('Completa todos los campos')
      return
    }

    try {
      const res = await fetch('/api/admin/roles/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      })

      const data = await res.json()
      if (data.ok) {
        toast.success('Usuario admin creado exitosamente')
        setShowAdminModal(false)
        setNewAdmin({ email: '', name: '', role: '', password: '' })
        fetchAdminUsers()
      } else {
        toast.error(data.error || 'Error al crear usuario')
      }
    } catch (error) {
      toast.error('Error al crear usuario')
      console.error(error)
    }
  }

  async function deleteRole(roleId: string) {
    if (!confirm('¿Estás seguro de eliminar este rol?')) return

    try {
      const res = await fetch(`/api/admin/roles?id=${roleId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        toast.success('Rol eliminado')
        fetchRoles()
      } else {
        toast.error(data.error || 'Error al eliminar rol')
      }
    } catch (error) {
      toast.error('Error al eliminar rol')
    }
  }

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <ProtectedClient allowed={['master_admin']}>
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Roles y Accesos</h1>
                <p className="text-gray-600">Crea roles personalizados y gestiona usuarios administradores</p>
              </div>

              {/* Tabs */}
              <div className="mb-6 flex gap-2 border-b">
                <button
                  onClick={() => setActiveTab('roles')}
                  className={`px-6 py-3 font-semibold transition-all ${
                    activeTab === 'roles'
                      ? 'border-b-2 border-[#00A676] text-[#00A676]'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FiShield className="inline mr-2" />
                  Roles y Permisos
                </button>
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`px-6 py-3 font-semibold transition-all ${
                    activeTab === 'admins'
                      ? 'border-b-2 border-[#00A676] text-[#00A676]'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FiUsers className="inline mr-2" />
                  Usuarios Admin
                </button>
              </div>

              {/* Roles Tab */}
              {activeTab === 'roles' && (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-gray-600">{roles.length} roles configurados</p>
                    <button
                      onClick={() => {
                        setEditingRole(null)
                        setNewRole({ name: '', displayName: '', description: '', permissions: [], color: '#3B82F6' })
                        setShowRoleModal(true)
                      }}
                      className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#009966] transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                      <FiPlus /> Crear Rol
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => (
                      <div key={role.id} className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${role.color}20`, color: role.color }}
                            >
                              <FiShield className="text-xl" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{role.displayName}</h3>
                              <p className="text-sm text-gray-500">{role.name}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingRole(role)
                                setNewRole({
                                  name: role.name,
                                  displayName: role.displayName,
                                  description: role.description,
                                  permissions: role.permissions,
                                  color: role.color
                                })
                                setShowRoleModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-800 p-2"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              onClick={() => deleteRole(role.id)}
                              className="text-red-600 hover:text-red-800 p-2"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{role.description}</p>
                        <div className="text-sm text-gray-500">
                          <strong>{role.permissions.length}</strong> permisos asignados
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Users Tab */}
              {activeTab === 'admins' && (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-gray-600">{adminUsers.length} usuarios admin</p>
                    <button
                      onClick={() => setShowAdminModal(true)}
                      className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#009966] transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                      <FiPlus /> Crear Usuario Admin
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Acceso</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {adminUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {user.roleName}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Nunca'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Create/Edit Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-4">{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre Técnico*</label>
                <input
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="ej: support_agent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre para Mostrar*</label>
                <input
                  value={newRole.displayName}
                  onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="ej: Agente de Soporte"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Descripción</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  rows={2}
                  placeholder="Descripción del rol..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Color del Rol</label>
                <input
                  type="color"
                  value={newRole.color}
                  onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                  className="w-20 h-10 border rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3">Permisos</label>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">{category}</h4>
                    <div className="space-y-2">
                      {perms.map((perm) => (
                        <label key={perm.id} className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={newRole.permissions.includes(perm.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRole({ ...newRole, permissions: [...newRole.permissions, perm.id] })
                              } else {
                                setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => p !== perm.id) })
                              }
                            }}
                            className="w-5 h-5 mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{perm.name}</div>
                            <div className="text-xs text-gray-500">{perm.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRoleModal(false)
                  setEditingRole(null)
                }}
                className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={saveRole}
                className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#009966] transition-all"
              >
                {editingRole ? 'Actualizar Rol' : 'Crear Rol'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin User Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-4">Crear Usuario Admin</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Email*</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="admin@viventa.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre Completo*</label>
                <input
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Rol*</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Contraseña Temporal*</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Mínimo 8 caracteres"
                />
                <p className="text-xs text-gray-500 mt-1">El usuario deberá cambiarla en su primer acceso</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAdminModal(false)}
                className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={createAdmin}
                className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#009966] transition-all"
              >
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedClient>
  )
}
