"use client";
import React, { useState, useEffect } from "react";
import { getSession } from "@/lib/authSession";

export default function AgentClientsPage() {
  const [tab, setTab] = useState("leads");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const session = getSession();
      if (!session) return;
      
      const [leadsRes, clientsRes] = await Promise.all([
        fetch(`/api/leads?agentId=${session.uid}`),
        fetch(`/api/clients?agentId=${session.uid}`)
      ]);
      
      const leadsData = await leadsRes.json();
      const clientsData = await clientsRes.json();
      
      setLeads(leadsData.leads || []);
      setClients(clientsData.clients || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="p-6">
      <div className="flex gap-6 mb-6">
        <button onClick={() => setTab("leads")} className={`px-4 py-2 rounded-xl font-semibold ${tab === "leads" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Active Leads</button>
        <button onClick={() => setTab("clients")} className={`px-4 py-2 rounded-xl font-semibold ${tab === "clients" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Clients Database</button>
      </div>
      {tab === "leads" ? (
        <section>
          <h2 className="text-lg font-bold mb-4">Active Leads</h2>
          <table className="w-full bg-white rounded-xl shadow overflow-hidden mb-6">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Tag</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-3 text-center text-gray-500">Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={4} className="p-3 text-center text-gray-500">No leads found</td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{lead.name}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">{lead.source}</span></td>
                  <td className="p-3">{lead.status}</td>
                  <td className="p-3 flex gap-2">
                    <button className="text-blue-600 hover:underline">Mark Contacted</button>
                    <button className="text-green-600 hover:underline">Add Note</button>
                    <button className="text-yellow-600 hover:underline">Schedule</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section>
          <h2 className="text-lg font-bold mb-4">Clients Database</h2>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-4 px-3 py-2 border rounded w-full max-w-xs"
          />
          <table className="w-full bg-white rounded-xl shadow overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-3 text-center text-gray-500">Loading...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={4} className="p-3 text-center text-gray-500">No clients found</td></tr>
              ) : filteredClients.map(client => (
                <tr key={client.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{client.name}</td>
                  <td className="p-3">{client.email}</td>
                  <td className="p-3">{client.phone}</td>
                  <td className="p-3 flex gap-2">
                    <button className="text-blue-600 hover:underline">View</button>
                    <button className="text-green-600 hover:underline">Add Note</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
