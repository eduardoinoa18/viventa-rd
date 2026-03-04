import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-blue-50 via-white to-teal-50 border-b">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
            <p className="text-gray-600">Cómo recopilamos, usamos y protegemos tus datos en VIVENTA</p>
          </div>
        </section>

        <section className="py-10">
          <div className="max-w-4xl mx-auto px-4 space-y-8 text-gray-800">
            <div>
              <h2 className="text-xl font-semibold mb-3">1. Datos que recopilamos</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Datos de cuenta: nombre, email, teléfono, rol y credenciales cifradas.</li>
                <li>Datos de uso: actividad, páginas visitadas, interacciones y preferencias.</li>
                <li>Datos de operaciones: solicitudes, mensajes, publicaciones y métricas de rendimiento.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">2. Finalidad del tratamiento</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Prestar y mejorar los servicios de búsqueda, publicación y contacto inmobiliario.</li>
                <li>Gestionar seguridad, prevención de fraude y cumplimiento regulatorio.</li>
                <li>Enviar notificaciones operativas, invitaciones, alertas y comunicaciones de soporte.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">3. Base legal y consentimiento</h2>
              <p>
                Tratamos datos cuando existe consentimiento, relación contractual, interés legítimo o cumplimiento legal.
                El consentimiento para Términos y Privacidad queda registrado al completar procesos de registro/invitación.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">4. Compartición de información</h2>
              <p>
                Podemos compartir datos con proveedores tecnológicos (hosting, autenticación, email y pagos) bajo acuerdos de
                confidencialidad y seguridad. No vendemos datos personales a terceros.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">5. Cookies y tecnologías similares</h2>
              <p>
                Utilizamos cookies para autenticación, personalización, analítica y desempeño. Puedes gestionarlas desde tu
                navegador, aunque deshabilitarlas puede limitar funcionalidades.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">6. Conservación de datos</h2>
              <p>
                Conservamos datos por el tiempo necesario para la prestación del servicio, obligaciones legales y resolución de
                disputas. Luego se eliminan o anonimizan de forma segura.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">7. Derechos del titular</h2>
              <p>
                Puedes solicitar acceso, corrección, actualización o eliminación de tus datos, así como oposición a ciertos usos,
                escribiendo a <a className="text-[#004AAD] hover:underline" href="mailto:info@viventa.com.do">info@viventa.com.do</a>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">8. Seguridad</h2>
              <p>
                Implementamos controles técnicos y organizativos razonables para proteger tu información contra acceso no autorizado,
                pérdida o alteración.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">9. Cambios de política</h2>
              <p>
                Podemos actualizar esta Política de Privacidad. Publicaremos la versión vigente y la fecha de actualización.
              </p>
            </div>

            <div className="text-xs text-gray-500">Última actualización: Marzo 2026</div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
