'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  FiHome,
  FiHeart,
  FiSearch,
  FiMessageCircle,
  FiUser,
  FiBell,
  FiArrowRight,
  FiTrash2,
  FiPlus,
  FiTrendingUp,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiLogOut,
  FiSettings,
  FiEdit2,
  FiChevronRight,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi'
import { getSession, clearSession } from '@/lib/authSession'
import { getSavedPropertyIds, toggleSavedProperty } from '@/lib/buyerPreferences'
import { useSavedSearches, buildSavedSearchUrl } from '@/hooks/useSavedSearches'

type Tab = 'home' | 'saved' | 'searches' | 'messages' | 'profile'

type SessionData = {
  uid: string
  role: string
  name?: string
  email?: string
  photo?: string
}

type PropertyItem = {
  id: string
  title?: string
  price?: number
  currency?: 'USD' | 'DOP'
  city?: string
  sector?: string
  bedrooms?: number
  bathrooms?: number
  areaMt2?: number
  propertyType?: string
  listingType?: string
  images?: string[]
  status?: string
  verified?: boolean
  createdAt?: unknown
}

type RecommendedProperty = PropertyItem

type MessageSummary = {
  totalConversations: number
  unreadMessages: number
  latestConversationAt: string | null
}

type MarketCitySnapshot = {
  city: string
  activeListings: number
  averagePriceLabel: string
}

function formatPrice(price?: number, currency?: string): string {
  if (!price) return '—'
  const formatter = new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return formatter.format(price)
}

function toMillis(value: unknown): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate()
    return parsed instanceof Date ? parsed.getTime() : 0
  }
  const parsed = new Date(value as string)
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0
}

function formatShortDate(value: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })
}

// ─── Tab Navigation ──────────────────────────────────────────────────────────
function BuyerTabBar({
  active,
  onChange,
  unreadMessages,
}: {
  active: Tab
  onChange: (t: Tab) => void
  unreadMessages: number
}) {
  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <FiHome />, label: 'Inicio' },
    { id: 'saved', icon: <FiHeart />, label: 'Guardados' },
    { id: 'searches', icon: <FiSearch />, label: 'Búsquedas' },
    { id: 'messages', icon: <FiMessageCircle />, label: 'Mensajes' },
    { id: 'profile', icon: <FiUser />, label: 'Perfil' },
  ]
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-area-pb md:hidden">
      <div className="grid grid-cols-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] relative ${
              active === t.id ? 'text-[#00A6A6]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-xl relative">
              {t.icon}
              {t.id === 'messages' && unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium leading-none">{t.label}</span>
            {active === t.id && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-[#00A6A6] rounded-b-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar({
  active,
  onChange,
  session,
  unreadMessages,
}: {
  active: Tab
  onChange: (t: Tab) => void
  session: SessionData | null
  unreadMessages: number
}) {
  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <FiHome />, label: 'Mi Panel' },
    { id: 'saved', icon: <FiHeart />, label: 'Guardados' },
    { id: 'searches', icon: <FiSearch />, label: 'Mis Búsquedas' },
    { id: 'messages', icon: <FiMessageCircle />, label: 'Mensajes' },
    { id: 'profile', icon: <FiUser />, label: 'Mi Perfil' },
  ]
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen sticky top-0 h-screen overflow-y-auto">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00A6A6] to-[#0B2545] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {session?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[#0B2545] text-sm truncate">{session?.name || 'Comprador'}</div>
            <div className="text-xs text-gray-500 truncate">{session?.email || ''}</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left relative ${
              active === t.id
                ? 'bg-[#E6FBFB] text-[#00A6A6]'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-base">{t.icon}</span>
            {t.label}
            {t.id === 'messages' && unreadMessages > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <Link
          href="/search"
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#0B2545] text-white text-sm font-semibold hover:bg-[#133a66] transition-colors"
        >
          <FiSearch className="text-base" />
          Buscar propiedades
        </Link>
      </div>
    </aside>
  )
}

// ─── Property Save Card ───────────────────────────────────────────────────────
function SavedPropertyCard({
  property,
  onRemove,
}: {
  property: PropertyItem
  onRemove: (id: string) => void
}) {
  const img = property.images?.[0] || '/placeholder.png'
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        <Image src={img} alt={property.title || 'Propiedad'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        <button
          type="button"
          onClick={() => onRemove(property.id)}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 text-red-500 hover:bg-red-50 transition-colors shadow-sm"
          aria-label="Quitar de guardados"
        >
          <FiHeart className="text-base fill-current" />
        </button>
        {property.verified && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-green-600/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <FiCheckCircle className="text-[10px]" /> Verificado
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="font-semibold text-[#0B2545] text-sm leading-snug line-clamp-2">
          {property.title || 'Propiedad sin título'}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <FiMapPin className="shrink-0" />
          <span className="truncate">{[property.sector, property.city].filter(Boolean).join(', ') || 'República Dominicana'}</span>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="font-bold text-[#0B2545] text-base">
            {formatPrice(property.price, property.currency)}
          </span>
          <Link
            href={`/listing/${property.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#00A6A6] hover:underline"
          >
            Ver <FiArrowRight />
          </Link>
        </div>
        {(property.bedrooms || property.bathrooms || property.areaMt2) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            {property.bedrooms ? <span>{property.bedrooms} hab.</span> : null}
            {property.bathrooms ? <span>{property.bathrooms} baños</span> : null}
            {property.areaMt2 ? <span>{property.areaMt2} m²</span> : null}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────
function HomeTab({
  session,
  savedCount,
  searchesCount,
  savedProperties,
  recommended,
  recommendedLoading,
  unreadNotifications,
  newListingsCount,
  marketCities,
  onTabChange,
}: {
  session: SessionData | null
  savedCount: number
  searchesCount: number
  savedProperties: PropertyItem[]
  recommended: RecommendedProperty[]
  recommendedLoading: boolean
  unreadNotifications: number
  newListingsCount: number
  marketCities: MarketCitySnapshot[]
  onTabChange: (t: Tab) => void
}) {
  const firstName = session?.name?.split(' ')[0] || 'Comprador'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-5 pb-4">
      {/* Greeting hero */}
      <div className="bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#00A6A6] rounded-2xl p-5 text-white shadow-md">
        <div className="text-sm text-white/70 font-medium">{greeting}</div>
        <h1 className="mt-0.5 text-2xl font-bold">{firstName} 👋</h1>
        <p className="mt-1 text-sm text-white/80">
          {savedCount === 0 && searchesCount === 0
            ? 'Empieza guardando propiedades y búsquedas de tu interés.'
            : `Tienes ${savedCount} ${savedCount === 1 ? 'propiedad guardada' : 'propiedades guardadas'} y ${searchesCount} ${searchesCount === 1 ? 'búsqueda activa' : 'búsquedas activas'}.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-[#0B2545] px-4 py-2.5 text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            <FiSearch /> Buscar propiedades
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15 transition-colors"
          >
            <FiTrendingUp /> Ver proyectos
          </Link>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15 transition-colors"
          >
            <FiBell /> {unreadNotifications} alerta{unreadNotifications === 1 ? '' : 's'}
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onTabChange('saved')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="text-2xl font-bold text-[#0B2545]">{savedCount}</div>
          <div className="mt-0.5 text-xs text-gray-500 leading-tight">Guardados</div>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('searches')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="text-2xl font-bold text-[#0B2545]">{searchesCount}</div>
          <div className="mt-0.5 text-xs text-gray-500 leading-tight">Búsquedas</div>
        </button>
        <Link
          href="/search?sort=newest"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow block"
        >
          <div className="text-2xl font-bold text-[#00A6A6]">{newListingsCount}</div>
          <div className="mt-0.5 text-xs text-gray-500 leading-tight">Nuevos hoy</div>
        </Link>
      </div>

      {/* CTA if nothing saved */}
      {savedCount === 0 && searchesCount === 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <FiAlertCircle className="text-amber-500 text-lg shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900 text-sm">Completa tu perfil de búsqueda</div>
            <p className="text-xs text-amber-700 mt-1">
              Guarda tu primera búsqueda para recibir alertas de nuevas propiedades que coincidan.
            </p>
            <Link href="/search" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 underline underline-offset-2">
              Ir a buscar <FiArrowRight />
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-semibold text-[#0B2545] text-sm">Acciones rápidas</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { href: '/search', icon: <FiSearch />, label: 'Buscar propiedades', sub: 'Filtra por ciudad, tipo y precio' },
            { href: '/agents', icon: <FiUser />, label: 'Conectar con un agente', sub: 'Agentes verificados en tu ciudad' },
            { href: '/projects', icon: <FiTrendingUp />, label: 'Ver proyectos nuevos', sub: 'Preconstrucción y desarrollos activos' },
            { href: '/comparison', icon: <FiCheckCircle />, label: 'Comparar propiedades', sub: 'Analiza lado a lado' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6FBFB] text-[#00A6A6] text-base shrink-0">
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#0B2545]">{item.label}</div>
                <div className="text-xs text-gray-500 truncate">{item.sub}</div>
              </div>
              <FiChevronRight className="text-gray-300 group-hover:text-gray-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recommended properties */}
      {(recommended.length > 0 || recommendedLoading) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#0B2545] text-sm">Recomendadas para ti</h2>
            <Link href="/search" className="text-xs text-[#00A6A6] font-medium">
              Ver todas
            </Link>
          </div>
          {recommendedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommended.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/listing/${p.id}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="relative h-36 w-full bg-gray-100 overflow-hidden">
                    <Image
                      src={p.images?.[0] || '/placeholder.png'}
                      alt={p.title || ''}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold text-[#0B2545] line-clamp-1">{p.title || 'Propiedad'}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <FiMapPin className="shrink-0" />
                      <span className="truncate">{p.city || 'RD'}</span>
                    </div>
                    <div className="mt-1.5 font-bold text-[#0B2545] text-base">{formatPrice(p.price, p.currency)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent saved preview */}
      {savedProperties.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#0B2545] text-sm">Guardados recientemente</h2>
            <button type="button" onClick={() => onTabChange('saved')} className="text-xs text-[#00A6A6] font-medium">
              Ver todos
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
            {savedProperties.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                href={`/listing/${p.id}`}
                className="flex-none w-44 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden snap-start hover:shadow-md transition-shadow group"
              >
                <div className="relative h-28 w-full bg-gray-100 overflow-hidden">
                  <Image src={p.images?.[0] || '/placeholder.png'} alt={p.title || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-semibold text-[#0B2545] line-clamp-1">{p.title || 'Propiedad'}</div>
                  <div className="mt-0.5 text-xs font-bold text-[#00A6A6]">{formatPrice(p.price, p.currency)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Market pulse */}
      <div className="bg-gradient-to-r from-[#071a31] to-[#0B2545] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-cyan-200">Pulso del mercado RD</div>
          <div className="text-[10px] text-white/55">Basado en listados activos actuales</div>
        </div>
        {marketCities.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            {marketCities.map((market) => (
              <div key={market.city}>
                <div className="text-[10px] text-white/60 truncate">{market.city}</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">{market.activeListings}</div>
                <div className="text-[10px] text-white/50 truncate">{market.averagePriceLabel}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-white/70">Todavía no hay suficiente data activa para mostrar ciudades destacadas.</div>
        )}
        <Link href="/search" className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-200 font-medium hover:text-white transition-colors">
          Explorar oportunidades <FiArrowRight />
        </Link>
      </div>
    </div>
  )
}

// ─── Saved Properties Tab ─────────────────────────────────────────────────────
function SavedTab({
  properties,
  loading,
  onRemove,
}: {
  properties: PropertyItem[]
  loading: boolean
  onRemove: (id: string) => void
}) {
  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#0B2545] text-lg">Propiedades guardadas</h2>
        <Link href="/search" className="inline-flex items-center gap-1 text-sm text-[#00A6A6] font-medium">
          <FiPlus /> Agregar
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <FiHeart className="text-4xl text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-[#0B2545]">Aún no tienes guardadas</h3>
          <p className="text-sm text-gray-500 mt-1">
            Toca el ❤️ en cualquier propiedad para guardarla aquí.
          </p>
          <Link href="/search" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2545] text-white text-sm font-semibold">
            <FiSearch /> Explorar propiedades
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <SavedPropertyCard key={p.id} property={p} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Saved Searches Tab ───────────────────────────────────────────────────────
function SearchesTab({
  searches,
  loading,
  onRemove,
}: {
  searches: any[]
  loading: boolean
  onRemove: (id: string) => void
}) {
  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#0B2545] text-lg">Mis búsquedas</h2>
        <Link href="/search" className="inline-flex items-center gap-1 text-sm text-[#00A6A6] font-medium">
          <FiPlus /> Nueva
        </Link>
      </div>

      {/* Info banner */}
      <div className="bg-[#E6FBFB] border border-[#00A6A6]/20 rounded-2xl p-3.5 flex items-start gap-3">
        <FiBell className="text-[#00A6A6] text-lg shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-[#0B2545]">Alertas activas</div>
          <p className="text-xs text-gray-600 mt-0.5">
            Te notificamos cuando aparezcan nuevas propiedades que coincidan con tus criterios.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <FiSearch className="text-4xl text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-[#0B2545]">No tienes búsquedas guardadas</h3>
          <p className="text-sm text-gray-500 mt-1">
            Desde la búsqueda, guarda tus criterios para recibir alertas de nuevas propiedades.
          </p>
          <Link href="/search" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2545] text-white text-sm font-semibold">
            <FiSearch /> Ir a buscar
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => {
            const c = s.criteria || {}
            const tags = [
              c.city,
              c.sector,
              c.propertyType,
              c.listingType === 'sell' ? 'En venta' : c.listingType === 'rent' ? 'En alquiler' : null,
              c.priceMin ? `Desde ${formatPrice(c.priceMin, 'USD')}` : null,
              c.priceMax ? `Hasta ${formatPrice(c.priceMax, 'USD')}` : null,
              c.bedroomsMin ? `${c.bedroomsMin}+ hab.` : null,
            ].filter(Boolean)
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0B2545] text-sm truncate">{s.label || 'Búsqueda guardada'}</div>
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((tag, i) => (
                          <span key={i} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
                      <FiCalendar />
                      {new Date(s.createdAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href={buildSavedSearchUrl(s)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#00A6A6] px-3 py-1.5 rounded-lg border border-[#00A6A6]/30 hover:bg-[#E6FBFB] transition-colors"
                    >
                      Ver <FiArrowRight />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onRemove(s.id)}
                      aria-label={`Eliminar búsqueda ${s.label || ''}`}
                      className="inline-flex items-center gap-1 text-xs text-red-500 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {searches.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-sm font-semibold text-[#0B2545] mb-2">Administrar alertas</div>
          <p className="text-xs text-gray-500 mb-3">
            Gestiona todas tus alertas avanzadas desde la página de búsquedas guardadas.
          </p>
          <Link href="/dashboard/saved-searches" className="inline-flex items-center gap-2 text-sm font-medium text-[#00A6A6] hover:underline">
            Gestionar alertas <FiArrowRight />
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────
function MessagesTab({ summary }: { summary: MessageSummary }) {
  return (
    <div className="space-y-4 pb-4">
      <h2 className="font-bold text-[#0B2545] text-lg">Mensajes</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <FiMessageCircle className="text-4xl text-gray-200 mx-auto mb-3" />
        <h3 className="font-semibold text-[#0B2545]">Centro de mensajes</h3>
        <p className="text-sm text-gray-500 mt-1">
          {summary.totalConversations > 0
            ? `Tienes ${summary.totalConversations} conversación${summary.totalConversations === 1 ? '' : 'es'} activa${summary.totalConversations === 1 ? '' : 's'} y ${summary.unreadMessages} mensaje${summary.unreadMessages === 1 ? '' : 's'} sin leer.`
            : 'Todas tus conversaciones con agentes y propiedades en un solo lugar.'}
        </p>
        {summary.latestConversationAt ? (
          <p className="text-xs text-gray-400 mt-2">Última actividad: {formatShortDate(summary.latestConversationAt)}</p>
        ) : null}
        <Link href="/messages" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2545] text-white text-sm font-semibold">
          <FiMessageCircle /> Abrir mensajes
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <div className="text-sm font-semibold text-[#0B2545]">Contactar un agente</div>
          <p className="text-xs text-gray-500 mt-0.5">Conéctate con un profesional verificado en tu mercado.</p>
        </div>
        <Link href="/agents" className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-t border-gray-50">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6FBFB] text-[#00A6A6]">
            <FiUser />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#0B2545]">Directorio de agentes</div>
            <div className="text-xs text-gray-500">Expertos verificados en toda RD</div>
          </div>
          <FiChevronRight className="text-gray-300" />
        </Link>
        <Link href="/contact" className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-t border-gray-50">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6FBFB] text-[#00A6A6]">
            <FiMessageCircle />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#0B2545]">Soporte VIVENTA</div>
            <div className="text-xs text-gray-500">¿Tienes preguntas? Escríbenos.</div>
          </div>
          <FiChevronRight className="text-gray-300" />
        </Link>
      </div>
    </div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ session, onLogout }: { session: SessionData | null; onLogout: () => void }) {
  return (
    <div className="space-y-4 pb-4">
      <h2 className="font-bold text-[#0B2545] text-lg">Mi Perfil</h2>

      {/* Avatar & name */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#00A6A6] to-[#0B2545] flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {session?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#0B2545] text-base truncate">{session?.name || 'Comprador'}</div>
          <div className="text-sm text-gray-500 truncate">{session?.email || ''}</div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs text-green-700 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
            Cuenta activa
          </div>
        </div>
        <Link href="/dashboard/settings" className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <FiEdit2 />
        </Link>
      </div>

      {/* Menu items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {[
          { href: '/dashboard/settings', icon: <FiSettings />, label: 'Configuración de cuenta', sub: 'Perfil, notificaciones, privacidad' },
          { href: '/notifications', icon: <FiBell />, label: 'Notificaciones', sub: 'Alertas y mensajes del sistema' },
          { href: '/dashboard/saved-searches', icon: <FiSearch />, label: 'Alertas de búsqueda', sub: 'Gestiona tus criterios guardados' },
          { href: '/comparison', icon: <FiCheckCircle />, label: 'Comparar propiedades', sub: 'Analiza propiedades lado a lado' },
          { href: '/contact', icon: <FiMessageCircle />, label: 'Ayuda y soporte', sub: 'Contacta a nuestro equipo' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 shrink-0">
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#0B2545]">{item.label}</div>
              <div className="text-xs text-gray-500 truncate">{item.sub}</div>
            </div>
            <FiChevronRight className="text-gray-300 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Mortgage calculator CTA */}
      <div className="bg-gradient-to-r from-[#0B2545] to-[#134074] rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 shrink-0">
            <FiDollarSign className="text-xl" />
          </div>
          <div>
            <div className="font-semibold text-sm">Calculadora hipotecaria</div>
            <div className="text-xs text-white/70 mt-0.5">Estima tu cuota mensual para RD.</div>
          </div>
        </div>
        <Link href="/search#mortgage" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-200 hover:text-white">
          Abrir calculadora <FiArrowRight />
        </Link>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-red-100 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
      >
        <FiLogOut />
        Cerrar sesión
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BuyerDashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([])
  const [savedProperties, setSavedProperties] = useState<PropertyItem[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(false)
  const [recommended, setRecommended] = useState<RecommendedProperty[]>([])
  const [recommendedLoading, setRecommendedLoading] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [newListingsCount, setNewListingsCount] = useState(0)
  const [marketCities, setMarketCities] = useState<MarketCitySnapshot[]>([])
  const [messageSummary, setMessageSummary] = useState<MessageSummary>({
    totalConversations: 0,
    unreadMessages: 0,
    latestConversationAt: null,
  })

  const { searches: savedSearches, loading: searchesLoading, removeSearch } = useSavedSearches({
    autoLoad: Boolean(session?.uid),
  })

  // Load session
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.ok) {
          router.replace('/login?redirect=/dashboard/buyer')
          return
        }
        const s = json.session as SessionData
        // Only buyers
        if (s.role !== 'buyer' && s.role !== 'user') {
          router.replace('/dashboard')
          return
        }
        setSession(s)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  // Load saved property IDs
  useEffect(() => {
    if (!session) return
    setSavedPropertyIds(getSavedPropertyIds())
  }, [session])

  // Load saved property details
  useEffect(() => {
    if (!savedPropertyIds.length) {
      setSavedProperties([])
      return
    }
    let active = true
    const load = async () => {
      setPropertiesLoading(true)
      const results = await Promise.all(
        savedPropertyIds.map(async (id) => {
          const res = await fetch(`/api/properties/${encodeURIComponent(id)}`, { cache: 'no-store' })
          const json = await res.json().catch(() => ({}))
          if (!res.ok || !json?.ok || !json?.data) return null
          return json.data as PropertyItem
        })
      )
      if (!active) return
      setSavedProperties(results.filter(Boolean) as PropertyItem[])
      setPropertiesLoading(false)
    }
    load()
    return () => { active = false }
  }, [savedPropertyIds])

  // Load recommended properties
  useEffect(() => {
    if (!session) return
    let active = true
    const load = async () => {
      setRecommendedLoading(true)
      try {
        const [propertiesRes, activityRes, conversationsRes] = await Promise.all([
          fetch('/api/properties?limit=100&sort=newest', { cache: 'no-store' }),
          fetch('/api/activity-events/summary', { cache: 'no-store' }),
          fetch('/api/messages/conversations', { cache: 'no-store' }),
        ])

        const [propertiesJson, activityJson, conversationsJson] = await Promise.all([
          propertiesRes.json().catch(() => ({})),
          activityRes.json().catch(() => ({})),
          conversationsRes.json().catch(() => ({})),
        ])
        if (!active) return

        const properties = Array.isArray(propertiesJson?.properties)
          ? propertiesJson.properties
          : Array.isArray(propertiesJson?.data)
            ? propertiesJson.data
            : []
        const savedIds = new Set(savedPropertyIds)
        setRecommended(properties.filter((property: PropertyItem) => !savedIds.has(property.id)).slice(0, 6))

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        setNewListingsCount(
          properties.filter((property: PropertyItem) => toMillis(property.createdAt) >= today.getTime()).length
        )

        const marketByCity = new Map<string, { count: number; prices: number[] }>()
        properties.forEach((property: PropertyItem) => {
          const city = String(property.city || '').trim()
          if (!city) return
          const bucket = marketByCity.get(city) || { count: 0, prices: [] }
          bucket.count += 1
          if (typeof property.price === 'number' && Number.isFinite(property.price) && property.price > 0) {
            bucket.prices.push(property.price)
          }
          marketByCity.set(city, bucket)
        })

        setMarketCities(
          Array.from(marketByCity.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3)
            .map(([city, data]) => {
              const avgPrice = data.prices.length
                ? Math.round(data.prices.reduce((sum, value) => sum + value, 0) / data.prices.length)
                : undefined
              return {
                city,
                activeListings: data.count,
                averagePriceLabel: avgPrice ? `Prom. ${formatPrice(avgPrice, 'USD')}` : 'Sin precio promedio',
              }
            })
        )

        if (activityRes.ok && activityJson?.ok) {
          setUnreadNotifications(Number(activityJson?.summary?.unreadNotifications || 0))
        } else {
          setUnreadNotifications(0)
        }

        if (conversationsRes.ok && conversationsJson?.ok) {
          const nextSummary = {
            totalConversations: Number(conversationsJson?.summary?.totalConversations || 0),
            unreadMessages: Number(conversationsJson?.summary?.unreadMessages || 0),
            latestConversationAt: typeof conversationsJson?.summary?.latestConversationAt === 'string'
              ? conversationsJson.summary.latestConversationAt
              : null,
          }
          setMessageSummary(nextSummary)
          setUnreadMessages(nextSummary.unreadMessages)
        } else {
          setMessageSummary({ totalConversations: 0, unreadMessages: 0, latestConversationAt: null })
          setUnreadMessages(0)
        }
      } catch {
        if (!active) return
        setRecommended([])
        setNewListingsCount(0)
        setMarketCities([])
        setUnreadNotifications(0)
        setMessageSummary({ totalConversations: 0, unreadMessages: 0, latestConversationAt: null })
        setUnreadMessages(0)
      } finally {
        if (active) setRecommendedLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [session, savedPropertyIds])

  const handleRemoveSaved = useCallback((id: string) => {
    toggleSavedProperty(id)
    setSavedPropertyIds((prev) => prev.filter((x) => x !== id))
    setSavedProperties((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    window.location.href = '/'
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-[#00A6A6] border-t-transparent animate-spin" />
          <div className="text-sm text-gray-500">Cargando tu panel...</div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <DesktopSidebar
        active={activeTab}
        onChange={setActiveTab}
        session={session}
        unreadMessages={unreadMessages}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00A6A6] to-[#0B2545] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {session.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="font-semibold text-[#0B2545] text-sm truncate max-w-[140px]">
                {session.name?.split(' ')[0] || 'Mi Panel'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/notifications" className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Notificaciones">
                <FiBell className="text-lg" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>
              <Link href="/search" className="p-2 rounded-xl bg-[#0B2545] text-white" aria-label="Buscar">
                <FiSearch className="text-base" />
              </Link>
            </div>
          </div>

          {/* Mobile tab labels */}
          <div className="px-4 pb-2 flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {(['home', 'saved', 'searches', 'messages', 'profile'] as Tab[]).map((t) => {
              const labels: Record<Tab, string> = {
                home: 'Inicio',
                saved: 'Guardados',
                searches: 'Búsquedas',
                messages: 'Mensajes',
                profile: 'Perfil',
              }
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeTab === t
                      ? 'bg-[#0B2545] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {labels[t]}
                </button>
              )
            })}
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex items-center justify-between sticky top-0 z-40 bg-white border-b border-gray-100 px-8 py-4">
          <h1 className="text-lg font-bold text-[#0B2545]">
            {activeTab === 'home' && 'Mi Panel'}
            {activeTab === 'saved' && 'Propiedades Guardadas'}
            {activeTab === 'searches' && 'Mis Búsquedas'}
            {activeTab === 'messages' && 'Mensajes'}
            {activeTab === 'profile' && 'Mi Perfil'}
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Notificaciones">
              <FiBell className="text-lg" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>
            <Link href="/search" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B2545] text-white text-sm font-semibold hover:bg-[#133a66] transition-colors">
              <FiSearch /> Buscar
            </Link>
          </div>
        </header>

        {/* Tab content */}
        <main className="px-4 py-5 sm:px-6 md:px-8 max-w-5xl mx-auto pb-24 md:pb-8">
          {activeTab === 'home' && (
            <HomeTab
              session={session}
              savedCount={savedPropertyIds.length}
              searchesCount={savedSearches.length}
              savedProperties={savedProperties}
              recommended={recommended}
              recommendedLoading={recommendedLoading}
              unreadNotifications={unreadNotifications}
              newListingsCount={newListingsCount}
              marketCities={marketCities}
              onTabChange={setActiveTab}
            />
          )}
          {activeTab === 'saved' && (
            <SavedTab
              properties={savedProperties}
              loading={propertiesLoading}
              onRemove={handleRemoveSaved}
            />
          )}
          {activeTab === 'searches' && (
            <SearchesTab
              searches={savedSearches}
              loading={searchesLoading}
              onRemove={removeSearch}
            />
          )}
          {activeTab === 'messages' && <MessagesTab summary={messageSummary} />}
          {activeTab === 'profile' && (
            <ProfileTab session={session} onLogout={handleLogout} />
          )}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BuyerTabBar active={activeTab} onChange={setActiveTab} unreadMessages={unreadMessages} />
    </div>
  )
}
