import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function UserDashboard() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-[#0B2545]">Mi Panel</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-2">Propiedades Guardadas</h2>
          <div className="text-gray-500 text-sm">(Próximamente: aquí verás tus favoritos)</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-2">Vistas Recientes</h2>
          <div className="text-gray-500 text-sm">(Próximamente: aquí verás tus propiedades vistas)</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Mensajes y Solicitudes</h2>
          <div className="text-gray-500 text-sm">(Próximamente: aquí verás tus mensajes y solicitudes a agentes)</div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
