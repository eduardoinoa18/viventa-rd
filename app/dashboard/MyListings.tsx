"use client";
export default function MyListings() {
  const listings = [
    { id: 1, title: "Luxury Villa", price: 350000 },
    { id: 2, title: "Downtown Apartment", price: 180000 },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mis Propiedades</h1>
      <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mb-4">
        + Agregar Propiedad
      </button>
      <div className="space-y-3">
        {listings.map((l) => (
          <div key={l.id} className="bg-white shadow p-3 rounded flex justify-between">
            <div>
              <h3 className="font-semibold">{l.title}</h3>
              <p className="text-blue-600">${l.price.toLocaleString()}</p>
            </div>
            <div className="space-x-2">
              <button className="text-sm text-blue-600">Editar</button>
              <button className="text-sm text-red-600">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
