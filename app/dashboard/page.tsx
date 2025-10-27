"use client";
import { useEffect, useState } from 'react';
import { getSession } from '../../lib/authSession';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { FiHeart, FiSearch, FiUser, FiMail, FiPhone, FiBookmark, FiMessageSquare, FiSettings, FiLogOut } from 'react-icons/fi';
import { auth } from '../../lib/firebaseClient';
import { signOut } from 'firebase/auth';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s) { 
      router.replace('/login'); 
      return; 
    }
    setUser(s);
  }, []);

  async function handleLogout() {
    await signOut(auth);
    document.cookie = 'viventa_session=; Max-Age=0';
    document.cookie = 'viventa_role=; Max-Age=0';
    router.push('/');
  }

  if (!user) return <div className="text-center py-8 text-gray-500">Cargando...</div>;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mi Dashboard</h1>
          <p className="text-gray-600">Bienvenido, {user.name || 'Usuario'}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'overview' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                <FiUser /> Resumen
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'favorites' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                <FiHeart /> Favoritos
              </button>
              <button
                onClick={() => setActiveTab('searches')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'searches' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                <FiSearch /> Búsquedas Guardadas
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'messages' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                <FiMessageSquare /> Mensajes
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'profile' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                <FiSettings /> Perfil
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-red-50 text-red-600"
              >
                <FiLogOut /> Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiHeart className="text-2xl text-red-500" />
                      <div className="text-2xl font-bold">0</div>
                    </div>
                    <div className="text-sm text-gray-600">Propiedades Favoritas</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiSearch className="text-2xl text-blue-500" />
                      <div className="text-2xl font-bold">0</div>
                    </div>
                    <div className="text-sm text-gray-600">Búsquedas Guardadas</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiMessageSquare className="text-2xl text-green-500" />
                      <div className="text-2xl font-bold">0</div>
                    </div>
                    <div className="text-sm text-gray-600">Mensajes</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">Comienza tu búsqueda</h2>
                  <p className="text-gray-600 mb-6">Encuentra la propiedad perfecta en República Dominicana</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href="/search" className="px-6 py-3 bg-[#00A6A6] text-white rounded-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#008f8f] transition-colors">
                      <FiSearch /> Buscar Propiedades
                    </a>
                    <a href="/agents" className="px-6 py-3 bg-[#004AAD] text-white rounded-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#003d8f] transition-colors">
                      <FiUser /> Ver Agentes
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Mis Favoritos</h2>
                <div className="text-center py-12 text-gray-500">
                  <FiHeart className="text-5xl mx-auto mb-4 text-gray-300" />
                  <p className="mb-4">No tienes propiedades favoritas aún</p>
                  <a href="/search" className="text-blue-600 hover:underline">Explorar propiedades</a>
                </div>
              </div>
            )}

            {activeTab === 'searches' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Búsquedas Guardadas</h2>
                <div className="text-center py-12 text-gray-500">
                  <FiBookmark className="text-5xl mx-auto mb-4 text-gray-300" />
                  <p className="mb-4">No tienes búsquedas guardadas</p>
                  <a href="/search" className="text-blue-600 hover:underline">Crear búsqueda</a>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Mensajes</h2>
                <div className="text-center py-12 text-gray-500">
                  <FiMessageSquare className="text-5xl mx-auto mb-4 text-gray-300" />
                  <p className="mb-4">No tienes mensajes</p>
                  <p className="text-sm">Los agentes podrán contactarte cuando te interese una propiedad</p>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-6">Mi Perfil</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                    <input 
                      type="text" 
                      value={user.name || ''} 
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input 
                      type="email" 
                      value={user.email || auth.currentUser?.email || ''} 
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de cuenta</label>
                    <input 
                      type="text" 
                      value="Usuario" 
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-4">¿Eres un profesional inmobiliario?</p>
                    <a href="/apply" className="px-6 py-3 bg-[#00A6A6] text-white rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-[#008f8f] transition-colors">
                      Solicitar Acceso Profesional
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
