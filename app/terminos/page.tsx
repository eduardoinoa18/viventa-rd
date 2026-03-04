import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function TerminosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-blue-50 via-white to-teal-50 border-b">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Términos y Condiciones de Uso</h1>
            <p className="text-gray-600">Condiciones aplicables a la plataforma VIVENTA en República Dominicana</p>
          </div>
        </section>

        <section className="py-10">
          <div className="max-w-4xl mx-auto px-4 space-y-8 text-gray-800">
            <div>
              <h2 className="text-xl font-semibold mb-3">1. Aceptación</h2>
              <p>
                Al registrarte, acceder o utilizar VIVENTA, aceptas estos Términos y nuestra Política de Privacidad.
                Si no estás de acuerdo, debes abstenerte de usar la plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">2. Objeto del servicio</h2>
              <p>
                VIVENTA es una plataforma tecnológica para descubrir, publicar y gestionar información inmobiliaria en
                República Dominicana. VIVENTA facilita contacto entre usuarios y profesionales, pero no actúa como parte
                contractual en compraventas, alquileres o financiamientos salvo indicación expresa.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">3. Cuentas y seguridad</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Debes proporcionar datos veraces, completos y actualizados.</li>
                <li>Eres responsable de resguardar tus credenciales y de toda actividad de tu cuenta.</li>
                <li>Podemos suspender o cerrar cuentas por fraude, suplantación, abuso o incumplimiento de estos Términos.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">4. Publicaciones y contenido</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Los anunciantes son responsables de la exactitud legal/comercial de sus publicaciones.</li>
                <li>Está prohibido publicar contenido falso, engañoso, discriminatorio o que viole derechos de terceros.</li>
                <li>Podemos moderar, limitar o retirar contenido cuando exista incumplimiento o riesgo para usuarios.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">5. Pagos, planes y suscripciones</h2>
              <p>
                Los planes de pago, comisiones o tarifas aplicables se informan en la plataforma o en acuerdos comerciales.
                Salvo que se indique lo contrario por ley o por una política publicada, los cargos procesados no son reembolsables.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">6. Propiedad intelectual</h2>
              <p>
                El software, diseño, marca y contenidos propios de VIVENTA están protegidos por derechos de propiedad intelectual.
                No se autoriza su uso, copia o explotación sin permiso previo y por escrito.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">7. Limitación de responsabilidad</h2>
              <p>
                VIVENTA no garantiza que el servicio esté libre de interrupciones ni responde por decisiones comerciales tomadas
                por usuarios sobre la base de información de terceros. En la medida permitida por la ley, la responsabilidad total
                de VIVENTA se limita al monto efectivamente pagado por el usuario en los últimos 3 meses, si aplica.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">8. Protección de datos</h2>
              <p>
                El tratamiento de datos personales se rige por nuestra
                {' '}
                <a className="text-[#004AAD] hover:underline" href="/privacidad">Política de Privacidad</a>
                {' '}
                y por la normativa aplicable en República Dominicana.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">9. Cambios a estos términos</h2>
              <p>
                Podemos actualizar estos Términos para reflejar cambios operativos, legales o de seguridad. Cuando el cambio sea
                material, notificaremos por la plataforma, email o ambos.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">10. Contacto</h2>
              <p>
                Para soporte o temas legales: <a className="text-[#004AAD] hover:underline" href="mailto:info@viventa.com.do">info@viventa.com.do</a>.
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
