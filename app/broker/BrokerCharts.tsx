'use client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type ChartsProps = {
  revenueData: any[]
  agentPerformance: any[]
  statusDistribution: any[]
  COLORS: string[]
}

export default function BrokerCharts({ revenueData, agentPerformance, statusDistribution, COLORS }: ChartsProps) {
  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#00A6A6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Top Agents</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agentPerformance.slice(0, 5)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="deals" fill="#00A6A6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Listings Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={entry => entry.name}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {statusDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
