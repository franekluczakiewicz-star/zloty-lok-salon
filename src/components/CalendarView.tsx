import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { pl } from 'date-fns/locale'
import { Check, ChevronLeft, ChevronRight, Clock, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SalonStore } from '../hooks/useSalonStore'
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

type CalendarViewProps = {
  store: SalonStore
}

export function CalendarView({ store }: CalendarViewProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedByStylist, setSelectedByStylist] = useState<
    Record<StylistId, Date>
  >(() => ({
    ania: new Date(),
    ewa: new Date(),
    roksana: new Date(),
  }))
  const [booking, setBooking] = useState<{
    stylistId?: StylistId
    date: string
  } | null>(null)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const appointmentsByStylist = useMemo(() => {
    const map: Record<StylistId, Appointment[]> = {
      ania: [],
      ewa: [],
      roksana: [],
    }
    for (const apt of store.appointments) {
      map[apt.stylistId]?.push(apt)
    }
    return map
  }, [store.appointments])

  return (
    <div className="animate-fade-up space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Terminarze
          </h1>
          <p className="mt-1 text-ink-muted">
            Osobny kalendarz dla Ani, Ewy i Roksany.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() =>
              setBooking({
                stylistId: undefined,
                date: format(new Date(), 'yyyy-MM-dd'),
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
              onClick={() => setMonth((m) => startOfMonth(addDays(m, -15)))}
              aria-label="Poprzedni miesiąc"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-36 px-2 text-center font-display text-lg font-semibold capitalize text-ink">
              {format(month, 'LLLL yyyy', { locale: pl })}
            </span>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                const now = new Date()
                setMonth(startOfMonth(now))
                setSelectedByStylist({
                  ania: now,
                  ewa: now,
                  roksana: now,
                })
              }}
            >
              Dziś
            </button>
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
      </header>

      <div className="grid gap-5 xl:grid-cols-3">
        {STYLISTS.map((stylist) => (
          <StylistCalendar
            key={stylist.id}
            stylist={stylist}
            month={month}
            days={days}
            selected={selectedByStylist[stylist.id]}
            appointments={appointmentsByStylist[stylist.id]}
            onSelectDay={(day) =>
              setSelectedByStylist((prev) => ({
                ...prev,
                [stylist.id]: day,
              }))
            }
            onAddVisit={() =>
              setBooking({
                stylistId: stylist.id,
                date: format(selectedByStylist[stylist.id], 'yyyy-MM-dd'),
              })
            }
            onStatus={(id, status) =>
              store.updateAppointment(id, { status })
            }
            onDelete={(id) => {
              if (confirm('Usunąć wizytę?')) {
                store.deleteAppointment(id)
              }
            }}
          />
        ))}
      </div>

      {booking && (
        <AppointmentForm
          initialDate={booking.date}
          initialStylistId={booking.stylistId}
          onClose={() => setBooking(null)}
          onSave={(data) => {
            store.addAppointment(data)
            const day = parseISO(data.date)
            setMonth(startOfMonth(day))
            setSelectedByStylist((prev) => ({
              ...prev,
              [data.stylistId]: day,
            }))
            setBooking(null)
          }}
        />
      )}
    </div>
  )
}

function StylistCalendar({
  stylist,
  month,
  days,
  selected,
  appointments,
  onSelectDay,
  onAddVisit,
  onStatus,
  onDelete,
}: {
  stylist: Stylist
  month: Date
  days: Date[]
  selected: Date
  appointments: Appointment[]
  onSelectDay: (day: Date) => void
  onAddVisit: () => void
  onStatus: (id: string, status: AppointmentStatus) => void
  onDelete: (id: string) => void
}) {
  const selectedKey = format(selected, 'yyyy-MM-dd')

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of appointments) {
      if (a.status === 'cancelled') continue
      map.set(a.date, (map.get(a.date) ?? 0) + 1)
    }
    return map
  }, [appointments])

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.date === selectedKey)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, selectedKey],
  )

  return (
    <section className="flex flex-col overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-sm shadow-ink/5">
      <div
        className="flex items-center justify-between gap-3 px-4 py-4 text-white sm:px-5"
        style={{ backgroundColor: stylist.color }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 font-display text-lg font-semibold backdrop-blur">
            {stylist.shortName[0]}
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold">{stylist.name}</h2>
            <p className="text-xs text-white/75">osobny terminarz</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddVisit}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/30"
        >
          <Plus className="h-3.5 w-3.5" />
          Wizyta
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-2 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold tracking-wide text-ink-muted uppercase">
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const count = countsByDate.get(key) ?? 0
            const inMonth = isSameMonth(day, month)
            const active = isSameDay(day, selected)
            const today = isToday(day)

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDay(day)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs transition sm:text-sm ${
                  active
                    ? 'text-white shadow-md'
                    : inMonth
                      ? 'text-ink hover:bg-mist'
                      : 'text-ink-muted/35 hover:bg-fog'
                } ${today && !active ? 'ring-1 ring-sand-deep/70 ring-inset' : ''}`}
                style={active ? { backgroundColor: stylist.color } : undefined}
              >
                <span className="font-semibold">{format(day, 'd')}</span>
                {count > 0 && (
                  <span
                    className={`mt-0.5 h-1 w-1 rounded-full ${
                      active ? 'bg-white' : ''
                    }`}
                    style={!active ? { backgroundColor: stylist.color } : undefined}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 border-t border-line/60 px-4 py-4 sm:px-5">
        <p className="mb-3 text-xs font-semibold tracking-widest text-ink-muted uppercase">
          {format(selected, 'EEEE, d MMM', { locale: pl })}
        </p>

        {dayAppointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-fog/40 px-3 py-6 text-center">
            <p className="text-sm font-medium text-ink">Brak wizyt</p>
            <button
              type="button"
              onClick={onAddVisit}
              className={`${btnPrimary} mt-3 w-full text-xs`}
            >
              <Plus className="h-3.5 w-3.5" />
              Dodaj wizytę
            </button>
          </div>
        ) : (
          <ul className="scroll-nice max-h-64 space-y-2 overflow-y-auto pr-1">
            {dayAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                accent={stylist.color}
                onStatus={(status) => onStatus(apt.id, status)}
                onDelete={() => onDelete(apt.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function AppointmentCard({
  appointment,
  accent,
  onStatus,
  onDelete,
}: {
  appointment: Appointment
  accent: string
  onStatus: (status: AppointmentStatus) => void
  onDelete: () => void
}) {
  const statusStyles: Record<AppointmentStatus, string> = {
    planned: 'bg-mist text-forest',
    done: 'bg-sand/40 text-ink',
    cancelled: 'bg-blush/20 text-blush line-through opacity-70',
  }

  const statusLabel: Record<AppointmentStatus, string> = {
    planned: 'Zaplanowana',
    done: 'Wykonana',
    cancelled: 'Anulowana',
  }

  return (
    <li
      className={`rounded-2xl border border-line/70 p-3 transition ${
        appointment.status === 'cancelled' ? 'opacity-70' : ''
      }`}
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-forest">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {appointment.time}
            <span className="font-normal text-ink-muted">
              · {appointment.durationMin} min
            </span>
          </p>
          {appointment.personName && (
            <p className="mt-0.5 truncate text-sm font-semibold text-ink">
              {appointment.personName}
            </p>
          )}
          <p className="truncate text-xs text-ink-muted">
            {appointment.serviceName}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyles[appointment.status]}`}
        >
          {statusLabel[appointment.status]}
        </span>
      </div>
      <p className="mt-1 font-display text-sm font-semibold text-forest">
        {formatPrice(appointment.price)}
      </p>
      {appointment.status === 'planned' && (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line/50 pt-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-mist px-2 py-1 text-[11px] font-semibold text-forest transition hover:bg-forest hover:text-sand"
            onClick={() => onStatus('done')}
          >
            <Check className="h-3 w-3" />
            OK
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-muted transition hover:bg-mist"
            onClick={() => onStatus('cancelled')}
          >
            <X className="h-3 w-3" />
            Anuluj
          </button>
          <button
            type="button"
            className="ml-auto text-[11px] font-medium text-blush hover:underline"
            onClick={onDelete}
          >
            Usuń
          </button>
        </div>
      )}
    </li>
  )
}
