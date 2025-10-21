import React from "react";

export default function AgentDashboardHome() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Welcome back, Eduardo 👋 Here’s your business snapshot.</h1>
      {/* Dashboard widgets will go here */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Placeholder for widgets */}
        <div className="rounded-xl shadow-md bg-white p-6">🏘️ <b>Active Listings</b><div className="text-2xl mt-2">12 Active</div></div>
        <div className="rounded-xl shadow-md bg-white p-6">💰 <b>Total Leads</b><div className="text-2xl mt-2">48 New</div></div>
        <div className="rounded-xl shadow-md bg-white p-6">📈 <b>Conversion Rate</b><div className="text-2xl mt-2">27%</div></div>
        <div className="rounded-xl shadow-md bg-white p-6">⭐ <b>Client Reviews</b><div className="text-2xl mt-2">4.8 / 5</div></div>
      </div>
    </main>
  );
}
