'use client'
// components/CommandPalette.tsx
// Global ⌘K / Ctrl+K command palette with dynamic data search.
//
// Keyboard shortcuts:
//   ⌘K / Ctrl+K  → open
//   ↑ / ↓         → navigate results
//   Enter          → execute selected
//   Esc            → close

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  FiSearch, FiX, FiArrowRight,
  FiHome, FiUsers, FiTrendingUp, FiGrid, FiActivity, FiPlusSquare,
  FiUser, FiTarget, FiBarChart2, FiLayers, FiDollarSign,
} from 'react-icons/fi'
import type { SearchResultItem } from '@/app/api/search/route'

// ── Command registry ──────────────────────────────────────────────────────────

type Command = {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  href?: string
  action?: () => void
  group: string
  keywords?: string
}

const COMMANDS: Command[] = [
  // Navigate
  { id: 'goto-broker',          group: 'Navigate', label: 'Broker Workspace',    description: 'Open broker overview',        icon: <FiGrid />,       href: '/dashboard/broker/overview',       keywords: 'broker workspace home' },
  { id: 'goto-broker-pipeline', group: 'Navigate', label: 'Deal Pipeline',       description: 'Broker Kanban pipeline',      icon: <FiTrendingUp />, href: '/dashboard/broker/pipeline',       keywords: 'pipeline deals kanban broker' },
  { id: 'goto-agent',           group: 'Navigate', label: 'Agent Workspace',     description: 'Open agent overview',         icon: <FiGrid />,       href: '/dashboard/agent/overview',        keywords: 'agent workspace home' },
  { id: 'goto-constructora',    group: 'Navigate', label: 'Constructora',        description: 'Open constructora overview',  icon: <FiGrid />,       href: '/dashboard/constructora/overview', keywords: 'constructora builder developer' },
  { id: 'goto-master',          group: 'Navigate', label: 'Master Admin',        description: 'Open admin dashboard',        icon: <FiGrid />,       href: '/master',                          keywords: 'admin master platform' },
  { id: 'goto-listings',        group: 'Navigate', label: 'Listings',            description: 'View all property listings',  icon: <FiHome />,       href: '/dashboard/listings',              keywords: 'listings properties homes' },
  { id: 'goto-search',          group: 'Navigate', label: 'Property Search',     description: 'Search the marketplace',      icon: <FiSearch />,     href: '/search',                          keywords: 'search find property' },
  { id: 'goto-crm-broker',      group: 'Navigate', label: 'Broker CRM',          description: 'Leads & pipeline',            icon: <FiTarget />,     href: '/dashboard/broker/crm',            keywords: 'crm leads pipeline broker' },
  { id: 'goto-crm-agent',       group: 'Navigate', label: 'Agent CRM',           description: 'Agent leads',                 icon: <FiTarget />,     href: '/dashboard/agent/crm',             keywords: 'crm leads agent' },
  { id: 'goto-transactions',    group: 'Navigate', label: 'Transactions',        description: 'Broker transaction board',    icon: <FiTrendingUp />, href: '/dashboard/broker/transactions',   keywords: 'deals transactions broker' },
  { id: 'goto-team',            group: 'Navigate', label: 'Team / Agents',       description: 'Manage your agent team',      icon: <FiUsers />,      href: '/dashboard/broker/team',           keywords: 'team agents members' },
  { id: 'goto-activity-broker', group: 'Navigate', label: 'Broker Activity',     description: 'Activity feed',               icon: <FiActivity />,   href: '/dashboard/broker/activity',       keywords: 'activity events feed broker' },
  { id: 'goto-activity-master', group: 'Navigate', label: 'Platform Activity',   description: 'Master admin activity feed',  icon: <FiActivity />,   href: '/master/activity',                 keywords: 'activity events feed admin' },
  { id: 'goto-messages',        group: 'Navigate', label: 'Messages',            description: 'Open messaging',              icon: <FiUsers />,      href: '/messages',                        keywords: 'messages chat inbox' },
  { id: 'goto-favorites',       group: 'Navigate', label: 'Favorites',           description: 'Saved properties',            icon: <FiHome />,       href: '/favorites',                       keywords: 'favorites saved bookmarks' },
  { id: 'goto-billing',         group: 'Navigate', label: 'Billing',             description: 'Subscription & payments',     icon: <FiBarChart2 />,  href: '/dashboard/billing',               keywords: 'billing subscription payments plan' },
  // Actions
  { id: 'action-create-listing', group: 'Actions', label: 'Create Listing',      description: 'Add a new property',          icon: <FiPlusSquare />, href: '/dashboard/listings/create',       keywords: 'create new listing property add' },
  { id: 'action-create-deal',    group: 'Actions', label: 'Create Deal',         description: 'Start a new transaction',     icon: <FiPlusSquare />, href: '/dashboard/broker/transactions',   keywords: 'create deal transaction new' },
  { id: 'action-invite-agent',   group: 'Actions', label: 'Invite Agent',        description: 'Add an agent to your office', icon: <FiUsers />,      href: '/dashboard/broker/team',           keywords: 'invite agent add member' },
  // Account
  { id: 'account-profile',      group: 'Account',  label: 'My Profile',         description: 'Edit your profile',           icon: <FiUser />,       href: '/dashboard/settings',              keywords: 'profile settings account me' },
  { id: 'account-public-site',  group: 'Account',  label: 'Public Site',        description: 'Go to VIVENTA marketplace',   icon: <FiHome />,       href: '/',                                keywords: 'public marketplace site home' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function score(cmd: Command, query: string): boolean {
  const q = query.toLowerCase()
  return (
    cmd.label.toLowerCase().includes(q) ||
    (cmd.description?.toLowerCase().includes(q) ?? false) ||
    (cmd.keywords?.toLowerCase().includes(q) ?? false) ||
    cmd.group.toLowerCase().includes(q)
  )
}

function grouped(commands: Command[]): { group: string; items: Command[] }[] {
  const map = new Map<string, Command[]>()
  for (const cmd of commands) {
    if (!map.has(cmd.group)) map.set(cmd.group, [])
    map.get(cmd.group)!.push(cmd)
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }))
}

const RESULT_ICONS: Record<SearchResultItem['type'], React.ReactNode> = {
  listing: <FiHome />,
  deal:    <FiDollarSign />,
  project: <FiLayers />,
  client:  <FiUser />,
}

const RESULT_GROUPS: Record<SearchResultItem['type'], string> = {
  listing: 'Listings',
  deal:    'Deals',
  project: 'Projects',
  client:  'Clients',
}

const LIVE_GROUPS = new Set(['Listings', 'Deals', 'Projects', 'Clients'])

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Dynamic search state
  const [dynamicResults, setDynamicResults] = useState<SearchResultItem[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Static command filter ─────────────────────────────────────────────────
  const filteredStatic = query.trim() === '' ? COMMANDS : COMMANDS.filter((c) => score(c, query))

  // ── Convert dynamic results → Command-like objects ────────────────────────
  const dynamicCommands: Command[] = dynamicResults.map((r) => ({
    id: `dynamic-${r.type}-${r.id}`,
    label: r.title,
    description: [r.subtitle, r.meta].filter(Boolean).join(' · ') || undefined,
    icon: RESULT_ICONS[r.type],
    href: r.href,
    group: RESULT_GROUPS[r.type],
    keywords: '',
  }))

  // When query >= 2 show dynamic results first, then matching static commands
  const allCommands: Command[] = query.length >= 2
    ? [...dynamicCommands, ...filteredStatic]
    : filteredStatic

  const groups = grouped(allCommands)
  const flat = allCommands

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setSelectedIndex(0)
    setDynamicResults([])
  }, [])

  const execute = useCallback(
    (cmd: Command) => {
      close()
      if (cmd.action) { cmd.action(); return }
      if (cmd.href) router.push(cmd.href)
    },
    [close, router],
  )

  // ── Debounced dynamic search ──────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setDynamicResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
        const body = await res.json().catch(() => ({ ok: false }))
        if (body.ok) setDynamicResults(body.results ?? [])
      } catch { /* silent */ } finally {
        setSearching(false)
      }
    }, 280)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // ── Global keyboard listener ──────────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const trigger = isMac ? e.metaKey : e.ctrlKey
      if (trigger && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => {
          if (!prev) {
            setQuery('')
            setSelectedIndex(0)
            setDynamicResults([])
          }
          return !prev
        })
      }
      if (!open) return
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flat.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (flat[selectedIndex]) execute(flat[selectedIndex])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, flat, selectedIndex, close, execute])

  // Auto-focus on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0) }, [query])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/40 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="mx-4 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <FiSearch className={`shrink-0 transition-colors ${searching ? 'text-[#00A676] animate-pulse' : 'text-gray-400'}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search deals, listings, projects or jump to…"
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
          />
          {query && (
            <button
              aria-label="Clear search"
              onClick={() => { setQuery(''); setDynamicResults([]) }}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX />
            </button>
          )}
          <kbd className="hidden rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 sm:block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Skeleton while first fetch */}
          {searching && dynamicResults.length === 0 && (
            <div className="space-y-1.5 px-3 py-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="h-6 w-6 animate-pulse rounded-lg bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {allCommands.length === 0 && !searching ? (
            <div className="py-10 text-center text-sm text-gray-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            groups.map(({ group, items }) => {
              let globalOffset = 0
              for (const g of groups) {
                if (g.group === group) break
                globalOffset += g.items.length
              }
              const isLive = LIVE_GROUPS.has(group)
              return (
                <div key={group} className="mb-2">
                  <div className="mb-1 flex items-center gap-2 px-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{group}</span>
                    {isLive && (
                      <span className="rounded-full bg-[#00A676]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#00A676]">
                        LIVE
                      </span>
                    )}
                  </div>
                  {items.map((cmd, localIdx) => {
                    const globalIdx = globalOffset + localIdx
                    const isSelected = selectedIndex === globalIdx
                    return (
                      <button
                        key={cmd.id}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => execute(cmd)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#00A676] to-[#008F64] text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="shrink-0 text-lg">{cmd.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{cmd.label}</span>
                          {cmd.description && (
                            <span className={`block truncate text-xs ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                              {cmd.description}
                            </span>
                          )}
                        </span>
                        <FiArrowRight className={`shrink-0 text-sm ${isSelected ? 'text-white/80' : 'text-gray-300'}`} />
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-gray-100 px-4 py-2 text-[10px] text-gray-400">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
          {query.length >= 2 && (
            <span className="ml-auto text-[#00A676]">Searching deals, listings &amp; projects…</span>
          )}
        </div>
      </div>
    </div>
  )
}
