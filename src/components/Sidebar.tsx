import { CalendarDays, Clock3, History, Palette, Receipt, Scissors, Search, Users } from 'lucide-react'
import { STYLISTS, type View } from '../types'

type SidebarProps = {
  view: View
  onNavigate: (view: View) => void
  stats: {
    clientsCount: number
    todayCount: number
    totalServices: number
  }
}

export function Sidebar({ view, onNavigate, stats }: SidebarProps) {
  const nav = [
    { id: 'clients' as const, label: 'Klienci', icon: Users },
    { id: 'calendar' as const, label: 'Terminarze', icon: CalendarDays },
    { id: 'schedule' as const, label: 'Grafik', icon: Clock3 },
    { id: 'prices' as const, label: 'Cennik', icon: Receipt },
    { id: 'dyes' as const, label: 'Farby', icon: Palette },
    { id: 'history' as const, label: 'Historia', icon: History },
  ]

  return (
    <aside className="flex w-full flex-col gap-8 lg:w-64 lg:shrink-0">
      <div className="animate-fade-up">
        <div className="mb-1 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-sand shadow-lg shadow-forest/25">
            <Scissors className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-forest">
              Złoty Lok
            </p>
            <p className="text-xs text-ink-muted">Salon fryzjerski</p>
            <p className="mt-1 text-[10px] font-semibold tracking-wide text-leaf uppercase">
              Wersja 15.09.2026
            </p>
          </div>
        </div>
      </div>

      <div className="animate-fade-up stagger-1 rounded-3xl border border-line/80 bg-surface/80 p-4 backdrop-blur">
        <p className="mb-3 text-xs font-semibold tracking-widest text-ink-muted uppercase">
          Fryzjerki
        </p>
        <ul className="space-y-2.5">
          {STYLISTS.map((stylist) => (
            <li key={stylist.id} className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-semibold text-white"
                style={{ backgroundColor: stylist.color }}
              >
                {stylist.shortName[0].toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{stylist.name}</p>
                <p className="text-xs text-ink-muted">fryzjerka</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <nav className="animate-fade-up stagger-1 flex flex-wrap gap-2 lg:flex-col">
        {nav.map(({ id, label, icon: Icon }) => {
          const active =
            view === id || (view === 'client-detail' && id === 'clients')
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition lg:flex-none ${
                active
                  ? 'bg-forest text-sand shadow-md shadow-forest/20'
                  : 'bg-surface/70 text-ink-muted hover:bg-surface hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="animate-fade-up stagger-2 hidden space-y-3 lg:block">
        <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
          Dziś
        </p>
        <div className="space-y-2 rounded-3xl border border-line/80 bg-surface/80 p-4 backdrop-blur">
          <StatRow label="Wizyty" value={String(stats.todayCount)} />
        </div>
        <div className="rounded-3xl bg-forest p-4 text-sand">
          <Search className="mb-2 h-4 w-4 opacity-70" />
          <p className="font-display text-lg leading-snug">
            Szukaj klienta po numerze telefonu
          </p>
          <p className="mt-1 text-xs text-sand/70">
            Wpisz cyfry w polu wyszukiwania — działa od razu.
          </p>
        </div>
      </div>
    </aside>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="font-display text-xl font-semibold text-forest">{value}</span>
    </div>
  )
}
