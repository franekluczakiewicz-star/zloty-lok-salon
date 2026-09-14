import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  getAvailabilityForDate,
  isSlotAvailable,
  type SchedulesMap,
} from '../schedule'
import {
  STYLISTS,
  clientFullName,
  formatPhone,
  type Appointment,
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
  onClose,
  onAddClient,
  onSave,
}: AppointmentFormProps) {
  const [stylistId, setStylistId] = useState<StylistId | null>(
    initialStylistId ?? null,
  )
  const [clientId, setClientId] = useState(initialClientId ?? '')
  const [clientQuery, setClientQuery] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [serviceName, setServiceName] = useState<string>(
    catalog[0]?.name ?? '',
  )
  const [price, setPrice] = useState(String(catalog[0]?.price ?? 0))
  const [durationMin, setDurationMin] = useState(
    String(catalog[0]?.durationMin ?? 30),
  )
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime ?? '10:00')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

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
          a.stylistId === stylistId &&
          a.date === date &&
          a.status !== 'cancelled',
      )
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [appointments, stylistId, date])

  const outsideSchedule = useMemo(() => {
    if (!stylistId) return false
    return !isSlotAvailable(
      schedules[stylistId],
      date,
      time,
      Number(durationMin) || 0,
    )
  }, [schedules, stylistId, date, time, durationMin])

  const overlap = useMemo(() => {
    if (!stylistId || !time) return false
    const start = toMin(time)
    const end = start + Number(durationMin || 0)
    return dayBusy.some((a) => {
      const aStart = toMin(a.time)
      const aEnd = aStart + a.durationMin
      return start < aEnd && end > aStart
    })
  }, [dayBusy, stylistId, time, durationMin])

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase()
    const digits = clientQuery.replace(/\D/g, '')
    if (!q) return clients
    return clients.filter((c) => {
      const name = clientFullName(c).toLowerCase()
      const phone = c.phone.replace(/\D/g, '')
      return (
        name.includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        (digits.length > 0 && phone.includes(digits))
      )
    })
  }, [clients, clientQuery])

  function applyCatalog(name: string) {
    const item = catalog.find((s) => s.name === name)
    setServiceName(name)
    if (item) {
      setPrice(String(item.price))
      setDurationMin(String(item.durationMin))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceNum = Number(price)
    const durationNum = Number(durationMin)
    if (!stylistId || !selectedStylist) {
      setError('Wybierz, kto to zrobi: Ania, Ewa lub Roksana.')
      return
    }
    if (!clientId || !selectedClient) {
      setError('Wybierz klienta z bazy albo dodaj nowego.')
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
    if (outsideSchedule) {
      setError(
        dayAvail && !dayAvail.enabled
          ? 'Wybrany dzień jest wolny w grafiku fryzjerki.'
          : `Termin poza grafikiem (${dayAvail?.start ?? '?'}–${dayAvail?.end ?? '?'}).`,
      )
      return
    }
    if (overlap) {
      setError('Ten termin koliduje z inną wizytą fryzjerki.')
      return
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
      status: 'planned',
      notes: notes.trim() || undefined,
    })
  }

  return (
    <>
      <Modal title="Nowa wizyta" onClose={onClose} wide>
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

            {selectedClient ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-forest/30 bg-mist px-4 py-3">
                <div>
                  <p className="font-semibold text-ink">
                    {clientFullName(selectedClient)}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {formatPhone(selectedClient.phone)}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-ink-muted hover:text-ink"
                  onClick={() => setClientId('')}
                >
                  Zmień
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <input
                    className={`${inputClass} pl-11`}
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder="Szukaj po imieniu lub telefonie…"
                  />
                </div>

                {clients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line bg-fog/50 px-4 py-6 text-center">
                    <p className="text-sm font-medium text-ink">
                      Brak klientów w bazie
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Dodaj nowego klienta tutaj albo w zakładce Klienci.
                    </p>
                    <button
                      type="button"
                      className={`${btnPrimary} mt-3 text-xs`}
                      onClick={() => setShowNewClient(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Dodaj klienta
                    </button>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line bg-fog/50 px-4 py-5 text-center">
                    <p className="text-sm text-ink-muted">
                      Nic nie znaleziono — dodaj nowego klienta.
                    </p>
                    <button
                      type="button"
                      className={`${btnSecondary} mt-3 text-xs`}
                      onClick={() => setShowNewClient(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nowy klient
                    </button>
                  </div>
                ) : (
                  <ul className="scroll-nice max-h-44 overflow-y-auto rounded-2xl border border-line">
                    {filteredClients.map((client) => (
                      <li key={client.id} className="border-b border-line/60 last:border-0">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-mist"
                          onClick={() => {
                            setClientId(client.id)
                            setError('')
                          }}
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
                )}
              </>
            )}
          </div>

          <Field label="Usługa">
            <ServiceCatalogSelect
              catalog={catalog}
              value={serviceName}
              onChange={applyCatalog}
            />
          </Field>

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

          {selectedStylist && (
            <DayTimelinePreview
              stylistName={selectedStylist.name}
              stylistColor={selectedStylist.color}
              busy={dayBusy}
              draftStart={time}
              draftDuration={Number(durationMin) || 0}
              overlap={overlap || outsideSchedule}
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

          {error && <p className="text-sm text-blush">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={btnSecondary} onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className={btnPrimary}>
              Zapisz wizytę
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
            setClientQuery('')
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
  availability,
}: {
  stylistName: string
  stylistColor: string
  busy: Appointment[]
  draftStart: string
  draftDuration: number
  overlap: boolean
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
        ? 'Kolizja / poza grafikiem'
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
