import Link from 'next/link'

type PriorityTone = 'good' | 'warn' | 'urgent' | 'neutral'

type PriorityItem = {
  label: string
  value: string | number
  hint?: string
  tone?: PriorityTone
}

type QuickAction = {
  label: string
  href: string
}

type WorkspaceCommandCenterProps = {
  eyebrow: string
  title: string
  description: string
  highlightLabel: string
  highlightValue: string | number
  highlightDetail: string
  marketNote?: string
  priorities: PriorityItem[]
  quickActions: QuickAction[]
}

const PRIORITY_STYLES: Record<PriorityTone, string> = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  urgent: 'border-rose-200 bg-rose-50 text-rose-900',
  neutral: 'border-slate-200 bg-slate-50 text-slate-900',
}

export default function WorkspaceCommandCenter({
  eyebrow,
  title,
  description,
  highlightLabel,
  highlightValue,
  highlightDetail,
  marketNote,
  priorities,
  quickActions,
}: WorkspaceCommandCenterProps) {
  return (
    <section className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-[#0B2545] text-white shadow-[0_24px_80px_-40px_rgba(11,37,69,0.9)]">
      <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)] lg:px-8 lg:py-8">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,166,166,0.35),_transparent_45%),linear-gradient(135deg,_rgba(19,64,116,0.96),_rgba(11,37,69,1))] p-6">
          <div className="absolute inset-0 opacity-20" aria-hidden>
            <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:22px_22px]" />
          </div>
          <div className="relative">
            <div className="mb-3 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
              {eyebrow}
            </div>
            <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">{title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-[15px]">{description}</p>

            <div className="mt-5 inline-flex min-w-[220px] flex-col rounded-2xl border border-cyan-300/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-[0.24em] text-cyan-100">{highlightLabel}</span>
              <span className="mt-2 text-3xl font-semibold text-white">{highlightValue}</span>
              <span className="mt-1 text-sm text-slate-200">{highlightDetail}</span>
            </div>

            {marketNote ? (
              <p className="mt-5 max-w-2xl text-sm leading-6 text-cyan-50/90">{marketNote}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Prioridades</h3>
              <span className="text-xs text-slate-400">Operacion en tiempo real</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {priorities.map((item) => {
                const tone = item.tone || 'neutral'

                return (
                  <div key={item.label} className={`rounded-2xl border px-4 py-3 ${PRIORITY_STYLES[tone]}`}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">{item.label}</div>
                    <div className="mt-2 text-2xl font-semibold">{item.value}</div>
                    {item.hint ? <div className="mt-1 text-xs opacity-75">{item.hint}</div> : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm sm:p-5">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-50">Accesos rapidos</div>
            <div className="flex flex-wrap gap-2.5">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-200/40 hover:bg-white/15"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}