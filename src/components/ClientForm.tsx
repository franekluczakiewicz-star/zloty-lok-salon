import { useState } from 'react'
import type { Client } from '../types'
import { Field, Modal, btnPrimary, btnSecondary, inputClass } from './ui'

type ClientFormProps = {
  initial?: Partial<Client>
  onClose: () => void
  onSave: (data: {
    firstName: string
    lastName: string
    phone: string
    email?: string
    notes?: string
  }) => void
  title?: string
}

export function ClientForm({
  initial,
  onClose,
  onSave,
  title = 'Nowy klient',
}: ClientFormProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError('Imię, nazwisko i telefon są wymagane.')
      return
    }
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Imię">
            <input
              className={inputClass}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Anna"
              autoFocus
            />
          </Field>
          <Field label="Nazwisko">
            <input
              className={inputClass}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Kowalska"
            />
          </Field>
        </div>
        <Field label="Telefon">
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="501 234 567"
            inputMode="tel"
          />
        </Field>
        <Field label="E-mail (opcjonalnie)">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="klient@email.com"
          />
        </Field>
        <Field label="Notatki">
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Preferencje, alergie, uwagi…"
          />
        </Field>
        {error && <p className="text-sm text-blush">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Anuluj
          </button>
          <button type="submit" className={btnPrimary}>
            Zapisz
          </button>
        </div>
      </form>
    </Modal>
  )
}
