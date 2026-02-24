"use client";
import Link from 'next/link';

export default function ConstructorasError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-6 text-center">
      <div className="max-w-lg bg-white rounded-2xl shadow-xl p-10 border border-orange-200">
        <h1 className="text-3xl font-bold mb-4 text-orange-600">Ocurrió un error cargando esta página</h1>
        <p className="text-gray-600 mb-4">Estamos trabajando para resolverlo lo antes posible.</p>
        {error?.digest && (
          <p className="text-xs text-gray-400 mb-6">Código de referencia: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
