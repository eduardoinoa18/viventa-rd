"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const leadsVsDealsData = [
  { month: "Jan", leads: 45, deals: 12 },
  { month: "Feb", leads: 52, deals: 14 },
  { month: "Mar", leads: 48, deals: 13 },
  { month: "Apr", leads: 60, deals: 16 },
  { month: "May", leads: 55, deals: 15 },
  { month: "Jun", leads: 48, deals: 13 },
];

const viewsByCityData = [
  { name: "Santo Domingo", value: 400 },
  { name: "Punta Cana", value: 300 },
  { name: "Santiago", value: 200 },
  { name: "La Romana", value: 100 },
];

const trafficSourceData = [
  { name: "Zillow", value: 35 },
  { name: "Website", value: 40 },
  { name: "Social Media", value: 25 },
];

const revenueProjectionData = [
  { month: "Jan", revenue: 50000 },
  { month: "Feb", revenue: 55000 },
  { month: "Mar", revenue: 52000 },
  { month: "Apr", revenue: 60000 },
  { month: "May", revenue: 58000 },
  { month: "Jun", revenue: 62000 },
];

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export default function AgentAnalyticsPage() {
  return (
    <main className="p-6">
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads vs Deals */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Leads vs Closed Deals</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsVsDealsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="#3B82F6" />
              <Bar dataKey="deals" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Property Views by City */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Property Views by City</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={viewsByCityData} cx="50%" cy="50%" labelLine={false} label outerRadius={100} fill="#8884d8" dataKey="value">
                {viewsByCityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Source */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Source of Traffic</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={trafficSourceData} cx="50%" cy="50%" labelLine={false} label outerRadius={100} fill="#8884d8" dataKey="value">
                {trafficSourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Projection */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Projection</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueProjectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}
