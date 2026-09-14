import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  ArrowLeft,
  CalendarPlus,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import type { SalonStore } from '../hooks/useSalonStore'
import {
  clientFullName,
  formatPhone,
  formatPrice,
  type Client,
} from '../types'
import { ClientForm } from './ClientForm'
import { ServiceForm } from './ServiceForm'
import { btnGhost, btnPrimary, btnSecondary } from './ui'

type ClientDetailProps = {
  client: Client
  store: SalonStore
  onBack: () => void
  onBook: (clientId: string) => void
}

export function ClientDetail({
  client,
  store,
  onBack,
  onBook,
}: ClientDetailProps) {
  const [editing, setEditing] = useState(false)
  const [addingService, setAddingService] = useState(false)

  const totalSpent = client.services.reduce((s, svc) => s + svc.price, 0)

  return (
    <div className="animate-fade-up space-y-6">
      <button type="button" className={btnGhost} onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Wróć do listy
      </button>

      <header className="overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-sm shadow-ink/5">
        <div className="relative bg-gradient-to-br from-forest to-forest-deep px-6 py-8 text-sand sm:px-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 85% 20%, rgba(232,213,196,0.45), transparent 40%)',
            }}
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sand/15 font-display text-2xl font-semibold text-sand backdrop-blur">
                {client.firstName[0]}
                {client.lastName[0]}
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {clientFullName(client)}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sand/80">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {formatPhone(client.phone)}
                  </span>
                  {client.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {client.email}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-sand/15 px-4 py-2.5 text-sm font-semibold text-sand backdrop-blur transition hover:bg-sand/25"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
                Edytuj
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-sand px-4 py-2.5 text-sm font-semibold text-forest transition hover:bg-white"
                onClick={() => onBook(client.id)}
              >
                <CalendarPlus className="h-4 w-4" />
                Umów wizytę
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-line p-6 sm:grid-cols-3">
          <Metric label="Usługi" value={String(client.services.length)} />
          <Metric label="Suma wizyt" value={formatPrice(totalSpent)} />
          <Metric
            label="Klient od"
            value={format(parseISO(client.createdAt), 'd MMM yyyy', {
              locale: pl,
            })}
          />
        </div>

        {client.notes && (
          <div className="border-t border-line bg-fog/50 px-6 py-4 text-sm text-ink-muted">
            <span className="font-semibold text-ink">Notatki: </span>
            {client.notes}
          </div>
        )}
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Historia usług
          </h2>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setAddingService(true)}
          >
            <Plus className="h-4 w-4" />
            Dodaj usługę
          </button>
        </div>

        {client.services.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-surface/70 px-6 py-12 text-center">
            <p className="font-display text-xl text-ink">Brak usług</p>
            <p className="mt-1 text-sm text-ink-muted">
              Dodaj pierwszą usługę do historii klienta.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {client.services.map((svc) => (
              <li
                key={svc.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-line/70 bg-surface px-5 py-4 transition hover:border-leaf/30"
              >
                <div>
                  <p className="font-semibold text-ink">{svc.name}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {format(parseISO(svc.date), 'd MMMM yyyy', { locale: pl })}
                    {' · '}
                    {svc.durationMin} min
                  </p>
                  {svc.notes && (
                    <p className="mt-1 text-sm text-ink-muted/80">{svc.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-semibold text-forest">
                    {formatPrice(svc.price)}
                  </span>
                  <button
                    type="button"
                    className="rounded-xl p-2 text-ink-muted transition hover:bg-mist hover:text-blush"
                    aria-label="Usuń usługę"
                    onClick={() => {
                      if (confirm('Usunąć tę usługę z historii?')) {
                        store.deleteService(client.id, svc.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-end border-t border-line/60 pt-4">
        <button
          type="button"
          className={`${btnSecondary} text-blush hover:border-blush/40`}
          onClick={() => {
            if (
              confirm(
                `Usunąć klienta ${clientFullName(client)}? Tej operacji nie można cofnąć.`,
              )
            ) {
              store.deleteClient(client.id)
              onBack()
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          Usuń klienta
        </button>
      </div>

      {editing && (
        <ClientForm
          title="Edytuj klienta"
          initial={client}
          onClose={() => setEditing(false)}
          onSave={(data) => {
            store.updateClient(client.id, data)
            setEditing(false)
          }}
        />
      )}

      {addingService && (
        <ServiceForm
          catalog={store.catalog}
          onClose={() => setAddingService(false)}
          onSave={(data) => {
            store.addService(client.id, data)
            setAddingService(false)
          }}
        />
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold text-forest">
        {value}
      </p>
    </div>
  )
}
