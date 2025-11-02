"use client";
import { useState } from "react";
import MyListings from "./MyListings";
import MyLeads from "./MyLeads";
import Stats from "./Stats";
import Settings from "./Settings";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function DashboardHome() {
  const [tab, setTab] = useState("listings");
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="w-64 bg-blue-800 text-white min-h-full p-5 space-y-4">
          <h2 className="text-2xl font-bold mb-4">Panel de Agente</h2>
          <nav className="space-y-2">
            <button onClick={() => setTab("listings")} className={`block w-full text-left hover:bg-blue-700 p-2 rounded ${tab==='listings'?'bg-blue-700':''}`}>Mis Propiedades</button>
            <button onClick={() => setTab("leads")} className={`block w-full text-left hover:bg-blue-700 p-2 rounded ${tab==='leads'?'bg-blue-700':''}`}>Mis Leads</button>
            <button onClick={() => setTab("stats")} className={`block w-full text-left hover:bg-blue-700 p-2 rounded ${tab==='stats'?'bg-blue-700':''}`}>Rendimiento</button>
            <button onClick={() => setTab("settings")} className={`block w-full text-left hover:bg-blue-700 p-2 rounded ${tab==='settings'?'bg-blue-700':''}`}>Configuración</button>
          </nav>
        </aside>
        <main className="flex-grow bg-gray-50 p-8">
          {tab === "listings" && <MyListings />}
          {tab === "leads" && <MyLeads />}
          {tab === "stats" && <Stats />}
          {tab === "settings" && <Settings />}
        </main>
      </div>
      <Footer />
    </div>
  );
}
