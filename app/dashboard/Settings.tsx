"use client";
export default function Settings() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Configuración de Perfil</h1>
      <form className="bg-white shadow rounded p-6 max-w-lg">
        <input type="text" placeholder="Nombre completo" className="w-full border p-2 rounded mb-3" />
        <input type="email" placeholder="Email" className="w-full border p-2 rounded mb-3" />
        <input type="password" placeholder="Nueva contraseña" className="w-full border p-2 rounded mb-3" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Guardar cambios</button>
      </form>
    </div>
  );
}
