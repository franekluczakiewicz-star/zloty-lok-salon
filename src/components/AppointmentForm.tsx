import { Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getAvailabilityForDate,
  isSlotAvailable,
  type SchedulesMap,
} from '../schedule'
import {
  STYLISTS,
  APPOINTMENT_STATUS_LABEL,
  clientFullName,
  defaultDyeAmountG,
  formatPhone,
  isColoringService,
  type Appointment,
  type AppointmentStatus,
  type Client,
  type ServiceCatalogItem,
  type StylistId,
} from '../types'
import { ClientForm } from './ClientForm'
import { ServiceCatalogSelect } from './PriceListView'
import { Field, Modal, btnPrimary, btnSecondary, inputClass } from './ui'

type AppointmentFormProps = {
  clients: Client[]
  appointments: Appointment[]
  schedules: SchedulesMap
  catalog: ServiceCatalogItem[]
  initialDate: string
  initialStylistId?: StylistId
  initialTime?: string
  initialClientId?: string
  /** Gdy podane — edycja istniejącej wizyty */
  appointment?: Appointment
  onClose: () => void
  onAddClient: (data: {
    firstName: string
    lastName: string
    phone: string
    email?: string
    notes?: string
  }) => Client
  onSave: (data: Omit<Appointment, 'id'>) => void
}

export function AppointmentForm({
  clients,
  appointments,
  schedules,
  catalog,
  initialDate,
  initialStylistId,
  initialTime,
  initialClientId,
  appointment,
  onClose,
  onAddClient,
  onSave,
}: AppointmentFormProps) {
  const isEdit = Boolean(appointment)
  const initialClient =
    clients.find(
      (c) => c.id === (appointment?.clientId ?? initialClientId ?? ''),
    ) ?? null
  const [stylistId, setStylistId] = useState<StylistId | null>(
    appointment?.stylistId ?? initialStylistId ?? null,
  )
  const [clientId, setClientId] = useState(initialClient?.id ?? '')
  const [clientQuery, setClientQuery] = useState(
    initialClient ? clientFullName(initialClient) : '',
  )
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [showNewClient, setShowNewClient] = useState(false)
  const clientBoxRef = useRef<HTMLDivElement>(null)
  const [serviceName, setServiceName] = useState<string>(
    appointment?.serviceName ?? catalog[0]?.name ?? '',
  )
  const [price, setPrice] = useState(
    String(appointment?.price ?? catalog[0]?.price ?? 0),
  )
  const [durationMin, setDurationMin] = useState(
    String(appointment?.durationMin ?? catalog[0]?.durationMin ?? 30),
  )
  const [dyeColor, setDyeColor] = useState(appointment?.dyeColor ?? '')
  const [dyeAmountG, setDyeAmountG] = useState(
    appointment?.dyeAmountG != null
      ? String(appointment.dyeAmountG)
      : String(
          defaultDyeAmountG(
            appointment?.serviceName ?? catalog[0]?.name ?? '',
          ),
        ),
  )
  const [date, setDate] = useState(appointment?.date ?? initialDate)
  const [time, setTime] = useState(
    appointment?.time ?? initialTime ?? '10:00',
  )
  const [notes, setNotes] = useState(appointment?.notes ?? '')
  const [status, setStatus] = useState<AppointmentStatus>(
    appointment?.status ?? 'planned',
  )
  const [error, setError] = useState('')

  const isColoring = isColoringService(serviceName, catalog)

  const selectedStylist = stylistId
    ? STYLISTS.find((s) => s.id === stylistId)
    : null
  const selectedClient = clients.find((c) => c.id === clientId)

  const dayAvail = stylistId
    ? getAvailabilityForDate(schedules[stylistId], date)
    : null

  const dayBusy = useMemo(() => {
    if (!stylistId) return []
    return appointments
      .filter(
        (a) =>
          a.id !== appointment?.id &&
          a.stylistId === stylistId &&
          a.date === date &&
          a.status !== 'cancelled',
      )
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [appointments, stylistId, date, appointment?.id])

  const outsideSchedule = useMemo(() => {
    if (!stylistId) return false
    return !isSlotAvailable(
      schedules[stylistId],
      date,
      time,
      Number(durationMin) || 0,
    )
  }, [schedules, stylistId, date, time, durationMin])

  const overlappingApts = useMemo(() => {
    if (!stylistId || !time) return []
    const start = toMin(time)
    const end = start + Number(durationMin || 0)
    return dayBusy.filter((a) => {
      const aStart = toMin(a.time)
      const aEnd = aStart + a.durationMin
      return start < aEnd && end > aStart
    })
  }, [dayBusy, stylistId, time, durationMin])

  const overlap = overlappingApts.length > 0

  const suggestions = useMemo(() => {
    const q = clientQuery.trim().toLowerCase()
    const digits = clientQuery.replace(/\D/g, '')
    if (q.length < 1) return []
    return clients
      .filter((c) => {
        if (c.id === clientId && clientFullName(c).toLowerCase() === q) {
          return false
        }
        const name = clientFullName(c).toLowerCase()
        const phone = c.phone.replace(/\D/g, '')
        return (
          name.includes(q) ||
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          (digits.length >= 2 && phone.includes(digits))
        )
      })
      .slice(0, 8)
  }, [clients, clientQuery, clientId])

  useEffect(() => {
    setHighlightIndex(0)
  }, [clientQuery])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!clientBoxRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pickClient(client: Client) {
    setClientId(client.id)
    setClientQuery(clientFullName(client))
    setShowSuggestions(false)
    setError('')
  }

  function clearClient() {
    setClientId('')
    setClientQuery('')
    setShowSuggestions(false)
  }

  function applyCatalog(name: string) {
    const item = catalog.find((s) => s.name === name)
    setServiceName(name)
    if (item) {
      setPrice(String(item.price))
      setDurationMin(String(item.durationMin))
    }
    if (isColoringService(name, catalog)) {
      setDyeAmountG(String(defaultDyeAmountG(name)))
    } else {
      setDyeColor('')
      setDyeAmountG('')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceNum = Number(price)
    const durationNum = Number(durationMin)
    const dyeAmountNum = Number(dyeAmountG)
    if (!stylistId || !selectedStylist) {
      setError('Wybierz, kto to zrobi: Ania, Ewa lub Roksana.')
      return
    }
    if (!clientId || !selectedClient) {
      setError('Wybierz klienta z podpowiedzi albo dodaj nowego.')
      return
    }
    if (!serviceName.trim() || !date || !time) {
      setError('Uzupełnij usługę, datę i godzinę.')
      return
    }
    if (Number.isNaN(priceNum) || Number.isNaN(durationNum)) {
      setError('Cena i czas muszą być liczbami.')
      return
    }
    if (isColoring) {
      if (!dyeColor.trim()) {
        setError('Podaj kolor / numer farby.')
        return
      }
      if (Number.isNaN(dyeAmountNum) || dyeAmountNum <= 0) {
        setError('Podaj ilość farby w gramach.')
        return
      }
    }
    if (outsideSchedule) {
      setError(
        dayAvail && !dayAvail.enabled
          ? 'Wybrany dzień jest wolny w grafiku fryzjerki.'
          : `Termin poza grafikiem (${dayAvail?.start ?? '?'}–${dayAvail?.end ?? '?'}).`,
      )
      return
    }
    if (overlappingApts.length > 0) {
      const list = overlappingApts
        .map(
          (a) =>
            `• ${a.time} · ${a.personName} — ${a.serviceName} (${a.durationMin} min)`,
        )
        .join('\n')
      const ok = confirm(
        `Ten termin jest zajęty.\n\nIstniejące usługi:\n${list}\n\nCzy na pewno dodać tę usługę równolegle (jak w Outlooku)?`,
      )
      if (!ok) return
    }
    onSave({
      stylistId,
      clientId,
      personName: clientFullName(selectedClient),
      serviceName: serviceName.trim(),
      date,
      time,
      durationMin: durationNum,
      price: priceNum,
      status: isEdit ? status : 'planned',
      notes: notes.trim() || undefined,
      dyeColor: isColoring ? dyeColor.trim() : undefined,
      dyeAmountG: isColoring ? dyeAmountNum : undefined,
    })
  }

  return (
    <>
      <Modal title={isEdit ? 'Edytuj wizytę' : 'Nowa wizyta'} onClose={onClose} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Kto to zrobi">
            <div className="grid grid-cols-3 gap-2">
              {STYLISTS.map((stylist) => {
                const active = stylistId === stylist.id
                return (
                  <button
                    key={stylist.id}
                    type="button"
                    onClick={() => {
                      setStylistId(stylist.id)
                      setError('')
                    }}
                    className={`rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition ${
                      active
                        ? 'border-forest bg-mist text-forest ring-2 ring-forest/20'
                        : 'border-line bg-fog text-ink-muted hover:bg-surface hover:text-ink'
                    }`}
                  >
                    <span
                      className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
                      style={{ backgroundColor: stylist.color }}
                    >
                      {stylist.shortName[0]}
                    </span>
                    {stylist.name}
                  </button>
                )
              })}
            </div>
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Klient
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-forest transition hover:bg-mist"
                onClick={() => setShowNewClient(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Nowy klient
              </button>
            </div>

            <div ref={clientBoxRef} className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                className={`${inputClass} pl-11 ${selectedClient ? 'pr-11' : ''}`}
                value={clientQuery}
                onChange={(e) => {
                  const value = e.target.value
                  setClientQuery(value)
                  setClientId('')
                  setShowSuggestions(true)
                }}
                onFocus={() => {
                  if (clientQuery.trim().length >= 1) setShowSuggestions(true)
                }}
                onKeyDown={(e) => {
                  if (!showSuggestions || suggestions.length === 0) {
                    if (e.key === 'Escape') setShowSuggestions(false)
                    return
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setHighlightIndex((i) =>
                      Math.min(i + 1, suggestions.length - 1),
                    )
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setHighlightIndex((i) => Math.max(i - 1, 0))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    const pick = suggestions[highlightIndex]
                    if (pick) pickClient(pick)
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false)
                  }
                }}
                placeholder="Zacznij wpisywać imię, nazwisko lub telefon…"
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-autocomplete="list"
              />
              {(clientQuery || selectedClient) && (
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:bg-mist hover:text-ink"
                  aria-label="Wyczyść klienta"
                  onClick={clearClient}
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {showSuggestions && clientQuery.trim().length >= 1 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-lg shadow-ink/10">
                  {suggestions.length > 0 ? (
                    <ul className="max-h-56 overflow-y-auto py-1" role="listbox">
                      {suggestions.map((client, index) => (
                        <li key={client.id} role="option" aria-selected={index === highlightIndex}>
                          <button
                            type="button"
                            className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition ${
                              index === highlightIndex ? 'bg-mist' : 'hover:bg-fog'
                            }`}
                            onMouseEnter={() => setHighlightIndex(index)}
                            onClick={() => pickClient(client)}
                          >
                            <span className="font-semibold text-ink">
                              {clientFullName(client)}
                            </span>
                            <span className="text-sm text-ink-muted">
                              {formatPhone(client.phone)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-sm text-ink-muted">
                      Brak podpowiedzi — dodaj nowego klienta.
                      <button
                        type="button"
                        className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
                        onClick={() => {
                          setShowSuggestions(false)
                          setShowNewClient(true)
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Nowy klient
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedClient && (
              <p className="text-xs text-ink-muted">
                Wybrano: {clientFullName(selectedClient)} ·{' '}
                {formatPhone(selectedClient.phone)}
              </p>
            )}
          </div>

          <Field label="Usługa">
            <ServiceCatalogSelect
              catalog={catalog}
              value={serviceName}
              onChange={applyCatalog}
            />
          </Field>

          {isColoring && (
            <div className="grid gap-4 rounded-2xl border border-sand/60 bg-sand/25 p-4 sm:grid-cols-2">
              <Field label="Kolor / numer farby">
                <input
                  className={inputClass}
                  value={dyeColor}
                  onChange={(e) => setDyeColor(e.target.value)}
                  placeholder="np. 7.1, Wella 8N…"
                  required
                />
              </Field>
              <Field label="Ilość farby (g)">
                <input
                  type="number"
                  min={1}
                  step={1}
                  className={inputClass}
                  value={dyeAmountG}
                  onChange={(e) => setDyeAmountG(e.target.value)}
                  required
                />
              </Field>
              <p className="sm:col-span-2 text-xs text-ink-muted">
                Przy koloryzacji podaj farbę — trafi do tygodniowego raportu zużycia
                i zapotrzebowania.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data">
              <input
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Godzina">
              <input
                type="time"
                className={inputClass}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cena (zł)">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <Field label="Czas (min)">
              <input
                type="number"
                min={5}
                step={5}
                className={inputClass}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </Field>
          </div>

          {isEdit && (
            <Field label="Status wizyty">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    'planned',
                    'done',
                    'cancelled',
                    'no_show',
                  ] as AppointmentStatus[]
                ).map((s) => {
                  const active = status === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                        active
                          ? 'border-forest bg-mist text-forest ring-2 ring-forest/20'
                          : 'border-line bg-fog text-ink-muted hover:bg-surface hover:text-ink'
                      }`}
                    >
                      {APPOINTMENT_STATUS_LABEL[s]}
                    </button>
                  )
                })}
              </div>
            </Field>
          )}

          {selectedStylist && (
            <DayTimelinePreview
              stylistName={selectedStylist.name}
              stylistColor={selectedStylist.color}
              busy={dayBusy}
              draftStart={time}
              draftDuration={Number(durationMin) || 0}
              overlap={outsideSchedule}
              parallel={overlap}
              availability={dayAvail}
            />
          )}

          <Field label="Notatki">
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Uwagi do wizyty…"
            />
          </Field>

          {overlap && (
            <div className="rounded-2xl border border-sand/70 bg-sand/30 px-4 py-3 text-sm text-ink">
              <p className="font-semibold text-ink">Termin zajęty</p>
              <ul className="mt-2 space-y-1 text-ink-muted">
                {overlappingApts.map((a) => (
                  <li key={a.id}>
                    {a.time} · {a.personName} — {a.serviceName}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-muted">
                Możesz dodać kolejną usługę równolegle — po zapisie potwierdzisz
                wybór. W kalendarzu wizyty ustawią się obok siebie jak w Outlooku.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-blush">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={btnSecondary} onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className={btnPrimary}>
              {isEdit ? 'Zapisz zmiany' : 'Zapisz wizytę'}
            </button>
          </div>
        </form>
      </Modal>

      {showNewClient && (
        <ClientForm
          title="Nowy klient"
          onClose={() => setShowNewClient(false)}
          onSave={(data) => {
            const client = onAddClient(data)
            setClientId(client.id)
            setClientQuery(clientFullName(client))
            setShowNewClient(false)
            setError('')
          }}
        />
      )}
    </>
  )
}

const PREVIEW_START = 8
const PREVIEW_END = 20
const PREVIEW_H = 12

function toMin(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

function DayTimelinePreview({
  stylistName,
  stylistColor,
  busy,
  draftStart,
  draftDuration,
  overlap,
  parallel,
  availability,
}: {
  stylistName: string
  stylistColor: string
  busy: Appointment[]
  draftStart: string
  draftDuration: number
  overlap: boolean
  parallel?: boolean
  availability: { enabled: boolean; start: string; end: string } | null
}) {
  const total = (PREVIEW_END - PREVIEW_START) * 60
  const draftFrom = toMin(draftStart) - PREVIEW_START * 60
  const draftTo = draftFrom + draftDuration

  const statusText = !availability
    ? ''
    : !availability.enabled
      ? 'Dzień wolny w grafiku'
      : overlap
        ? 'Poza grafikiem'
        : parallel
          ? 'Termin zajęty — możliwa wizyta równoległa'
          : busy.length === 0
            ? `Grafik ${availability.start}–${availability.end}`
            : `${busy.length} wizyt · grafik ${availability.start}–${availability.end}`

  return (
    <div className="rounded-2xl border border-line bg-fog/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink">
          Dzień {stylistName} — zajętość
        </p>
        <p
          className={`text-[11px] font-semibold ${
            overlap || (availability && !availability.enabled)
              ? 'text-blush'
              : parallel
                ? 'text-sand-deep'
                : 'text-ink-muted'
          }`}
        >
          {statusText}
        </p>
      </div>
      <div
        className="relative overflow-hidden rounded-xl bg-surface"
        style={{ height: (PREVIEW_END - PREVIEW_START) * PREVIEW_H }}
      >
        {Array.from({ length: PREVIEW_END - PREVIEW_START + 1 }, (_, i) => (
          <div
            key={i}
            className="absolute inset-x-0 border-t border-line/50"
            style={{ top: i * PREVIEW_H }}
          />
        ))}

        {availability && availability.enabled && (
          <div
            className="absolute inset-x-0 bg-mist/70"
            style={{
              top: `${((toMin(availability.start) - PREVIEW_START * 60) / total) * 100}%`,
              height: `${((toMin(availability.end) - toMin(availability.start)) / total) * 100}%`,
            }}
          />
        )}

        {busy.map((a) => {
          const start = toMin(a.time) - PREVIEW_START * 60
          const top = (start / total) * 100
          const height = (a.durationMin / total) * 100
          return (
            <div
              key={a.id}
              className="absolute right-1 left-1 overflow-hidden rounded-md px-1.5 text-[10px] font-semibold text-white"
              style={{
                top: `${top}%`,
                height: `${Math.max(height, 4)}%`,
                backgroundColor: stylistColor,
                opacity: 0.85,
              }}
              title={`${a.time} ${a.personName}`}
            >
              {a.time} {a.personName}
            </div>
          )
        })}
        {draftDuration > 0 && draftFrom < total && draftTo > 0 && (
          <div
            className={`absolute right-1 left-1 rounded-md border-2 border-dashed ${
              overlap
                ? 'border-blush bg-blush/25'
                : parallel
                  ? 'border-sand-deep bg-sand/40'
                  : 'border-forest bg-forest/20'
            }`}
            style={{
              top: `${(Math.max(0, draftFrom) / total) * 100}%`,
              height: `${((Math.min(total, draftTo) - Math.max(0, draftFrom)) / total) * 100}%`,
            }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
        <span>08:00</span>
        <span>14:00</span>
        <span>20:00</span>
      </div>
    </div>
  )
}
