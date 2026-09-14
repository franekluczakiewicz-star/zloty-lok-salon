import { useState } from 'react'
import type { ServiceCatalogItem } from '../types'
import { ServiceCatalogSelect } from './PriceListView'
import { Field, Modal, btnPrimary, btnSecondary, inputClass } from './ui'

type ServiceFormProps = {
  catalog: ServiceCatalogItem[]
  onClose: () => void
  onSave: (data: {
    name: string
    price: number
    durationMin: number
    notes?: string
    date: string
  }) => void
}

export function ServiceForm({ catalog, onClose, onSave }: ServiceFormProps) {
  const first = catalog[0]
  const [name, setName] = useState<string>(first?.name ?? '')
  const [price, setPrice] = useState(String(first?.price ?? 0))
  const [durationMin, setDurationMin] = useState(
    String(first?.durationMin ?? 30),
  )
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function applyCatalog(catalogName: string) {
    const item = catalog.find((s) => s.name === catalogName)
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
    if (
      !name.trim() ||
      !date ||
      Number.isNaN(priceNum) ||
      Number.isNaN(durationNum)
    ) {
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
        <Field label="Usługa z cennika">
          <ServiceCatalogSelect
            catalog={catalog}
            value={catalog.some((s) => s.name === name) ? name : ''}
            onChange={(v) => {
              if (v) applyCatalog(v)
            }}
            allowEmpty
            emptyLabel="Własna / wybierz…"
          />
        </Field>
        <Field label="Nazwa usługi">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Strzyżenie z modelowaniem — średnie"
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
