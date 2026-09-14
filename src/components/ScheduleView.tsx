import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { pl } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  WEEKDAY_LABELS,
  cloneSchedule,
  getAvailabilityForDate,
  hasDateOverride,
  toDateKey,
  type DayAvailability,
  type SchedulesMap,
  type StylistSchedule,
  type Weekday,
} from '../schedule'
import { STYLISTS, type StylistId } from '../types'
import { Field, btnGhost, btnPrimary, btnSecondary, inputClass } from './ui'

type ScheduleViewProps = {
  schedules: SchedulesMap
  onUpdate: (stylistId: StylistId, schedule: StylistSchedule) => void
}

export function ScheduleView({ schedules, onUpdate }: ScheduleViewProps) {
  const [activeId, setActiveId] = useState<StylistId>('ania')
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(() => new Date())
  const [savedFlash, setSavedFlash] = useState(false)
  const [showWeekly, setShowWeekly] = useState(false)

  const schedule = schedules[activeId]
  const selectedKey = toDateKey(selected)
  const selectedAvail = getAvailabilityForDate(schedule, selected)
  const isOverride = hasDateOverride(schedule, selected)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  function selectStylist(id: StylistId) {
    setActiveId(id)
    setSavedFlash(false)
  }

  function saveDateAvail(patch: Partial<DayAvailability>) {
    const next = cloneSchedule(schedules[activeId])
    const current = getAvailabilityForDate(next, selected)
    next.dates[selectedKey] = { ...current, ...patch }
    onUpdate(activeId, next)
    setSavedFlash(true)
  }

  function clearDateOverride() {
    const next = cloneSchedule(schedules[activeId])
    delete next.dates[selectedKey]
    onUpdate(activeId, next)
    setSavedFlash(true)
  }

  function setDayOff() {
    saveDateAvail({ enabled: false })
  }

  function setWorking() {
    const base = getAvailabilityForDate(schedule, selected)
    saveDateAvail({
      enabled: true,
      start: base.enabled ? base.start : '09:00',
      end: base.enabled ? base.end : '17:00',
    })
  }

  function patchWeekly(day: Weekday, patch: Partial<DayAvailability>) {
    const next = cloneSchedule(schedules[activeId])
    next.weekly[day] = { ...next.weekly[day], ...patch }
    onUpdate(activeId, next)
    setSavedFlash(true)
  }

  const stylist = STYLISTS.find((s) => s.id === activeId)!
  const overrideCount = Object.keys(schedule.dates).length

  const upcomingOverrides = useMemo(() => {
    return Object.entries(schedule.dates)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([date]) => date >= toDateKey(new Date()))
      .slice(0, 12)
  }, [schedule.dates])

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Grafik dostępności
        </h1>
        <p className="mt-1 text-ink-muted">
          Ustaw dostępność na konkretne dni kalendarza. Domyślny tydzień działa
          jako baza, gdy dzień nie ma własnego ustawienia.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {STYLISTS.map((s) => {
          const active = s.id === activeId
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectStylist(s.id)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? 'text-white shadow-md'
                  : 'bg-surface text-ink-muted hover:bg-mist hover:text-ink'
              }`}
              style={active ? { backgroundColor: s.color } : undefined}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.2)' : s.color,
                  color: '#fff',
                }}
              >
                {s.shortName[0]}
              </span>
              {s.name}
            </button>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-line/80 bg-surface p-5 shadow-sm shadow-ink/5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl font-display text-lg font-semibold text-white"
                style={{ backgroundColor: stylist.color }}
              >
                {stylist.shortName[0]}
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {stylist.name}
                </h2>
                <p className="text-xs text-ink-muted">
                  {overrideCount} dni z własnym grafikiem
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={btnGhost}
                onClick={() => setMonth((m) => startOfMonth(addDays(m, -15)))}
                aria-label="Poprzedni miesiąc"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-32 text-center font-display text-lg font-semibold capitalize text-ink">
                {format(month, 'LLLL yyyy', { locale: pl })}
              </span>
              <button
                type="button"
                className={btnGhost}
                onClick={() =>
                  setMonth((m) => startOfMonth(addDays(endOfMonth(m), 1)))
                }
                aria-label="Następny miesiąc"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = toDateKey(day)
              const inMonth = isSameMonth(day, month)
              const active = isSameDay(day, selected)
              const today = isToday(day)
              const override = hasDateOverride(schedule, key)
              const avail = getAvailabilityForDate(schedule, key)

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelected(day)
                    setSavedFlash(false)
                  }}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition ${
                    active
                      ? 'text-white shadow-md'
                      : inMonth
                        ? 'text-ink hover:bg-mist'
                        : 'text-ink-muted/35 hover:bg-fog'
                  } ${today && !active ? 'ring-1 ring-sand-deep/70 ring-inset' : ''}`}
                  style={active ? { backgroundColor: stylist.color } : undefined}
                >
                  <span className="font-semibold">{format(day, 'd')}</span>
                  {inMonth && (
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                        active
                          ? 'bg-white'
                          : !avail.enabled
                            ? 'bg-blush/70'
                            : override
                              ? ''
                              : 'bg-leaf/50'
                      }`}
                      style={
                        !active && avail.enabled && override
                          ? { backgroundColor: stylist.color }
                          : undefined
                      }
                    />
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: stylist.color }}
              />
              Własny grafik dnia
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-leaf/50" />
              Z domyślnego tygodnia
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blush/70" />
              Dzień wolny
            </span>
          </div>
        </section>

        <section className="rounded-3xl border border-line/80 bg-surface p-5 shadow-sm shadow-ink/5">
          <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
            Wybrany dzień
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold capitalize text-ink">
            {format(selected, 'EEEE, d MMMM yyyy', { locale: pl })}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {isOverride
              ? 'Ustawienie dla tej konkretnej daty'
              : 'Dziedziczy z domyślnego tygodnia — zapisz, aby nadpisać ten dzień'}
          </p>

          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={
                  selectedAvail.enabled
                    ? btnPrimary
                    : `${btnSecondary} opacity-70`
                }
                onClick={setWorking}
              >
                Pracuje
              </button>
              <button
                type="button"
                className={
                  !selectedAvail.enabled
                    ? btnPrimary
                    : `${btnSecondary} opacity-70`
                }
                onClick={setDayOff}
              >
                Dzień wolny
              </button>
            </div>

            {selectedAvail.enabled && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Od">
                  <input
                    type="time"
                    className={inputClass}
                    value={selectedAvail.start}
                    onChange={(e) => saveDateAvail({ start: e.target.value, enabled: true })}
                  />
                </Field>
                <Field label="Do">
                  <input
                    type="time"
                    className={inputClass}
                    value={selectedAvail.end}
                    onChange={(e) => saveDateAvail({ end: e.target.value, enabled: true })}
                  />
                </Field>
              </div>
            )}

            {isOverride && (
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-medium text-blush hover:underline"
                onClick={clearDateOverride}
              >
                <Trash2 className="h-4 w-4" />
                Usuń ustawienie dnia (wróć do tygodnia)
              </button>
            )}

            {savedFlash && (
              <p className="text-sm font-medium text-forest">Zapisano</p>
            )}
          </div>

          {upcomingOverrides.length > 0 && (
            <div className="mt-6 border-t border-line/60 pt-4">
              <p className="mb-2 text-xs font-semibold tracking-widest text-ink-muted uppercase">
                Najbliższe własne dni
              </p>
              <ul className="space-y-1.5">
                {upcomingOverrides.map(([date, avail]) => (
                  <li key={date}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-mist"
                      onClick={() => {
                        setSelected(new Date(date + 'T12:00:00'))
                        setMonth(startOfMonth(new Date(date + 'T12:00:00')))
                        setSavedFlash(false)
                      }}
                    >
                      <span className="font-medium text-ink">
                        {format(new Date(date + 'T12:00:00'), 'd MMM yyyy', {
                          locale: pl,
                        })}
                      </span>
                      <span className="text-ink-muted">
                        {avail.enabled
                          ? `${avail.start}–${avail.end}`
                          : 'wolne'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-line/80 bg-surface shadow-sm shadow-ink/5">
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          onClick={() => setShowWeekly((v) => !v)}
        >
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">
              Domyślny tydzień
            </h3>
            <p className="text-sm text-ink-muted">
              Baza dla dni bez własnego ustawienia kalendarzowego
            </p>
          </div>
          <span className="text-ink-muted">{showWeekly ? '▲' : '▼'}</span>
        </button>

        {showWeekly && (
          <div className="divide-y divide-line/60 border-t border-line/60">
            {WEEKDAY_LABELS.map(({ day, label }) => {
              const row = schedule.weekly[day]
              return (
                <div
                  key={day}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) =>
                        patchWeekly(day, { enabled: e.target.checked })
                      }
                      className="h-4 w-4 accent-[var(--color-forest)]"
                    />
                    <span className="min-w-32 font-semibold text-ink">
                      {label}
                    </span>
                  </label>
                  {row.enabled ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Field label="Od">
                        <input
                          type="time"
                          className={`${inputClass} py-2`}
                          value={row.start}
                          onChange={(e) =>
                            patchWeekly(day, { start: e.target.value })
                          }
                        />
                      </Field>
                      <span className="pt-5 text-ink-muted">—</span>
                      <Field label="Do">
                        <input
                          type="time"
                          className={`${inputClass} py-2`}
                          value={row.end}
                          onChange={(e) =>
                            patchWeekly(day, { end: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                  ) : (
                    <span className="rounded-full bg-fog px-3 py-1.5 text-xs font-semibold text-ink-muted">
                      Dzień wolny
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
