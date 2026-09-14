import { addDays, format, isToday, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Check, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { SalonStore } from '../hooks/useSalonStore'
import {
  getAvailabilityForDate,
  isSlotAvailable,
  timeToMinutes as toMin,
  unavailableBlocks,
  type StylistSchedule,
} from '../schedule'
import {
  STYLISTS,
  formatPrice,
  type Appointment,
  type AppointmentStatus,
  type Stylist,
  type StylistId,
} from '../types'
import { AppointmentForm } from './AppointmentForm'
import { btnGhost, btnPrimary } from './ui'

const DAY_START_H = 8
const DAY_END_H = 20
const HOUR_PX = 64
const DAY_MINUTES = (DAY_END_H - DAY_START_H) * 60
const GRID_HEIGHT = (DAY_END_H - DAY_START_H) * HOUR_PX

type CalendarViewProps = {
  store: SalonStore
  initialClientId?: string | null
  onInitialClientConsumed?: () => void
}

type BookingState = {
  stylistId?: StylistId
  date: string
  time?: string
  clientId?: string
}

export function CalendarView({
  store,
  initialClientId,
  onInitialClientConsumed,
}: CalendarViewProps) {
  const [day, setDay] = useState(() => new Date())
  const [booking, setBooking] = useState<BookingState | null>(null)
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null)

  useEffect(() => {
    if (!initialClientId) return
    setBooking({
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '10:00',
      clientId: initialClientId,
    })
    onInitialClientConsumed?.()
  }, [initialClientId, onInitialClientConsumed])

  const dayKey = format(day, 'yyyy-MM-dd')

  const dayAppointments = useMemo(
    () =>
      store.appointments.filter(
        (a) => a.date === dayKey && a.status !== 'cancelled',
      ),
    [store.appointments, dayKey],
  )

  const byStylist = useMemo(() => {
    const map: Record<StylistId, Appointment[]> = {
      ania: [],
      ewa: [],
      roksana: [],
    }
    for (const apt of dayAppointments) {
      map[apt.stylistId]?.push(apt)
    }
    for (const id of Object.keys(map) as StylistId[]) {
      map[id].sort((a, b) => a.time.localeCompare(b.time))
    }
    return map
  }, [dayAppointments])

  const selectedApt = selectedAptId
    ? store.appointments.find((a) => a.id === selectedAptId)
    : null

  return (
    <div className="animate-fade-up space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Terminarze
          </h1>
          <p className="mt-1 text-ink-muted">
            Widok dzienny — zajętość i plan wizyt jak w Outlooku.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() =>
              setBooking({
                date: dayKey,
                time: '10:00',
              })
            }
          >
            <Plus className="h-4 w-4" />
            Dodaj nową wizytę
          </button>

          <div className="flex items-center gap-1 rounded-2xl border border-line/80 bg-surface p-1 shadow-sm shadow-ink/5">
            <button
              type="button"
              className={btnGhost}
              onClick={() => setDay((d) => addDays(d, -1))}
              aria-label="Poprzedni dzień"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-48 px-2 text-center">
              <p className="font-display text-lg font-semibold capitalize text-ink">
                {format(day, 'EEEE', { locale: pl })}
              </p>
              <p className="text-xs text-ink-muted">
                {format(day, 'd MMMM yyyy', { locale: pl })}
                {isToday(day) ? ' · dziś' : ''}
              </p>
            </div>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setDay(new Date())}
            >
              Dziś
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setDay((d) => addDays(d, 1))}
              aria-label="Następny dzień"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-sm shadow-ink/5">
        <div className="grid grid-cols-[56px_repeat(3,minmax(0,1fr))] border-b border-line/70 bg-fog/60">
          <div className="border-r border-line/50" />
            {STYLISTS.map((stylist) => {
              const avail = getAvailabilityForDate(
                store.schedules[stylist.id],
                day,
              )
              const busy = busyMinutes(byStylist[stylist.id])
              const workSpan = avail.enabled
                ? Math.max(0, toMin(avail.end) - toMin(avail.start))
                : 0
              const pct =
                workSpan > 0
                  ? Math.min(100, Math.round((busy / workSpan) * 100))
                  : 0
              return (
                <div
                  key={stylist.id}
                  className="border-r border-line/50 px-3 py-3 last:border-r-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: stylist.color }}
                    >
                      {stylist.shortName[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {stylist.name}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        {avail.enabled
                          ? `${avail.start}–${avail.end} · ${byStylist[stylist.id].length} wizyt · ${pct}%`
                          : 'Dzień wolny'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/70">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${avail.enabled ? pct : 0}%`,
                        backgroundColor: stylist.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
        </div>

        <div className="scroll-nice max-h-[min(70vh,720px)] overflow-auto">
          <div
            className="relative grid grid-cols-[56px_repeat(3,minmax(0,1fr))]"
            style={{ height: GRID_HEIGHT }}
          >
            <div className="relative border-r border-line/50">
              {hours().map((h) => (
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-ink-muted"
                  style={{ top: (h - DAY_START_H) * HOUR_PX }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {STYLISTS.map((stylist) => (
              <DayColumn
                key={stylist.id}
                stylist={stylist}
                dayKey={dayKey}
                schedule={store.schedules[stylist.id]}
                appointments={byStylist[stylist.id]}
                selectedAptId={selectedAptId}
                onSelectApt={setSelectedAptId}
                onSlotClick={(time) => {
                  if (
                    !isSlotAvailable(
                      store.schedules[stylist.id],
                      dayKey,
                      time,
                      30,
                    )
                  ) {
                    return
                  }
                  setBooking({
                    stylistId: stylist.id,
                    date: dayKey,
                    time,
                  })
                }}
              />
            ))}

            {hours().map((h) => (
              <div
                key={`line-${h}`}
                className="pointer-events-none absolute right-0 left-14 border-t border-line/40"
                style={{ top: (h - DAY_START_H) * HOUR_PX }}
              />
            ))}

            {isToday(day) && <NowLine />}
          </div>
        </div>
      </div>

      {selectedApt && (
        <AppointmentDetails
          appointment={selectedApt}
          onClose={() => setSelectedAptId(null)}
          onStatus={(status) => {
            store.updateAppointment(selectedApt.id, { status })
            if (status === 'done' && selectedApt.clientId) {
              store.addService(selectedApt.clientId, {
                name: selectedApt.serviceName,
                price: selectedApt.price,
                durationMin: selectedApt.durationMin,
                date: selectedApt.date,
                notes: selectedApt.notes,
              })
            }
            if (status === 'cancelled') setSelectedAptId(null)
          }}
          onDelete={() => {
            if (confirm('Usunąć wizytę?')) {
              store.deleteAppointment(selectedApt.id)
              setSelectedAptId(null)
            }
          }}
        />
      )}

      {booking && (
        <AppointmentForm
          clients={store.clients}
          appointments={store.appointments}
          schedules={store.schedules}
          catalog={store.catalog}
          initialDate={booking.date}
          initialStylistId={booking.stylistId}
          initialTime={booking.time}
          initialClientId={booking.clientId}
          onAddClient={store.addClient}
          onClose={() => setBooking(null)}
          onSave={(data) => {
            store.addAppointment(data)
            setDay(parseISO(data.date))
            setBooking(null)
          }}
        />
      )}
    </div>
  )
}

function DayColumn({
  stylist,
  dayKey,
  schedule,
  appointments,
  selectedAptId,
  onSelectApt,
  onSlotClick,
}: {
  stylist: Stylist
  dayKey: string
  schedule: StylistSchedule
  appointments: Appointment[]
  selectedAptId: string | null
  onSelectApt: (id: string) => void
  onSlotClick: (time: string) => void
}) {
  const offBlocks = unavailableBlocks(schedule, dayKey, DAY_START_H, DAY_END_H)
  const avail = getAvailabilityForDate(schedule, dayKey)

  return (
    <div className="relative border-r border-line/50 last:border-r-0">
      {offBlocks.map((block, i) => {
        const top = ((block.startMin - DAY_START_H * 60) / 60) * HOUR_PX
        const height = ((block.endMin - block.startMin) / 60) * HOUR_PX
        return (
          <div
            key={i}
            className="pointer-events-none absolute inset-x-0 z-[1] bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,rgba(92,107,102,0.08)_6px,rgba(92,107,102,0.08)_12px)]"
            style={{ top, height }}
          />
        )
      })}

      {!avail.enabled && (
        <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
          <span className="rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-ink-muted shadow-sm">
            Dzień wolny
          </span>
        </div>
      )}

      {hours().map((h) => {
        const time = `${String(h).padStart(2, '0')}:00`
        const free = isSlotAvailable(schedule, dayKey, time, 30)
        return (
          <button
            key={h}
            type="button"
            disabled={!free}
            className={`absolute inset-x-0 z-0 transition ${
              free ? 'hover:bg-mist/50' : 'cursor-not-allowed'
            }`}
            style={{ top: (h - DAY_START_H) * HOUR_PX, height: HOUR_PX }}
            aria-label={
              free
                ? `Dodaj wizytę o ${time} u ${stylist.name}`
                : `${stylist.name} niedostępna o ${time}`
            }
            onClick={() => free && onSlotClick(time)}
          />
        )
      })}

      {appointments.map((apt) => {
        const start = clampMinutes(timeToMinutes(apt.time) - DAY_START_H * 60)
        const end = clampMinutes(start + apt.durationMin)
        const top = (start / 60) * HOUR_PX
        const height = Math.max(((end - start) / 60) * HOUR_PX, 28)
        const active = selectedAptId === apt.id
        const done = apt.status === 'done'

        return (
          <button
            key={apt.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelectApt(apt.id)
            }}
            className={`absolute right-1 left-1 z-10 overflow-hidden rounded-lg border px-2 py-1 text-left shadow-sm transition ${
              active ? 'ring-2 ring-forest/40' : ''
            } ${done ? 'opacity-70' : ''}`}
            style={{
              top,
              height,
              backgroundColor: hexWithAlpha(stylist.color, done ? 0.35 : 0.88),
              borderColor: stylist.color,
              color: done ? '#1a2421' : '#fff',
            }}
          >
            <p className="truncate text-[11px] font-bold leading-tight">
              {apt.time} · {apt.durationMin} min
            </p>
            <p className="truncate text-xs font-semibold leading-tight">
              {apt.personName}
            </p>
            {height > 44 && (
              <p className="truncate text-[11px] leading-tight opacity-90">
                {apt.serviceName}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}

function AppointmentDetails({
  appointment,
  onClose,
  onStatus,
  onDelete,
}: {
  appointment: Appointment
  onClose: () => void
  onStatus: (status: AppointmentStatus) => void
  onDelete: () => void
}) {
  const stylist = STYLISTS.find((s) => s.id === appointment.stylistId)

  return (
    <div className="animate-fade-up rounded-3xl border border-line/80 bg-surface p-5 shadow-sm shadow-ink/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
            Szczegóły wizyty
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
            {appointment.personName}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {appointment.time} · {appointment.durationMin} min ·{' '}
            {appointment.serviceName}
            {stylist ? ` · ${stylist.name}` : ''}
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-forest">
            {formatPrice(appointment.price)}
          </p>
        </div>
        <button type="button" className={btnGhost} onClick={onClose}>
          Zamknij
        </button>
      </div>

      {appointment.status === 'planned' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-mist px-4 py-2 text-sm font-semibold text-forest transition hover:bg-forest hover:text-sand"
            onClick={() => onStatus('done')}
          >
            <Check className="h-4 w-4" />
            Wykonana
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-muted transition hover:bg-mist"
            onClick={() => onStatus('cancelled')}
          >
            <X className="h-4 w-4" />
            Anuluj
          </button>
          <button
            type="button"
            className="ml-auto text-sm font-medium text-blush hover:underline"
            onClick={onDelete}
          >
            Usuń
          </button>
        </div>
      )}
    </div>
  )
}

function NowLine() {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes() - DAY_START_H * 60
  if (minutes < 0 || minutes > DAY_MINUTES) return null
  return (
    <div
      className="pointer-events-none absolute right-0 left-14 z-20 flex items-center"
      style={{ top: (minutes / 60) * HOUR_PX }}
    >
      <span className="h-2.5 w-2.5 -translate-x-1 rounded-full bg-blush" />
      <span className="h-0.5 flex-1 bg-blush" />
    </div>
  )
}

function hours() {
  return Array.from(
    { length: DAY_END_H - DAY_START_H + 1 },
    (_, i) => DAY_START_H + i,
  )
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

function clampMinutes(value: number) {
  return Math.max(0, Math.min(DAY_MINUTES, value))
}

function busyMinutes(appointments: Appointment[]) {
  return appointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => {
      const start = Math.max(timeToMinutes(a.time), DAY_START_H * 60)
      const end = Math.min(start + a.durationMin, DAY_END_H * 60)
      return sum + Math.max(0, end - start)
    }, 0)
}

function hexWithAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
