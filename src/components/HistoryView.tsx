import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { RotateCcw, Trash2 } from 'lucide-react'
import type { SalonStore } from '../hooks/useSalonStore'
import { STYLISTS, formatPrice } from '../types'
import { btnSecondary } from './ui'

type HistoryViewProps = {
  store: SalonStore
}

export function HistoryView({ store }: HistoryViewProps) {
  const items = store.deletedAppointments

  return (
    <div className="animate-fade-up space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Historia
          </h1>
          <p className="mt-1 text-ink-muted">
            Usunięte wizyty — możesz je przywrócić albo usunąć na stałe.
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              if (confirm('Wyczyścić całą historię usuniętych wizyt?')) {
                store.clearDeletedAppointments()
              }
            }}
          >
            Wyczyść historię
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line/80 bg-surface/60 px-6 py-16 text-center">
          <p className="font-display text-xl text-ink">Brak usuniętych wizyt</p>
          <p className="mt-2 text-sm text-ink-muted">
            Gdy usuniesz wizytę z terminarza, pojawi się tutaj.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((apt) => {
            const stylist = STYLISTS.find((s) => s.id === apt.stylistId)
            let deletedLabel = apt.deletedAt
            try {
              deletedLabel = format(
                parseISO(apt.deletedAt),
                "d MMM yyyy, HH:mm",
                { locale: pl },
              )
            } catch {
              /* keep raw */
            }
            let visitLabel = apt.date
            try {
              visitLabel = format(parseISO(apt.date), 'd MMMM yyyy', {
                locale: pl,
              })
            } catch {
              /* keep raw */
            }

            return (
              <li
                key={`${apt.id}-${apt.deletedAt}`}
                className="flex flex-col gap-4 rounded-3xl border border-line/80 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-display text-xl font-semibold text-ink">
                    {apt.personName}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {visitLabel} · {apt.time} · {apt.durationMin} min
                    {stylist ? ` · ${stylist.name}` : ''}
                  </p>
                  <p className="mt-0.5 text-sm text-ink">
                    {apt.serviceName} · {formatPrice(apt.price)}
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Usunięto: {deletedLabel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:shrink-0">
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
                      if (confirm('Usunąć wizytę na stałe? Nie da się jej odzyskać.')) {
                        store.permanentlyDeleteAppointment(apt.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Usuń na stałe
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
