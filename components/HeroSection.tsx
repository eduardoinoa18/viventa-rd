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

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)] lg:px-8 lg:py-24">
        <div className="text-white">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.24em]">
            MLS + CRM + inteligencia de inversión para RD
          </div>

          <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Descubre, analiza y negocia la mejor inversion inmobiliaria en
            <span className="block bg-gradient-to-r from-[#67E8F9] via-[#FDE68A] to-[#FDBA74] bg-clip-text text-transparent">
              República Dominicana
            </span>
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-100 sm:text-base sm:mt-5 lg:text-lg">
            VIVENTA une inventario verificado, constructoras, agentes, brokers y señales de demanda para que compradores e inversionistas tomen decisiones con criterio local, velocidad comercial y confianza operativa.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-sm text-white/90 sm:gap-2.5">
            {['Santo Domingo', 'Punta Cana', 'Santiago', 'Cap Cana', 'Las Terrenas'].map((market) => (
              <span key={market} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                {market}
              </span>
            ))}
          </div>

          <div className="mt-5 max-w-3xl rounded-[22px] border border-white/15 bg-white/12 p-2.5 shadow-2xl backdrop-blur-md sm:mt-8 sm:rounded-[26px] sm:p-3">
            <Link href="/search" className="flex items-center gap-3 rounded-[18px] bg-white px-3 py-3.5 text-[#0B2545] transition hover:bg-slate-50 sm:rounded-[20px] sm:px-5 sm:py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E6FBFB] text-[#008C8C] sm:h-11 sm:w-11 sm:rounded-2xl">
                <FiSearch className="text-lg sm:text-xl" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Busca por ciudad, proyecto, sector o perfil de inversión</div>
                <div className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">Santo Domingo, Punta Cana, apartamento, preconstruccion...</div>
              </div>
              <FiArrowRight className="hidden shrink-0 text-lg text-slate-400 sm:block" />
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            <Link href="/search" className="inline-flex items-center gap-2 rounded-full bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea6a10] sm:px-5 sm:py-3">
              Explorar oportunidades
              <FiArrowRight />
            </Link>
            <Link href="/agents" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 sm:px-5 sm:py-3">
              Hablar con un asesor
            </Link>
            <Link href="/projects" className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Ver proyectos nuevos
            </Link>
          </div>

          <div className="mt-6 grid gap-2 sm:mt-8 sm:gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
              <div className="flex items-center gap-2 text-cyan-100 text-sm"><FiCheckCircle /> Verificación</div>
              <div className="mt-1.5 text-xs text-slate-100 sm:mt-2 sm:text-sm">Listados revisados, señales de calidad y equipos profesionales aprobados.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
              <div className="flex items-center gap-2 text-cyan-100 text-sm"><FiBarChart2 /> Inteligencia</div>
              <div className="mt-1.5 text-xs text-slate-100 sm:mt-2 sm:text-sm">Demand signals, comparables y contexto para compra patrimonial o renta.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
              <div className="flex items-center gap-2 text-cyan-100 text-sm"><FiCompass /> Ejecución</div>
              <div className="mt-1.5 text-xs text-slate-100 sm:mt-2 sm:text-sm">Workspaces para agentes, brokers, constructoras y control maestro en una sola red.</div>
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
