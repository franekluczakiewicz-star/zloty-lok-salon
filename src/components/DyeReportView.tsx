import {
  addWeeks,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { pl } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SalonStore } from '../hooks/useSalonStore'
import {
  formatDyeAmount,
  isColoringService,
  type Appointment,
} from '../types'
import { btnGhost } from './ui'

type DyeReportViewProps = {
  store: SalonStore
}

type DyeBucket = {
  color: string
  grams: number
  visits: number
}

function weekBounds(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  const end = endOfWeek(anchor, { weekStartsOn: 1 })
  return { start, end }
}

function dayKey(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

function inWeek(dateStr: string, start: Date, end: Date) {
  try {
    const d = parseISO(dateStr)
    return isWithinInterval(d, { start, end })
  } catch {
    return false
  }
}

function aggregateByColor(apts: Appointment[]): DyeBucket[] {
  const map = new Map<string, DyeBucket>()
  for (const apt of apts) {
    const color = (apt.dyeColor ?? '').trim() || 'Bez nazwy'
    const grams = apt.dyeAmountG ?? 0
    const prev = map.get(color) ?? { color, grams: 0, visits: 0 }
    prev.grams += grams
    prev.visits += 1
    map.set(color, prev)
  }
  return [...map.values()].sort((a, b) => b.grams - a.grams || a.color.localeCompare(b.color))
}

function totalGrams(buckets: DyeBucket[]) {
  return buckets.reduce((sum, b) => sum + b.grams, 0)
}

export function DyeReportView({ store }: DyeReportViewProps) {
  const [weekAnchor, setWeekAnchor] = useState(() => new Date())
  const { start, end } = weekBounds(weekAnchor)

  const coloring = useMemo(
    () =>
      store.appointments.filter(
        (a) =>
          a.status !== 'cancelled' &&
          isColoringService(a.serviceName, store.catalog) &&
          Boolean(a.dyeColor?.trim() || (a.dyeAmountG && a.dyeAmountG > 0)),
      ),
    [store.appointments, store.catalog],
  )

  const usedThisWeek = useMemo(() => {
    const today = dayKey(new Date())
    return coloring.filter((a) => {
      if (!inWeek(a.date, start, end)) return false
      // zużyte: wykonane albo już minęły
      return a.status === 'done' || a.date <= today
    })
  }, [coloring, start, end])

  const neededThisWeek = useMemo(() => {
    const today = dayKey(new Date())
    return coloring.filter((a) => {
      if (!inWeek(a.date, start, end)) return false
      return a.status === 'planned' && a.date > today
    })
  }, [coloring, start, end])

  const futureWeeks = useMemo(() => {
    return [1, 2, 3].map((offset) => {
      const anchor = addWeeks(weekAnchor, offset)
      const bounds = weekBounds(anchor)
      const apts = coloring.filter(
        (a) =>
          a.status === 'planned' &&
          inWeek(a.date, bounds.start, bounds.end),
      )
      return {
        offset,
        ...bounds,
        buckets: aggregateByColor(apts),
        appointments: apts,
      }
    })
  }, [coloring, weekAnchor])

  const usedBuckets = aggregateByColor(usedThisWeek)
  const neededBuckets = aggregateByColor(neededThisWeek)
  const weekLabel = `${format(start, 'd MMM', { locale: pl })} – ${format(end, 'd MMM yyyy', { locale: pl })}`

  return (
    <div className="animate-fade-up space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Raport farb
          </h1>
          <p className="mt-1 text-ink-muted">
            Zużycie i zapotrzebowanie na farby z wizyt koloryzacji.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={btnGhost}
            aria-label="Poprzedni tydzień"
            onClick={() => setWeekAnchor((d) => addWeeks(d, -1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="min-w-[11rem] text-center text-sm font-semibold text-ink capitalize">
            {weekLabel}
          </p>
          <button
            type="button"
            className={btnGhost}
            aria-label="Następny tydzień"
            onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-xs font-semibold text-forest hover:bg-mist"
            onClick={() => setWeekAnchor(new Date())}
          >
            Ten tydzień
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="Zużyte w tym tygodniu"
          subtitle="Wykonane lub już minione wizyty z farbą"
          buckets={usedBuckets}
          empty="Brak zużycia farb w tym tygodniu."
        />
        <ReportCard
          title="Potrzebne jeszcze w tym tygodniu"
          subtitle="Zaplanowane wizyty koloryzacji do końca tygodnia"
          buckets={neededBuckets}
          empty="Nic już nie zaplanowano na ten tydzień."
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Zapotrzebowanie na przyszłe tygodnie
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {futureWeeks.map((week) => (
            <div
              key={week.offset}
              className="rounded-3xl border border-line/80 bg-surface p-5"
            >
              <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
                +{week.offset} tydzień
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-ink">
                {format(week.start, 'd MMM', { locale: pl })} –{' '}
                {format(week.end, 'd MMM', { locale: pl })}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-forest">
                {formatDyeAmount(totalGrams(week.buckets))}
              </p>
              {week.buckets.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">Brak zaplanowanych farb.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {week.buckets.map((b) => (
                    <li
                      key={b.color}
                      className="flex items-baseline justify-between gap-2 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium text-ink">
                        {b.color}
                      </span>
                      <span className="shrink-0 text-ink-muted">
                        {formatDyeAmount(b.grams)}
                        <span className="text-ink-muted/70"> · {b.visits}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {(usedThisWeek.length > 0 || neededThisWeek.length > 0) && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Wizyty w wybranym tygodniu
          </h2>
          <ul className="divide-y divide-line/60 overflow-hidden rounded-3xl border border-line/80 bg-surface">
            {[...usedThisWeek, ...neededThisWeek]
              .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
              .map((apt) => (
                <li
                  key={apt.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{apt.personName}</p>
                    <p className="text-ink-muted">
                      {apt.date} · {apt.time} · {apt.serviceName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-forest">
                      {apt.dyeColor || '—'}
                    </p>
                    <p className="text-ink-muted">
                      {formatDyeAmount(apt.dyeAmountG ?? 0)}
                      {apt.status === 'done'
                        ? ' · zużyte'
                        : apt.date <= dayKey(new Date())
                          ? ' · zużyte'
                          : ' · potrzebne'}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ReportCard({
  title,
  subtitle,
  buckets,
  empty,
}: {
  title: string
  subtitle: string
  buckets: DyeBucket[]
  empty: string
}) {
  return (
    <div className="rounded-3xl border border-line/80 bg-surface p-5 shadow-sm shadow-ink/5">
      <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
        {title}
      </p>
      <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
      <p className="mt-3 font-display text-3xl font-semibold text-forest">
        {formatDyeAmount(totalGrams(buckets))}
      </p>
      {buckets.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {buckets.map((b) => (
            <li
              key={b.color}
              className="flex items-baseline justify-between gap-3 border-b border-line/40 pb-2 last:border-0 last:pb-0"
            >
              <span className="min-w-0 truncate font-medium text-ink">{b.color}</span>
              <span className="shrink-0 text-sm text-ink-muted">
                {formatDyeAmount(b.grams)}
                <span className="text-ink-muted/70"> · {b.visits} wiz.</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
