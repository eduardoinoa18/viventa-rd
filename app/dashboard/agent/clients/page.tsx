"use client";
import React, { useState } from "react";

const mockLeads = [
  { id: 1, name: "Ana Perez", tag: "Buyer", status: "New" },
  { id: 2, name: "Carlos Gomez", tag: "Seller", status: "Contacted" },
  { id: 3, name: "Lucia Rivera", tag: "Investor", status: "Appointment" },
];

const mockClients = [
  { id: 1, name: "Ana Perez", email: "ana@email.com", phone: "809-555-1234" },
  { id: 2, name: "Carlos Gomez", email: "carlos@email.com", phone: "809-555-5678" },
  { id: 3, name: "Lucia Rivera", email: "lucia@email.com", phone: "809-555-8765" },
];

export default function AgentClientsPage() {
  const [tab, setTab] = useState("leads");
  const [search, setSearch] = useState("");

  const filteredClients = mockClients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

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
              {mockLeads.map(lead => (
                <tr key={lead.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{lead.name}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">{lead.tag}</span></td>
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
              {filteredClients.map(client => (
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
