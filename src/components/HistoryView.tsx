import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Eye, RotateCcw, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SalonStore } from '../hooks/useSalonStore'
import {
  APPOINTMENT_STATUS_LABEL,
  STYLISTS,
  formatDyeAmount,
  formatPrice,
  type Appointment,
  type AppointmentStatus,
  type DeletedAppointment,
} from '../types'
import { Modal, btnSecondary } from './ui'

type HistoryViewProps = {
  store: SalonStore
}

type FilterKey = 'all' | 'planned' | 'done' | 'no_show' | 'deleted' | 'cancelled'

type HistoryRow =
  | { kind: 'live'; apt: Appointment }
  | { kind: 'deleted'; apt: DeletedAppointment }

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'planned', label: 'Zaplanowane' },
  { id: 'done', label: 'Zakończone' },
  { id: 'no_show', label: 'Nieobecność' },
  { id: 'cancelled', label: 'Anulowane' },
  { id: 'deleted', label: 'Usunięte' },
]

function formatVisitDate(date: string) {
  try {
    return format(parseISO(date), 'd MMMM yyyy', { locale: pl })
  } catch {
    return date
  }
}

function formatDateTime(iso: string) {
  try {
    return format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: pl })
  } catch {
    return iso
  }
}

export function HistoryView({ store }: HistoryViewProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [details, setDetails] = useState<HistoryRow | null>(null)

  const rows = useMemo(() => {
    const live: HistoryRow[] = store.appointments.map((apt) => ({
      kind: 'live',
      apt,
    }))
    const deleted: HistoryRow[] = store.deletedAppointments.map((apt) => ({
      kind: 'deleted',
      apt,
    }))
    return [...live, ...deleted].sort((a, b) => {
      const aKey = `${a.apt.date}${a.apt.time}${a.kind === 'deleted' ? a.apt.deletedAt : ''}`
      const bKey = `${b.apt.date}${b.apt.time}${b.kind === 'deleted' ? b.apt.deletedAt : ''}`
      return bKey.localeCompare(aKey)
    })
  }, [store.appointments, store.deletedAppointments])

  const filtered = useMemo(() => {
    if (filter === 'all') return rows
    if (filter === 'deleted') return rows.filter((r) => r.kind === 'deleted')
    return rows.filter(
      (r) => r.kind === 'live' && r.apt.status === (filter as AppointmentStatus),
    )
  }, [rows, filter])

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: rows.length,
      planned: 0,
      done: 0,
      no_show: 0,
      cancelled: 0,
      deleted: store.deletedAppointments.length,
    }
    for (const r of rows) {
      if (r.kind === 'live') c[r.apt.status] += 1
    }
    return c
  }, [rows, store.deletedAppointments.length])

  return (
    <div className="animate-fade-up space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Historia
          </h1>
          <p className="mt-1 text-ink-muted">
            Wszystkie wizyty — zaplanowane, zakończone, usunięte i nieobecności.
          </p>
        </div>
        {store.deletedAppointments.length > 0 && (
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              if (confirm('Wyczyścić całą listę usuniętych wizyt?')) {
                store.clearDeletedAppointments()
              }
            }}
          >
            Wyczyść usunięte
          </button>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-forest text-sand'
                  : 'bg-surface text-ink-muted ring-1 ring-line hover:text-ink'
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-70">{counts[f.id]}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line/80 bg-surface/60 px-6 py-16 text-center">
          <p className="font-display text-xl text-ink">Brak wizyt w tym filtrze</p>
          <p className="mt-2 text-sm text-ink-muted">
            Zmień filtr albo dodaj wizyty w terminarzu.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((row) => {
            const apt = row.apt
            const stylist = STYLISTS.find((s) => s.id === apt.stylistId)
            const statusLabel =
              row.kind === 'deleted'
                ? 'Usunięta'
                : APPOINTMENT_STATUS_LABEL[apt.status]
            const done = row.kind === 'live' && apt.status === 'done'
            const noShow = row.kind === 'live' && apt.status === 'no_show'
            const key =
              row.kind === 'deleted'
                ? `del-${apt.id}-${apt.deletedAt}`
                : `live-${apt.id}`

            return (
              <li
                key={key}
                className="flex flex-col gap-4 rounded-3xl border border-line/80 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div
                  className={`min-w-0 ${done ? 'line-through opacity-80' : ''}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-xl font-semibold text-ink">
                      {apt.personName}
                    </p>
                    <span className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-semibold text-forest no-underline">
                      {statusLabel}
                    </span>
                    {noShow && (
                      <X
                        className="h-5 w-5 text-[#c0392b] no-underline"
                        strokeWidth={3}
                        aria-label="Klient nie przyszedł"
                      />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {formatVisitDate(apt.date)} · {apt.time} · {apt.durationMin}{' '}
                    min
                    {stylist ? ` · ${stylist.name}` : ''}
                  </p>
                  <p className="mt-0.5 text-sm text-ink">
                    {apt.serviceName} · {formatPrice(apt.price)}
                  </p>
                  {row.kind === 'deleted' && (
                    <p className="mt-2 text-xs text-ink-muted">
                      Usunięto: {formatDateTime(apt.deletedAt)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 sm:shrink-0">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-mist"
                    onClick={() => setDetails(row)}
                  >
                    <Eye className="h-4 w-4" />
                    Szczegóły
                  </button>
                  {row.kind === 'deleted' && (
                    <>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-mist px-4 py-2 text-sm font-semibold text-forest transition hover:bg-forest hover:text-sand"
                        onClick={() => store.restoreAppointment(apt.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Przywróć
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blush/40 bg-blush/10 px-4 py-2 text-sm font-semibold text-blush transition hover:bg-blush/20"
                        onClick={() => {
                          if (
                            confirm(
                              'Usunąć wizytę na stałe? Nie da się jej odzyskać.',
                            )
                          ) {
                            store.permanentlyDeleteAppointment(apt.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Usuń na stałe
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {details && (
        <HistoryDetailsModal
          row={details}
          onClose={() => setDetails(null)}
          onRestore={
            details.kind === 'deleted'
              ? () => {
                  store.restoreAppointment(details.apt.id)
                  setDetails(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

function HistoryDetailsModal({
  row,
  onClose,
  onRestore,
}: {
  row: HistoryRow
  onClose: () => void
  onRestore?: () => void
}) {
  const apt = row.apt
  const stylist = STYLISTS.find((s) => s.id === apt.stylistId)
  const statusLabel =
    row.kind === 'deleted' ? 'Usunięta' : APPOINTMENT_STATUS_LABEL[apt.status]

  return (
    <Modal title="Szczegóły wizyty" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
          {statusLabel}
        </p>
        <h3 className="font-display text-2xl font-semibold text-ink">
          {apt.personName}
        </h3>
        <p className="text-sm text-ink-muted">
          {formatVisitDate(apt.date)} · {apt.time} · {apt.durationMin} min
          {stylist ? ` · ${stylist.name}` : ''}
        </p>
        <p className="text-sm text-ink">{apt.serviceName}</p>
        <p className="font-display text-lg font-semibold text-forest">
          {formatPrice(apt.price)}
        </p>
        {(apt.dyeColor || apt.dyeAmountG) && (
          <p className="text-sm text-ink">
            Farba: <span className="font-semibold">{apt.dyeColor || '—'}</span>
            {apt.dyeAmountG != null && (
              <span className="text-ink-muted">
                {' '}
                · {formatDyeAmount(apt.dyeAmountG)}
              </span>
            )}
          </p>
        )}
        {apt.notes && (
          <p className="rounded-2xl bg-fog px-4 py-3 text-sm text-ink-muted">
            {apt.notes}
          </p>
        )}
        {row.kind === 'deleted' && (
          <p className="text-xs text-ink-muted">
            Usunięto: {formatDateTime(apt.deletedAt)}
          </p>
        )}
        {onRestore && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-mist px-4 py-2 text-sm font-semibold text-forest transition hover:bg-forest hover:text-sand"
            onClick={onRestore}
          >
            <RotateCcw className="h-4 w-4" />
            Przywróć do terminarza
          </button>
        )}
      </div>
    </Modal>
  )
}
