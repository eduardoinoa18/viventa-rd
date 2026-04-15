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

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)] lg:px-8 lg:py-24">
        <div className="text-white">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur-sm">
            MLS + CRM + inteligencia de inversion para RD
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Descubre, analiza y negocia la mejor inversion inmobiliaria en
            <span className="block bg-gradient-to-r from-[#67E8F9] via-[#FDE68A] to-[#FDBA74] bg-clip-text text-transparent">
              Republica Dominicana
            </span>
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-100 sm:text-lg">
            VIVENTA une inventario verificado, constructoras, agentes, brokers y senales de demanda para que compradores e inversionistas tomen decisiones con criterio local, velocidad comercial y confianza operativa.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5 text-sm text-white/90">
            {['Santo Domingo', 'Punta Cana', 'Santiago', 'Cap Cana', 'Las Terrenas'].map((market) => (
              <span key={market} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                {market}
              </span>
            ))}
          </div>

          <div className="mt-8 max-w-3xl rounded-[26px] border border-white/15 bg-white/12 p-3 shadow-2xl backdrop-blur-md">
            <Link href="/search" className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-4 text-[#0B2545] transition hover:bg-slate-50 sm:px-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6FBFB] text-[#008C8C]">
                <FiSearch className="text-xl" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Busca por ciudad, proyecto, sector o perfil de inversion</div>
                <div className="truncate text-sm text-slate-500">Santo Domingo, Punta Cana, apartamento, preconstruccion, renta corta...</div>
              </div>
              <FiArrowRight className="hidden text-lg text-slate-400 sm:block" />
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/search" className="inline-flex items-center gap-2 rounded-full bg-[#F97316] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ea6a10]">
              Explorar oportunidades
              <FiArrowRight />
            </Link>
            <Link href="/agents" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Hablar con un asesor
            </Link>
            <Link href="/projects" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Ver proyectos nuevos
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-cyan-100"><FiCheckCircle /> Verificacion</div>
              <div className="mt-2 text-sm text-slate-100">Listados revisados, senales de calidad y equipos profesionales aprobados.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-cyan-100"><FiBarChart2 /> Inteligencia</div>
              <div className="mt-2 text-sm text-slate-100">Demand signals, comparables y contexto para compra patrimonial o renta.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-cyan-100"><FiCompass /> Ejecucion</div>
              <div className="mt-2 text-sm text-slate-100">Workspaces para agentes, brokers, constructoras y control maestro en una sola red.</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 self-end">
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
                <div className="mt-1 text-sm text-slate-300">Desde vivienda principal hasta renta corta, reventa y preconstruccion.</div>
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
