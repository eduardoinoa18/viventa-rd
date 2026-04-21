// components/HeroSection.tsx
'use client'

import Link from 'next/link'
import { FiArrowRight, FiBarChart2, FiCheckCircle, FiCompass, FiHome, FiSearch } from 'react-icons/fi'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#071a31]">
      <div className="absolute inset-0 bg-cover bg-center bg-[url('/hero-bg.jpg')]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,26,49,0.96),rgba(11,37,69,0.92),rgba(0,166,166,0.72))]" />
      </div>

      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute left-8 top-16 h-72 w-72 rounded-full bg-[#00A6A6] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#F97316] blur-3xl" />
      </div>

      <div className="absolute inset-0 opacity-[0.16]" aria-hidden>
        <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:26px_26px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-3 py-8 sm:px-6 sm:py-16 sm:gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)] lg:px-8 lg:py-24">
        <div className="text-white">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-tight text-cyan-100 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.2em]">
            MLS + CRM para RD
          </div>

          <h1 className="mt-3 max-w-3xl text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
            Descubre y negocia inversiones inmobiliarias
            <span className="block bg-gradient-to-r from-[#67E8F9] via-[#FDE68A] to-[#FDBA74] bg-clip-text text-transparent">
              en República Dominicana
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-100 sm:text-sm sm:mt-4 sm:leading-6 lg:text-base lg:leading-7">
            Inventario verificado, agentes y brokers. Decisiones locales con velocidad y confianza.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-white/90 sm:gap-2">
            {['Santo Domingo', 'Punta Cana', 'Santiago'].map((market) => (
              <span key={market} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 backdrop-blur-sm text-[10px] sm:px-3 sm:py-1.5 sm:text-xs">
                {market}
              </span>
            ))}
          </div>

          <div className="mt-4 max-w-2xl rounded-lg border border-white/15 bg-white/12 p-2 shadow-xl backdrop-blur-md sm:mt-6 sm:rounded-2xl sm:p-3">
            <Link href="/search" className="flex items-center gap-2 rounded-md bg-white px-2.5 py-2.5 text-[#0B2545] transition hover:bg-slate-50 sm:rounded-lg sm:px-3.5 sm:py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E6FBFB] text-[#008C8C] sm:h-9 sm:w-9 sm:rounded-xl">
                <FiSearch className="text-base sm:text-lg" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold sm:text-sm">Buscar propiedades</div>
                <div className="text-[10px] text-slate-500 sm:text-xs">Por ciudad, tipo, precio</div>
              </div>
            </Link>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:gap-2.5">
            <Link href="/search" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F97316] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#ea6a10] sm:px-4 sm:py-2.5 sm:text-sm">
              Explorar
              <FiArrowRight className="hidden sm:block" />
            </Link>
            <Link href="/agents" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 sm:px-4 sm:py-2.5 sm:text-sm">
              Agentes
            </Link>
            <Link href="/projects" className="hidden sm:inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">
              Proyectos
            </Link>
          </div>

          <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-2.5 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/10 p-2.5 backdrop-blur-sm sm:p-3 sm:rounded-xl">
              <div className="flex items-center gap-1.5 text-cyan-100 text-[10px] sm:text-xs"><FiCheckCircle className="text-[12px] sm:text-sm" /> Verificado</div>
              <div className="mt-1 text-[9px] text-slate-100 sm:mt-1.5 sm:text-xs">Inmuebles y profesionales aprobados.</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-2.5 backdrop-blur-sm sm:p-3 sm:rounded-xl">
              <div className="flex items-center gap-1.5 text-cyan-100 text-[10px] sm:text-xs"><FiBarChart2 className="text-[12px] sm:text-sm" /> Inteligencia</div>
              <div className="mt-1 text-[9px] text-slate-100 sm:mt-1.5 sm:text-xs">Datos y análisis mercado RD.</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-2.5 backdrop-blur-sm sm:p-3 sm:rounded-xl">
              <div className="flex items-center gap-1.5 text-cyan-100 text-[10px] sm:text-xs"><FiCompass className="text-[12px] sm:text-sm" /> Confianza</div>
              <div className="mt-1 text-[9px] text-slate-100 sm:mt-1.5 sm:text-xs">Red conectada y segura.</div>
            </div>
          </div>
        </div>

        {/* Right column — Radar widget (hidden on mobile, visible lg+) */}
        <div className="hidden lg:grid gap-4 self-end">
          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-md">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">Radar de oportunidad</div>
            <div className="mt-3 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#0B2545]/55 p-4">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span>Mercados en foco</span>
                  <FiHome className="text-cyan-200" />
                </div>
                <div className="mt-2 text-xl font-semibold">Santo Domingo, Punta Cana y Santiago</div>
                <div className="mt-1 text-sm text-slate-300">Inventario verificado, proyectos nuevos y demanda internacional activa.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0B2545]/55 p-4">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span>Perfil ideal</span>
                  <FiCompass className="text-amber-200" />
                </div>
                <div className="mt-2 text-xl font-semibold">Inversionistas, familias y compradores globales</div>
                <div className="mt-1 text-sm text-slate-300">Desde vivienda principal hasta renta corta, reventa y preconstrucción.</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link href="/professionals" className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white transition hover:bg-white/15">
              <div className="text-sm font-semibold">Para profesionales</div>
              <div className="mt-1 text-sm text-slate-200">CRM, tareas, pipeline y visibilidad MLS para agentes y brokers.</div>
            </Link>
            <Link href="/constructoras" className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white transition hover:bg-white/15">
              <div className="text-sm font-semibold">Para constructoras</div>
              <div className="mt-1 text-sm text-slate-200">Inventario, reservas, deals y demanda comercial en tiempo real.</div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
