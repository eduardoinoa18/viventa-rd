// app/confianza/page.tsx
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FiCheckCircle, FiShield, FiUsers, FiFileText, FiStar, FiPhone } from 'react-icons/fi';

export const metadata = {
  title: 'Confianza y Seguridad | VIVENTA',
  description: 'Descubre cómo VIVENTA verifica agentes y propiedades para garantizar transacciones seguras en República Dominicana',
};

export default function ConfianzaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#0B2545] to-[#00A6A6] py-16 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShield className="text-5xl" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Confianza y Seguridad</h1>
            <p className="text-xl text-gray-100 max-w-2xl mx-auto">
              En VIVENTA, tu seguridad es nuestra prioridad. Conoce cómo verificamos cada agente y propiedad.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          {/* Our Verification Process */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-[#0B2545] mb-8 text-center">
              Nuestro Proceso de Verificación
            </h2>

            {/* Agent Verification */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00A6A6] to-[#00C8C8] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FiUsers className="text-white text-3xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#0B2545] mb-4">Verificación de Agentes</h3>
                  <p className="text-gray-600 mb-4 text-lg">
                    Todos los agentes inmobiliarios en VIVENTA pasan por un riguroso proceso de verificación:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <FiCheckCircle className="text-green-500 text-xl flex-shrink-0 mt-1" />
                      <div>
                        <strong className="text-[#0B2545]">Verificación de Identidad:</strong> Documentos oficiales revisados manualmente
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <FiCheckCircle className="text-green-500 text-xl flex-shrink-0 mt-1" />
                      <div>
                        <strong className="text-[#0B2545]">Licencia Profesional:</strong> Confirmación de registro activo como agente inmobiliario
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <FiCheckCircle className="text-green-500 text-xl flex-shrink-0 mt-1" />
                      <div>
                        <strong className="text-[#0B2545]">Verificación Telefónica:</strong> Confirmación de número de contacto mediante SMS
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <FiCheckCircle className="text-green-500 text-xl flex-shrink-0 mt-1" />
                      <div>
                        <strong className="text-[#0B2545]">Historial Profesional:</strong> Revisión de antecedentes y experiencia
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Property Verification */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#FF8C35] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FiFileText className="text-white text-3xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#0B2545] mb-4">Verificación de Propiedades</h3>
                  <p className="text-gray-600 mb-4 text-lg">
                    Cada propiedad publicada es revisada cuidadosamente para garantizar autenticidad:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <FiCheckCircle className="text-green-500 text-xl flex-shrink-0 mt-1" />
                      <div>
                        <strong className="text-[#0B2545]">Documentación Revisada:</strong> Verificación de documentos de propiedad (cuando disponibles)
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <FiCheckCircle className="text-green-500 text-xl flex-shrink-0 mt-1" />
                      <div>
                        <strong className="text-[#0B2545]">Fotos Auténticas:</strong> Confirmación de que las imágenes son reales (no stock photos)
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <FiCheckCircle className="text-green-500 text-xl flex-shrink-0 mt-1" />
                      <div>
                        <strong className="text-[#0B2545]">Precio Razonable:</strong> Validación de que el precio está dentro del rango del mercado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <FiCheckCircle className="text-green-500 text-xl flex-shrink-0 mt-1" />
                      <div>
                        <strong className="text-[#0B2545]">Ubicación Confirmada:</strong> Coordenadas GPS y dirección verificadas
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Why Verification Matters */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-[#0B2545] mb-8 text-center">
              ¿Por qué la Verificación es Importante?
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border-2 border-blue-100">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                  <FiShield className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-3">Protección al Comprador</h3>
                <p className="text-gray-600">
                  Evita fraudes y estafas al trabajar solo con agentes y propiedades verificadas por nuestro equipo.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border-2 border-green-100">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <FiCheckCircle className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-3">Profesionalismo Garantizado</h3>
                <p className="text-gray-600">
                  Asegura que trabajes con profesionales calificados que conocen el mercado dominicano.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border-2 border-purple-100">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                  <FiStar className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-3">Información Confiable</h3>
                <p className="text-gray-600">
                  Datos de precio, ubicación y características verificados para tomar decisiones informadas.
                </p>
              </div>
            </div>
          </div>

          {/* How to Identify Verified Listings */}
          <div className="mb-16 bg-gradient-to-br from-[#0B2545] to-[#00A6A6] rounded-3xl p-8 md:p-12 text-white">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Cómo Identificar Listados Verificados
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-500 px-4 py-2 rounded-lg flex items-center gap-2">
                      <FiCheckCircle />
                      <span className="font-bold text-sm">VERIFICADA</span>
                    </div>
                  </div>
                  <p className="text-gray-100">
                    Las propiedades verificadas muestran esta insignia verde en la esquina superior izquierda de la foto.
                  </p>
                </div>
              </div>

              <div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-500 px-4 py-2 rounded-full flex items-center gap-2">
                      <FiCheckCircle />
                      <span className="font-bold text-sm">Agente Verificado</span>
                    </div>
                  </div>
                  <p className="text-gray-100">
                    Los agentes verificados tienen esta insignia visible en su perfil y en todos sus listados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Issues CTA */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <FiPhone className="text-5xl text-[#00A6A6] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#0B2545] mb-4">¿Detectaste algo sospechoso?</h2>
              <p className="text-gray-600 mb-6 text-lg">
                Si encuentras una propiedad o agente que parece fraudulento, repórtalo de inmediato. Revisamos cada reporte en 24 horas.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00A6A6] to-[#00C8C8] text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                <FiPhone />
                Reportar un problema
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
