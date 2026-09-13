import { Phone, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SalonStore } from '../hooks/useSalonStore'
import type { Client } from '../types'
import { clientFullName, formatPhone, formatPrice } from '../types'
import { ClientForm } from './ClientForm'
import { btnPrimary, btnSecondary } from './ui'

type ClientsViewProps = {
  store: SalonStore
  onOpenClient: (id: string) => void
}

export function ClientsView({ store, onOpenClient }: ClientsViewProps) {
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)

  const results = useMemo(
    () => store.searchClients(query),
    [store, query],
  )

  return (
    <div className="animate-fade-up space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Klienci
          </h1>
          <p className="mt-1 text-ink-muted">
            Baza klientów, historia usług i szybkie wyszukiwanie po telefonie.
          </p>
        </div>
        <button
          type="button"
          className={btnPrimary}
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          Dodaj klienta
        </button>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po telefonie, imieniu lub nazwisku…"
          className="w-full rounded-3xl border border-line bg-surface py-4 pr-12 pl-12 text-base shadow-sm shadow-ink/5 outline-none transition placeholder:text-ink-muted/60 focus:border-leaf focus:ring-2 focus:ring-leaf/20"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:bg-mist hover:text-ink"
            aria-label="Wyczyść"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          query={query}
          onAdd={() => setShowForm(true)}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map((client, i) => (
            <ClientCard
              key={client.id}
              client={client}
              delay={i}
              onClick={() => onOpenClient(client.id)}
            />
          ))}
        </ul>
      )}

      {showForm && (
        <ClientForm
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            const client = store.addClient(data)
            setShowForm(false)
            onOpenClient(client.id)
          }}
        />
      )}
    </div>
  )
}

function ClientCard({
  client,
  onClick,
  delay,
}: {
  client: Client
  onClick: () => void
  delay: number
}) {
  const spent = client.services.reduce((s, svc) => s + svc.price, 0)
  const lastService = client.services[0]

  return (
    <li
      className="animate-fade-up"
      style={{ animationDelay: `${Math.min(delay, 8) * 0.04}s` }}
    >
      <button
        type="button"
        onClick={onClick}
        className="group w-full rounded-3xl border border-line/80 bg-surface p-5 text-left shadow-sm shadow-ink/5 transition hover:-translate-y-0.5 hover:border-leaf/40 hover:shadow-md hover:shadow-forest/10"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist font-display text-lg font-semibold text-forest transition group-hover:bg-forest group-hover:text-sand">
              {client.firstName[0]}
              {client.lastName[0]}
            </div>
            <div>
              <p className="font-semibold text-ink">{clientFullName(client)}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                <Phone className="h-3.5 w-3.5" />
                {formatPhone(client.phone)}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-fog px-2.5 py-1 text-xs font-medium text-ink-muted">
            {client.services.length} usług
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-sm">
          <span className="text-ink-muted">
            {lastService ? lastService.name : 'Brak historii'}
          </span>
          <span className="font-semibold text-forest">
            {spent > 0 ? formatPrice(spent) : '—'}
          </span>
        </div>
      </button>
    </li>
  )
}

function EmptyState({
  query,
  onAdd,
}: {
  query: string
  onAdd: () => void
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-16 text-center">
      <p className="font-display text-2xl text-ink">
        {query ? 'Nic nie znaleziono' : 'Brak klientów'}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-ink-muted">
        {query
          ? `Brak wyników dla „${query}”. Sprawdź numer telefonu lub dodaj nowego klienta.`
          : 'Dodaj pierwszego klienta, aby prowadzić historię usług i wizyty.'}
      </p>
      <button type="button" className={`${btnSecondary} mt-6`} onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Nowy klient
      </button>
    </div>
  )
}
