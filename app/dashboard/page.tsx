"use client";
import { useEffect, useState } from 'react';
import { getSession } from '../../lib/authSession';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BottomNav from '../../components/BottomNav';
import UserEngagement from '../../components/UserEngagement';
import { FiHeart, FiSearch, FiUser, FiMail, FiPhone, FiBookmark, FiMessageSquare, FiSettings, FiLogOut, FiAward, FiZap } from 'react-icons/fi';
import MessagesPreview from '../../components/MessagesPreview';
import { auth } from '../../lib/firebaseClient';
import { signOut } from 'firebase/auth';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s) { 
      router.replace('/login'); 
      return; 
    }
    setUser(s);
    fetchRecommendations();
  }, []);

  async function fetchRecommendations() {
    setLoadingRecs(true);
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (data.ok) {
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error('Failed to fetch recommendations', e);
    } finally {
      setLoadingRecs(false);
    }
  }

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

        {/* Mobile tabs for quick navigation */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto pb-2 mb-4">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Resumen' },
              { id: 'favorites', label: 'Favoritos' },
              { id: 'recommendations', label: 'Recomendaciones' },
              { id: 'searches', label: 'Búsquedas' },
              { id: 'messages', label: 'Mensajes' },
              { id: 'profile', label: 'Perfil' },
              { id: 'engagement', label: 'Logros' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={()=>setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${activeTab===tab.id?'bg-[#00A6A6] text-white border-[#00A6A6]':'bg-white text-gray-700 border-gray-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
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
                onClick={() => setActiveTab('recommendations')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'recommendations' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                <FiZap /> Recomendaciones
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
                onClick={() => setActiveTab('engagement')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'engagement' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                <FiAward /> Mis Logros
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

            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <FiZap className="text-3xl" />
                    <h2 className="text-2xl font-bold">Recomendaciones para ti</h2>
                  </div>
                  <p className="text-purple-100">Propiedades seleccionadas según tus preferencias y actividad</p>
                </div>

                {loadingRecs ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Analizando tus preferencias...</p>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12 text-gray-500">
                    <FiZap className="text-5xl mx-auto mb-4 text-gray-300" />
                    <p className="mb-4">Aún no tenemos suficiente información para personalizar tus recomendaciones</p>
                    <a href="/search" className="text-blue-600 hover:underline">Explora propiedades para empezar</a>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map((prop) => (
                      <div key={prop.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
                        <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
                          {prop.images && prop.images[0] ? (
                            <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                          ) : (
                            <FiHeart className="text-4xl text-gray-300" />
                          )}
                          {prop.score && (
                            <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {prop.score}% match
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{prop.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{prop.location || prop.city}</p>
                          <div className="text-sm text-gray-600 mb-2">
                            {prop.bedrooms} hab • {prop.bathrooms} baños • {prop.area}m²
                          </div>
                          <div className="font-bold text-[#0B2545] mb-3">
                            RD$ {Number(prop.price || 0).toLocaleString('es-DO')}
                          </div>
                          <a
                            href={`/listing/${prop.id}`}
                            className="block w-full text-center px-4 py-2 bg-[#00A6A6] text-white rounded-lg font-semibold hover:bg-[#008f8f] transition"
                          >
                            Ver detalles
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-2">Mensajes</h2>
                  <p className="text-sm text-gray-600 mb-4">Tus chats recientes con agentes</p>
                  <MessagesPreview />
                </div>
                <a href="/messages" className="block w-full text-center px-4 py-3 bg-[#0B2545] text-white rounded-lg font-semibold hover:opacity-90">Abrir chat completo</a>
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

            {activeTab === 'engagement' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Logros y Progreso</h2>
                <UserEngagement />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
