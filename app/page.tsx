"use client"

import Header from '../components/Header';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import AgentCard from '../components/AgentCard';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false });

const properties = [
  { id: 1, title: "Luxury Villa in Santo Domingo", price: 350000, type: "Villa", lat: 18.4861, lng: -69.9312, img: "/demo1.jpg", city: "Santo Domingo", neighborhood: "Piantini", beds: 3, baths: 2, sqft: 180 },
  { id: 2, title: "Modern Apartment in Punta Cana", price: 220000, type: "Apartment", lat: 18.5818, lng: -68.4043, img: "/demo2.jpg", city: "Punta Cana", neighborhood: "Bávaro", beds: 2, baths: 2, sqft: 120 },
  { id: 3, title: "Cozy Beach House", price: 450000, type: "House", lat: 19.757, lng: -70.517, img: "/demo3.jpg", city: "Santiago", neighborhood: "Los Jardines", beds: 4, baths: 3, sqft: 220 },
];

const topAgents = [
  { id: 'a1', photo: '/agent1.jpg', name: 'María López', area: 'Santo Domingo', rating: 4.9 },
  { id: 'a2', photo: '/agent2.jpg', name: 'Carlos Pérez', area: 'Punta Cana', rating: 5.0 },
  { id: 'a3', photo: '/agent3.jpg', name: 'Ana García', area: 'Santiago', rating: 4.8 },
  { id: 'a4', photo: '/agent4.jpg', name: 'Luis Rodríguez', area: 'La Romana', rating: 4.7 },
];

export default function HomePage() {
  const user = undefined as any;
  const [filters, setFilters] = useState({ location: "", type: "", minPrice: "", maxPrice: "" });
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true) }, []);

  const filtered = properties.filter((p) => {
    const matchesType = filters.type ? p.type === filters.type : true;
    const matchesMin = filters.minPrice ? p.price >= parseInt(filters.minPrice) : true;
    const matchesMax = filters.maxPrice ? p.price <= parseInt(filters.maxPrice) : true;
    return matchesType && matchesMin && matchesMax;
  });

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-cover bg-center h-[320px] flex items-center justify-center" style={{backgroundImage:'url(/hero-bg.jpg)'}}>
          <div className="absolute inset-0 bg-[#0B2545]/60" />
          <div className="relative z-10 text-center text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Encuentra tu próximo hogar con VIVENTA.</h1>
            <p className="mb-6 text-lg">Tu espacio, tu futuro.</p>
          </div>
        </section>

        {/* Map Search & Filters */}
        <section className="flex flex-col md:flex-row max-w-7xl mx-auto py-8 px-4 gap-6">
          {/* LEFT — Filters */}
          <div className="md:w-1/3 bg-white shadow-lg rounded-xl p-5">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Buscar propiedades</h2>
            <input
              type="text"
              placeholder="Ubicación..."
              className="w-full border p-2 rounded mb-3"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />

            <select
              className="w-full border p-2 rounded mb-3"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">Tipo de propiedad</option>
              <option value="Villa">Villa</option>
              <option value="Apartment">Apartamento</option>
              <option value="House">Casa</option>
            </select>

            <div className="flex gap-2 mb-3">
              <input
                type="number"
                placeholder="Precio mínimo"
                className="w-1/2 border p-2 rounded"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
              <input
                type="number"
                placeholder="Precio máximo"
                className="w-1/2 border p-2 rounded"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>

            {!user && (
              <p className="text-sm text-gray-500 bg-yellow-100 p-2 rounded">
                🔒 Inicia sesión o regístrate para ver todos los detalles de las propiedades.
              </p>
            )}

            <div className="mt-6 space-y-4">
              {filtered.map((p) => (
                <div key={p.id} className="bg-gray-50 shadow rounded p-3">
                  <img src={p.img} alt={p.title} className="w-full h-32 object-cover rounded" />
                  <h3 className="font-semibold mt-2">{p.title}</h3>
                  <p className="text-blue-600 font-bold">${p.price.toLocaleString()}</p>
                  {user ? (
                    <a href={`/properties/${p.id}`} className="text-blue-700 underline text-sm">Ver detalles</a>
                  ) : (
                    <span className="text-gray-500 text-sm">Requiere login</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Map */}
          <div className="md:w-2/3 h-[400px] rounded-xl overflow-hidden shadow-lg">
            {isMounted ? (
              <LeafletMap properties={filtered as any} user={user} />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600">Cargando mapa...</span>
              </div>
            )}
          </div>
        </section>

        {/* Top Agents */}
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#0B2545]">Encuentra a tu agente ideal</h2>
            <div className="flex space-x-6 overflow-x-auto pb-2">
              {topAgents.map(a => <AgentCard key={a.id} agent={a} />)}
            </div>
          </div>
        </section>

        {/* Why Choose VIVENTA */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6 text-[#0B2545]">¿Por qué elegir VIVENTA?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-4xl mb-2">✅</span>
              <div className="font-bold mb-1">Listados Verificados</div>
              <div className="text-sm text-gray-600 text-center">Solo propiedades revisadas y aprobadas por nuestro equipo.</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-4xl mb-2">🤝</span>
              <div className="font-bold mb-1">Agentes de Confianza</div>
              <div className="text-sm text-gray-600 text-center">Trabaja con los mejores profesionales del sector inmobiliario.</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-4xl mb-2">🔒</span>
              <div className="font-bold mb-1">Transacciones Seguras</div>
              <div className="text-sm text-gray-600 text-center">Tu información y tu inversión están protegidas.</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#00A676] py-12 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">¿Eres agente o desarrollador?</h2>
          <p className="mb-4">Únete a VIVENTA PRO y lleva tu carrera al siguiente nivel.</p>
          <a href="/profesionales" className="inline-block px-8 py-3 bg-white text-[#00A676] font-bold rounded shadow hover:bg-gray-100">Descubre VIVENTA para Profesionales</a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
