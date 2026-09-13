import { useState } from 'react'
import { SERVICE_CATALOG } from '../types'
import { Field, Modal, btnPrimary, btnSecondary, inputClass } from './ui'

type ServiceFormProps = {
  onClose: () => void
  onSave: (data: {
    name: string
    price: number
    durationMin: number
    notes?: string
    date: string
  }) => void
}

export function ServiceForm({ onClose, onSave }: ServiceFormProps) {
  const [name, setName] = useState<string>(SERVICE_CATALOG[0].name)
  const [price, setPrice] = useState(String(SERVICE_CATALOG[0].price))
  const [durationMin, setDurationMin] = useState(
    String(SERVICE_CATALOG[0].durationMin),
  )
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function applyCatalog(catalogName: string) {
    const item = SERVICE_CATALOG.find((s) => s.name === catalogName)
    setName(catalogName)
    if (item) {
      setPrice(String(item.price))
      setDurationMin(String(item.durationMin))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceNum = Number(price)
    const durationNum = Number(durationMin)
    if (!name.trim() || !date || Number.isNaN(priceNum) || Number.isNaN(durationNum)) {
      setError('Uzupełnij poprawnie nazwę, datę, cenę i czas.')
      return
    }
    onSave({
      name: name.trim(),
      price: priceNum,
      durationMin: durationNum,
      date,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <Modal title="Dodaj usługę" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Usługa z katalogu">
          <select
            className={inputClass}
            value={SERVICE_CATALOG.some((s) => s.name === name) ? name : ''}
            onChange={(e) => {
              if (e.target.value) applyCatalog(e.target.value)
            }}
          >
            <option value="">Własna / wybierz…</option>
            {SERVICE_CATALOG.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name} — {s.price} zł
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nazwa usługi">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Strzyżenie damskie"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Data">
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
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
            placeholder="Kolor, długość, uwagi techniczne…"
          />
        </Field>
        {error && <p className="text-sm text-blush">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Anuluj
          </button>
          <button type="submit" className={btnPrimary}>
            Zapisz usługę
          </button>
        </div>
      </form>
    </Modal>
  )
}
