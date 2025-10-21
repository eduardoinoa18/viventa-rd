"use client";
export default function Stats() {
  const data = { listings: 5, leads: 12, sales: 3, commissions: 18500 };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Resumen de Rendimiento</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white shadow p-4 rounded text-center">
          <h3 className="text-gray-500">Activos</h3>
          <p className="text-2xl font-bold text-blue-700">{data.listings}</p>
        </div>
        <div className="bg-white shadow p-4 rounded text-center">
          <h3 className="text-gray-500">Leads</h3>
          <p className="text-2xl font-bold text-blue-700">{data.leads}</p>
        </div>
        <div className="bg-white shadow p-4 rounded text-center">
          <h3 className="text-gray-500">Ventas</h3>
          <p className="text-2xl font-bold text-blue-700">{data.sales}</p>
        </div>
        <div className="bg-white shadow p-4 rounded text-center">
          <h3 className="text-gray-500">Comisiones</h3>
          <p className="text-2xl font-bold text-green-600">${data.commissions.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
