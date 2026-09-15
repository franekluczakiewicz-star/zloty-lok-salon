import {
  addDays,
  addMonths,
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
import { Check, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, UserX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  APPOINTMENT_STATUS_LABEL,
  formatDyeAmount,
  formatPrice,
  isAppointmentInactive,
  type Appointment,
  type AppointmentStatus,
  type Stylist,
  type StylistId,
} from '../types'
import { AppointmentForm } from './AppointmentForm'
import { Modal, btnGhost, btnPrimary } from './ui'

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
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [booking, setBooking] = useState<BookingState | null>(null)
  const [editingAptId, setEditingAptId] = useState<string | null>(null)
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
        (a) => a.date === dayKey && !isAppointmentInactive(a.status),
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

  const editingApt = editingAptId
    ? store.appointments.find((a) => a.id === editingAptId)
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
            <button
              type="button"
              className="min-w-48 rounded-xl px-2 py-1 text-center transition hover:bg-mist"
              onClick={() => setMonthPickerOpen(true)}
              aria-label="Wybierz datę z kalendarza miesięcznego"
            >
              <p className="font-display text-lg font-semibold capitalize text-ink">
                {format(day, 'EEEE', { locale: pl })}
              </p>
              <p className="text-xs text-ink-muted">
                {format(day, 'd MMMM yyyy', { locale: pl })}
                {isToday(day) ? ' · dziś' : ''}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-forest uppercase">
                Kalendarz miesiąca
              </p>
            </button>
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

      {monthPickerOpen && (
        <MonthPickerModal
          selected={day}
          appointments={store.appointments}
          onClose={() => setMonthPickerOpen(false)}
          onSelect={(d) => {
            setDay(d)
            setMonthPickerOpen(false)
            setSelectedAptId(null)
          }}
        />
      )}

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
                onEditApt={(id) => {
                  setEditingAptId(id)
                  setSelectedAptId(null)
                }}
                onStatus={(id, status) => {
                  const apt = store.appointments.find((a) => a.id === id)
                  store.updateAppointment(id, { status })
                  if (status === 'done' && apt?.clientId) {
                    store.addService(apt.clientId, {
                      name: apt.serviceName,
                      price: apt.price,
                      durationMin: apt.durationMin,
                      date: apt.date,
                      notes: apt.notes,
                    })
                  }
                  if (isAppointmentInactive(status)) {
                    setSelectedAptId(null)
                  }
                }}
                onDeleteApt={(id) => {
                  if (
                    confirm(
                      'Usunąć wizytę? Możesz ją potem przywrócić w Historii.',
                    )
                  ) {
                    store.deleteAppointment(id)
                    setSelectedAptId(null)
                  }
                }}
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

      {selectedApt && !editingApt && (
        <AppointmentDetailsModal
          appointment={selectedApt}
          onClose={() => setSelectedAptId(null)}
          onEdit={() => {
            setEditingAptId(selectedApt.id)
            setSelectedAptId(null)
          }}
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
            if (isAppointmentInactive(status)) setSelectedAptId(null)
          }}
          onDelete={() => {
            if (confirm('Usunąć wizytę? Możesz ją potem przywrócić w Historii.')) {
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

      {editingApt && (
        <AppointmentForm
          clients={store.clients}
          appointments={store.appointments}
          schedules={store.schedules}
          catalog={store.catalog}
          initialDate={editingApt.date}
          appointment={editingApt}
          onAddClient={store.addClient}
          onClose={() => setEditingAptId(null)}
          onSave={(data) => {
            const wasDone = editingApt.status === 'done'
            store.updateAppointment(editingApt.id, data)
            if (data.status === 'done' && !wasDone && data.clientId) {
              store.addService(data.clientId, {
                name: data.serviceName,
                price: data.price,
                durationMin: data.durationMin,
                date: data.date,
                notes: data.notes,
              })
            }
            setDay(parseISO(data.date))
            setEditingAptId(null)
            if (!isAppointmentInactive(data.status)) {
              setSelectedAptId(editingApt.id)
            }
          }}
        />
      )}
    </div>
  )
}

function MonthPickerModal({
  selected,
  appointments,
  onClose,
  onSelect,
}: {
  selected: Date
  appointments: Appointment[]
  onClose: () => void
  onSelect: (day: Date) => void
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(selected))

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const busyDays = useMemo(() => {
    const set = new Set<string>()
    for (const a of appointments) {
      if (a.status === 'cancelled') continue
      set.add(a.date)
    }
    return set
  }, [appointments])

  const weekdays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']

  return (
    <Modal title="Wybierz dzień" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className={btnGhost}
            aria-label="Poprzedni miesiąc"
            onClick={() => setCursor((d) => addMonths(d, -1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="font-display text-xl font-semibold capitalize text-ink">
            {format(cursor, 'LLLL yyyy', { locale: pl })}
          </p>
          <button
            type="button"
            className={btnGhost}
            aria-label="Następny miesiąc"
            onClick={() => setCursor((d) => addMonths(d, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdays.map((label) => (
            <div
              key={label}
              className="py-1 text-[11px] font-semibold tracking-wide text-ink-muted uppercase"
            >
              {label}
            </div>
          ))}
          {days.map((d) => {
            const inMonth = isSameMonth(d, cursor)
            const selectedDay = isSameDay(d, selected)
            const today = isToday(d)
            const key = format(d, 'yyyy-MM-dd')
            const hasVisits = busyDays.has(key)

            return (
              <button
                key={key}
                type="button"
                disabled={!inMonth}
                onClick={() => inMonth && onSelect(d)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold transition ${
                  !inMonth
                    ? 'cursor-default text-ink-muted/25'
                    : selectedDay
                      ? 'bg-forest text-sand shadow-md shadow-forest/25'
                      : today
                        ? 'bg-mist text-forest ring-1 ring-forest/30 hover:bg-forest hover:text-sand'
                        : 'text-ink hover:bg-mist'
                }`}
              >
                {format(d, 'd')}
                {hasVisits && inMonth && (
                  <span
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${
                      selectedDay ? 'bg-sand' : 'bg-forest'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line/60 pt-3">
          <p className="text-xs text-ink-muted">
            Kropka = dzień z wizytami
          </p>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              const now = new Date()
              setCursor(startOfMonth(now))
              onSelect(now)
            }}
          >
            Przejdź do dziś
          </button>
        </div>
      </div>
    </Modal>
  )
}

function DayColumn({
  stylist,
  dayKey,
  schedule,
  appointments,
  selectedAptId,
  onSelectApt,
  onEditApt,
  onStatus,
  onDeleteApt,
  onSlotClick,
}: {
  stylist: Stylist
  dayKey: string
  schedule: StylistSchedule
  appointments: Appointment[]
  selectedAptId: string | null
  onSelectApt: (id: string) => void
  onEditApt: (id: string) => void
  onStatus: (id: string, status: AppointmentStatus) => void
  onDeleteApt: (id: string) => void
  onSlotClick: (time: string) => void
}) {
  const offBlocks = unavailableBlocks(schedule, dayKey, DAY_START_H, DAY_END_H)
  const avail = getAvailabilityForDate(schedule, dayKey)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openHover(id: string) {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setHoveredId(id)
  }

  function scheduleHide() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setHoveredId(null), 180)
  }

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  const layout = useMemo(
    () => layoutOverlappingAppointments(appointments),
    [appointments],
  )

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
        const active = selectedAptId === apt.id || hoveredId === apt.id
        const done = apt.status === 'done'
        const noShow = apt.status === 'no_show'
        const showAbove = top > GRID_HEIGHT * 0.45
        const place = layout.get(apt.id) ?? { col: 0, cols: 1 }
        const widthPct = 100 / place.cols
        const leftPct = (place.col / place.cols) * 100

        return (
          <div
            key={apt.id}
            className="absolute z-10"
            style={{
              top,
              height,
              left: `calc(${leftPct}% + 2px)`,
              width: `calc(${widthPct}% - 4px)`,
            }}
            onMouseEnter={() => openHover(apt.id)}
            onMouseLeave={scheduleHide}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelectApt(apt.id)
              }}
              className={`relative h-full w-full overflow-hidden rounded-lg border px-1.5 py-1 text-left shadow-sm transition sm:px-2 ${
                active ? 'ring-2 ring-forest/40' : ''
              } ${done ? 'opacity-75 line-through decoration-2' : ''} ${
                noShow ? 'ring-1 ring-blush/50' : ''
              }`}
              style={{
                backgroundColor: hexWithAlpha(
                  noShow ? '#c45c5c' : stylist.color,
                  done ? 0.32 : noShow ? 0.2 : 0.88,
                ),
                borderColor: noShow ? '#c45c5c' : stylist.color,
                color: done || noShow ? '#1a2421' : '#fff',
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
              {noShow && (
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  aria-hidden
                >
                  <X
                    className="h-[70%] w-[70%] max-h-14 max-w-14 text-[#c0392b] drop-shadow-sm"
                    strokeWidth={3.5}
                  />
                </span>
              )}
            </button>

            {hoveredId === apt.id && (
              <AppointmentHoverCard
                appointment={apt}
                stylistName={stylist.name}
                placeAbove={showAbove}
                onMouseEnter={() => openHover(apt.id)}
                onMouseLeave={scheduleHide}
                onEdit={() => onEditApt(apt.id)}
                onStatus={(status) => onStatus(apt.id, status)}
                onDelete={() => onDeleteApt(apt.id)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatusActions({
  current,
  onStatus,
  onEdit,
  onDelete,
  compact,
}: {
  current: AppointmentStatus
  onStatus: (status: AppointmentStatus) => void
  onEdit?: () => void
  onDelete: () => void
  compact?: boolean
}) {
  const btn = compact
    ? 'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition'
    : 'inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition'

  function statusBtn(status: AppointmentStatus, label: string, icon: React.ReactNode) {
    const active = current === status
    return (
      <button
        type="button"
        className={`${btn} ${
          active
            ? 'border-forest bg-mist text-forest ring-2 ring-forest/20'
            : 'border-line text-ink-muted hover:bg-mist hover:text-ink'
        }`}
        onClick={() => onStatus(status)}
      >
        {icon}
        {label}
      </button>
    )
  }

  return (
    <div className={`flex flex-col gap-1.5 ${compact ? '' : 'sm:flex-row sm:flex-wrap'}`}>
      {statusBtn(
        'done',
        'Wizyta zakończona',
        <Check className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4'} />,
      )}
      {statusBtn(
        'cancelled',
        'Anulowana',
        <X className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4'} />,
      )}
      {statusBtn(
        'no_show',
        'Klient nie przyszedł',
        <UserX className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4'} />,
      )}
      {statusBtn(
        'planned',
        'Zaplanowana',
        <Plus className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4'} />,
      )}
      {onEdit && (
        <button
          type="button"
          className={`${btn} border-line text-ink hover:bg-mist`}
          onClick={onEdit}
        >
          <Pencil className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4'} />
          Edytuj
        </button>
      )}
      <button
        type="button"
        className={`${btn} border-blush/40 bg-blush/10 text-blush hover:bg-blush/20`}
        onClick={onDelete}
      >
        <Trash2 className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4'} />
        Usuń wizytę
      </button>
    </div>
  )
}

function AppointmentHoverCard({
  appointment,
  stylistName,
  placeAbove,
  onMouseEnter,
  onMouseLeave,
  onEdit,
  onStatus,
  onDelete,
}: {
  appointment: Appointment
  stylistName: string
  placeAbove: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onEdit: () => void
  onStatus: (status: AppointmentStatus) => void
  onDelete: () => void
}) {
  return (
    <div
      className={`absolute left-1/2 z-50 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-line bg-surface p-3 text-ink shadow-xl shadow-ink/15 ${
        placeAbove ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="dialog"
      aria-label="Szczegóły wizyty"
    >
      <p className="text-[10px] font-semibold tracking-widest text-ink-muted uppercase">
        {APPOINTMENT_STATUS_LABEL[appointment.status]}
      </p>
      <p className="mt-0.5 font-display text-lg font-semibold leading-tight">
        {appointment.personName}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        {appointment.time} · {appointment.durationMin} min · {stylistName}
      </p>
      <p className="text-xs text-ink">{appointment.serviceName}</p>
      <p className="mt-1 text-sm font-semibold text-forest">
        {formatPrice(appointment.price)}
      </p>
      {(appointment.dyeColor || appointment.dyeAmountG) && (
        <p className="mt-1 text-xs text-ink-muted">
          Farba: {appointment.dyeColor || '—'}
          {appointment.dyeAmountG != null
            ? ` · ${formatDyeAmount(appointment.dyeAmountG)}`
            : ''}
        </p>
      )}

      <div className="mt-3">
        <StatusActions
          current={appointment.status}
          onStatus={onStatus}
          onEdit={onEdit}
          onDelete={onDelete}
          compact
        />
      </div>
    </div>
  )
}

function AppointmentDetailsModal({
  appointment,
  onClose,
  onEdit,
  onStatus,
  onDelete,
}: {
  appointment: Appointment
  onClose: () => void
  onEdit: () => void
  onStatus: (status: AppointmentStatus) => void
  onDelete: () => void
}) {
  const stylist = STYLISTS.find((s) => s.id === appointment.stylistId)

  return (
    <Modal title="Szczegóły wizyty" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
            {APPOINTMENT_STATUS_LABEL[appointment.status]}
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold text-ink">
            {appointment.personName}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            {appointment.time} · {appointment.durationMin} min ·{' '}
            {appointment.serviceName}
            {stylist ? ` · ${stylist.name}` : ''}
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-forest">
            {formatPrice(appointment.price)}
          </p>
          {(appointment.dyeColor || appointment.dyeAmountG) && (
            <p className="mt-2 text-sm text-ink">
              Farba:{' '}
              <span className="font-semibold">{appointment.dyeColor || '—'}</span>
              {appointment.dyeAmountG != null && (
                <span className="text-ink-muted">
                  {' '}
                  · {formatDyeAmount(appointment.dyeAmountG)}
                </span>
              )}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Status wizyty
          </p>
          <StatusActions
            current={appointment.status}
            onStatus={onStatus}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </Modal>
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

/** Układ nachodzących wizyt obok siebie (jak w Outlooku). */
function layoutOverlappingAppointments(appointments: Appointment[]) {
  const sorted = [...appointments]
    .filter((a) => a.status !== 'cancelled')
    .map((apt) => {
      const start = timeToMinutes(apt.time)
      return { apt, start, end: start + apt.durationMin }
    })
    .sort((a, b) => a.start - b.start || b.end - a.end)

  type Placed = { id: string; start: number; end: number; col: number }
  const placed: Placed[] = []

  for (const item of sorted) {
    let col = 0
    while (
      placed.some(
        (p) => p.col === col && p.start < item.end && p.end > item.start,
      )
    ) {
      col += 1
    }
    placed.push({
      id: item.apt.id,
      start: item.start,
      end: item.end,
      col,
    })
  }

  const result = new Map<string, { col: number; cols: number }>()
  for (const item of placed) {
    const group = placed.filter(
      (p) => p.start < item.end && p.end > item.start,
    )
    const cols = Math.max(...group.map((g) => g.col)) + 1
    result.set(item.id, { col: item.col, cols })
  }
  return result
}

function busyMinutes(appointments: Appointment[]) {
  return appointments
    .filter((a) => !isAppointmentInactive(a.status))
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
