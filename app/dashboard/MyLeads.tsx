"use client";
export default function MyLeads() {
  const leads = [
    { name: "Carlos Perez", property: "Luxury Villa", status: "Nuevo" },
    { name: "Maria Lopez", property: "Beach House", status: "Contactado" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mis Leads</h1>
      <div className="bg-white shadow rounded p-4 space-y-3">
        {leads.map((lead, i) => (
          <div key={i} className="flex justify-between border-b pb-2">
            <div>
              <p className="font-semibold">{lead.name}</p>
              <p className="text-sm text-gray-600">{lead.property}</p>
            </div>
            <p className="text-blue-600">{lead.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
