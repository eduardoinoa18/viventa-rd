import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AgenteViventaPage({
  searchParams,
}: {
  searchParams?: { listing?: string }
}) {
  const listingId = String(searchParams?.listing || '').trim()

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B2545]">Cómo funciona Agente VIVENTA</h1>
          <p className="mt-3 text-gray-700 leading-relaxed">
            Este listado es gestionado por VIVENTA. Nuestro equipo recibe tu interés primero,
            valida tus necesidades y luego te conecta con uno de nuestros agentes aliados de confianza
            según zona, presupuesto y tipo de propiedad.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Paso 1</p>
              <p className="mt-1 text-sm font-semibold text-[#0B2545]">Recibimos tu lead</p>
              <p className="mt-1 text-xs text-gray-600">Centralizamos el contacto para respuesta rápida y trazable.</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Paso 2</p>
              <p className="mt-1 text-sm font-semibold text-[#0B2545]">Calificamos tu perfil</p>
              <p className="mt-1 text-xs text-gray-600">Entendemos prioridad, financiamiento y preferencias reales.</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Paso 3</p>
              <p className="mt-1 text-sm font-semibold text-[#0B2545]">Asignamos al mejor aliado</p>
              <p className="mt-1 text-xs text-gray-600">Te conectamos con un agente dispuesto y adecuado para cerrar.</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#0B2545]/10 bg-[#0B2545]/5 p-4">
            <p className="text-sm text-gray-700">
              {listingId
                ? `Referencia del listado: ${listingId}. Usa este ID al escribirnos para acelerar tu atención.`
                : 'Cuando nos contactes, comparte el ID del listado para asignarte más rápido.'}
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/contact"
              className="px-5 py-3 rounded-lg bg-[#00A676] hover:bg-[#008c5c] text-white font-semibold text-center"
            >
              Quiero que me contacten
            </Link>
            {listingId ? (
              <Link
                href={`/listing/${encodeURIComponent(listingId)}`}
                className="px-5 py-3 rounded-lg border border-gray-300 text-[#0B2545] font-semibold text-center"
              >
                Volver al listado
              </Link>
            ) : (
              <Link
                href="/search"
                className="px-5 py-3 rounded-lg border border-gray-300 text-[#0B2545] font-semibold text-center"
              >
                Explorar propiedades
              </Link>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
