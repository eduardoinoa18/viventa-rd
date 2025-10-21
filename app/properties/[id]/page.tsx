"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

const demoProperty = {
  id: '1',
  image: '/demo1.jpg',
  price_usd: 250000,
  city: 'Santo Domingo',
  neighborhood: 'Piantini',
  beds: 3,
  baths: 2,
  sqft: 180,
  description: 'Hermoso apartamento en el corazón de Piantini, cerca de todo.',
  agent: { name: 'María López', photo: '/agent1.jpg', area: 'Santo Domingo', rating: 4.9 }
};

// Simulate user authentication (replace with real auth logic)
const user = null; // Change to object to simulate logged-in

export default function PropertyDetailPage() {
  const router = useRouter();
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, []);
  if (!user) {
    // Show preview only
    return (
      <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-6">
            <img src={demoProperty.image} alt={demoProperty.city} className="w-full rounded-lg object-cover mb-4" />
            <div className="text-2xl font-bold text-[#0B2545] mb-2">${demoProperty.price_usd.toLocaleString()} USD</div>
            <div className="text-lg text-gray-700 mb-2">{demoProperty.city}, {demoProperty.neighborhood}</div>
            <div className="text-sm text-gray-500 mb-4">{demoProperty.beds} hab • {demoProperty.baths} baños • {demoProperty.sqft} m²</div>
            <div className="mb-4 text-gray-800">Inicia sesión para ver todos los detalles y contactar al agente.</div>
            <a href="/login" className="px-6 py-2 bg-[#00A676] text-white rounded font-semibold">Iniciar sesión</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  const p = demoProperty;
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row gap-8">
          <img src={p.image} alt={p.city} className="w-full md:w-1/2 rounded-lg object-cover" />
          <div className="flex-1 flex flex-col">
            <div className="text-2xl font-bold text-[#0B2545] mb-2">${p.price_usd.toLocaleString()} USD</div>
            <div className="text-lg text-gray-700 mb-2">{p.city}, {p.neighborhood}</div>
            <div className="text-sm text-gray-500 mb-4">{p.beds} hab • {p.baths} baños • {p.sqft} m²</div>
            <div className="mb-4 text-gray-800">{p.description}</div>
            <div className="mt-auto">
              <h3 className="font-bold mb-2">Agente</h3>
              <div className="flex items-center gap-3">
                <img src={p.agent.photo} alt={p.agent.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-[#0B2545]">{p.agent.name}</div>
                  <div className="text-xs text-gray-600">{p.agent.area}</div>
                  <div className="text-xs text-yellow-500">★ {p.agent.rating}</div>
                </div>
              </div>
            </div>
            <form className="mt-6 bg-[#FAFAFA] p-4 rounded">
              <div className="font-bold mb-2">Solicitar información</div>
              <input placeholder="Tu nombre" className="px-3 py-2 border rounded w-full mb-2" />
              <input placeholder="Tu email" className="px-3 py-2 border rounded w-full mb-2" />
              <textarea placeholder="Mensaje" className="px-3 py-2 border rounded w-full mb-2" rows={2} />
              <button type="submit" className="px-6 py-2 bg-[#00A676] text-white rounded font-semibold">Enviar</button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
