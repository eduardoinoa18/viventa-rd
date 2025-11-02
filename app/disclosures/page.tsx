"use client";
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DisclosuresPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-blue-50 via-white to-teal-50 border-b">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Avisos Legales</h1>
            <p className="text-gray-600">Transparencia y cumplimiento para nuestros usuarios en República Dominicana</p>
          </div>
        </section>

        <section className="py-10">
          <div className="max-w-4xl mx-auto px-4 space-y-10 text-gray-800">
            <div>
              <h2 className="text-xl font-semibold mb-3">1. Información General</h2>
              <p className="text-gray-700">VIVENTA es una plataforma digital para búsqueda y promoción de propiedades en República Dominicana. La información publicada proviene de agentes, corredores y desarrolladores aliados. Hacemos esfuerzos razonables para verificar la calidad y actualidad del contenido, pero algunos datos pueden ser referenciales y estar sujetos a cambios sin previo aviso.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">2. Exactitud de la Información</h2>
              <p className="text-gray-700">Las características, precios, disponibilidad y condiciones de las propiedades son responsabilidad de los anunciantes correspondientes. Recomendamos confirmar detalles clave (precio actual, estatus legal, HOA, metrajes, amenidades, restricciones, etc.) antes de tomar decisiones. VIVENTA no garantiza la exactitud de terceros y no asume responsabilidad por omisiones o errores.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">3. Relación Comercial y Comisiones</h2>
              <p className="text-gray-700">VIVENTA puede mantener acuerdos comerciales con agentes, brokers y desarrolladores para la promoción de inventario y generación de prospectos. Dichos acuerdos no alteran la imparcialidad de la experiencia del usuario. Las comisiones y honorarios —cuando apliquen— son acordados directamente entre las partes involucradas en cada operación.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">4. Privacidad y Tratamiento de Datos</h2>
              <p className="text-gray-700">Protegemos los datos personales conforme a la legislación vigente en República Dominicana y estándares internacionales. La información de contacto que compartes al enviar formularios se utiliza para gestionar tu solicitud y ofrecerte asesoría. Puedes solicitar la actualización o eliminación de tus datos contactándonos.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">5. Cookies y Tecnologías Similares</h2>
              <p className="text-gray-700">Usamos cookies para mejorar tu experiencia, recordar preferencias y medir rendimiento. Puedes administrar o deshabilitar cookies desde la configuración de tu navegador. Algunas funciones del sitio podrían verse limitadas al desactivarlas.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">6. Propiedad Intelectual</h2>
              <p className="text-gray-700">Las marcas, logotipos, textos, imágenes y demás contenidos de VIVENTA están protegidos por las leyes de propiedad intelectual. Queda prohibida su reproducción o uso no autorizado. El contenido de terceros pertenece a sus respectivos titulares y se publica con licencias o permisos correspondientes.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">7. Enlaces a Terceros</h2>
              <p className="text-gray-700">El sitio puede contener enlaces a páginas externas. VIVENTA no controla ni es responsable de su contenido, políticas o prácticas. Te recomendamos revisar sus condiciones antes de utilizar dichos servicios.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">8. Limitación de Responsabilidad</h2>
              <p className="text-gray-700">En la medida permitida por la ley, VIVENTA no será responsable por pérdidas o daños derivados del uso del sitio, la información publicada o transacciones con terceros. El uso de la plataforma es bajo tu propio riesgo y criterio.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">9. Contacto</h2>
              <p className="text-gray-700">Para consultas o solicitudes relacionadas con estos avisos, escríbenos a <a className="text-[#004AAD] hover:underline" href="mailto:info@viventa.com.do">info@viventa.com.do</a>.</p>
            </div>

            <div className="text-xs text-gray-500">
              Última actualización: Octubre 2025
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
