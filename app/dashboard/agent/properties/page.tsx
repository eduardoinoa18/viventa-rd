"use client";
import React, { useState } from "react";

const mockListings = [
  { id: 1, title: "Modern Apartment", status: "Active", price: 120000, city: "Santo Domingo" },
  { id: 2, title: "Cozy Villa", status: "Pending", price: 250000, city: "Punta Cana" },
  { id: 3, title: "Downtown Loft", status: "Sold", price: 180000, city: "Santiago" },
];

const statusOptions = ["All", "Active", "Pending", "Sold"];

export default function AgentPropertiesPage() {
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const filtered = status === "All" ? mockListings : mockListings.filter(l => l.status === status);

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">My Listings</h2>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 transition">+ Add New Property</button>
      </div>
      <div className="flex gap-4 mb-4">
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-3 py-2">
          {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
        </select>
        {/* Add more filters here (price, city) */}
      </div>
      <table className="w-full bg-white rounded-xl shadow overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">Title</th>
            <th className="p-3">Status</th>
            <th className="p-3">Price</th>
            <th className="p-3">City</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(listing => (
            <tr key={listing.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{listing.title}</td>
              <td className="p-3">{listing.status}</td>
              <td className="p-3">${listing.price.toLocaleString()}</td>
              <td className="p-3">{listing.city}</td>
              <td className="p-3"><button className="text-blue-600 hover:underline">Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {showForm && <AddPropertyForm onClose={() => setShowForm(false)} />}
    </main>
  );
}

function AddPropertyForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form className="bg-white rounded-xl p-8 w-full max-w-lg shadow-lg relative">
        <button type="button" onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">✕</button>
        <h3 className="text-lg font-bold mb-4">Upload New Property</h3>
        <div className="mb-3"><input className="w-full border rounded px-3 py-2" placeholder="Property Title" required /></div>
        <div className="mb-3"><input className="w-full border rounded px-3 py-2" placeholder="Address" required /></div>
        <div className="mb-3 flex gap-2">
          <input className="w-1/2 border rounded px-3 py-2" placeholder="Price" type="number" required />
          <input className="w-1/2 border rounded px-3 py-2" placeholder="City" required />
        </div>
        <div className="mb-3 flex gap-2">
          <input className="w-1/3 border rounded px-3 py-2" placeholder="Bedrooms" type="number" required />
          <input className="w-1/3 border rounded px-3 py-2" placeholder="Bathrooms" type="number" required />
          <input className="w-1/3 border rounded px-3 py-2" placeholder="SqFt" type="number" required />
        </div>
        <div className="mb-3"><textarea className="w-full border rounded px-3 py-2" placeholder="Description" rows={3} required /></div>
        <div className="mb-4"><input type="file" multiple className="w-full" /></div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 transition w-full">Submit</button>
      </form>
    </div>
  );
}
