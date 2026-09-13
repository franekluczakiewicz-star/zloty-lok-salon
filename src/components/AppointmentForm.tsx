import { useState } from 'react'
import {
  SERVICE_CATALOG,
  STYLISTS,
  type Appointment,
  type StylistId,
} from '../types'
import { Field, Modal, btnPrimary, btnSecondary, inputClass } from './ui'

type AppointmentFormProps = {
  initialDate: string
  initialStylistId?: StylistId
  onClose: () => void
  onSave: (data: Omit<Appointment, 'id'>) => void
}

export function AppointmentForm({
  initialDate,
  initialStylistId,
  onClose,
  onSave,
}: AppointmentFormProps) {
  const [stylistId, setStylistId] = useState<StylistId | null>(
    initialStylistId ?? null,
  )
  const [clientName, setClientName] = useState('')
  const [serviceName, setServiceName] = useState<string>(SERVICE_CATALOG[0].name)
  const [price, setPrice] = useState(String(SERVICE_CATALOG[0].price))
  const [durationMin, setDurationMin] = useState(
    String(SERVICE_CATALOG[0].durationMin),
  )
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const selected = stylistId ? STYLISTS.find((s) => s.id === stylistId) : null

  function applyCatalog(name: string) {
    const item = SERVICE_CATALOG.find((s) => s.name === name)
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
    if (!stylistId || !selected) {
      setError('Wybierz fryzjerkę: Ania, Ewa lub Roksana.')
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
    onSave({
      stylistId,
      personName: clientName.trim() || selected.name,
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
    <Modal title="Nowa wizyta" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Fryzjerka">
          <div className="grid grid-cols-3 gap-2">
            {STYLISTS.map((stylist) => {
              const active = stylistId === stylist.id
              const locked =
                initialStylistId != null && stylist.id !== initialStylistId
              return (
                <button
                  key={stylist.id}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setStylistId(stylist.id)
                    setError('')
                  }}
                  className={`rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition ${
                    active
                      ? 'border-forest bg-mist text-forest ring-2 ring-forest/20'
                      : locked
                        ? 'cursor-not-allowed border-line bg-fog/50 text-ink-muted/40'
                        : 'border-line bg-fog text-ink-muted hover:bg-surface hover:text-ink'
                  }`}
                >
                  <span
                    className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
                    style={{
                      backgroundColor: locked ? '#b8c4bf' : stylist.color,
                    }}
                  >
                    {stylist.shortName[0]}
                  </span>
                  {stylist.name}
                </button>
              )
            })}
          </div>
          {initialStylistId && (
            <p className="mt-1.5 text-xs text-ink-muted">
              Wizyta trafi do terminarza wybranej fryzjerki.
            </p>
          )}
        </Field>

        <Field label="Klient (opcjonalnie)">
          <input
            className={inputClass}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Imię klienta…"
          />
        </Field>

        <Field label="Usługa">
          <select
            className={inputClass}
            value={serviceName}
            onChange={(e) => applyCatalog(e.target.value)}
          >
            {SERVICE_CATALOG.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
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
  )
}
