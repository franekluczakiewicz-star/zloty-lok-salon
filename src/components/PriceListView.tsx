import { useMemo, useState } from 'react'
import type { SalonStore } from '../hooks/useSalonStore'
import {
  servicesByCategory,
  type ServiceCatalogItem,
} from '../types'
import { btnSecondary, inputClass } from './ui'

export function ServiceCatalogSelect({
  catalog,
  value,
  onChange,
  allowEmpty,
  emptyLabel = 'Wybierz usługę…',
}: {
  catalog: ServiceCatalogItem[]
  value: string
  onChange: (name: string) => void
  allowEmpty?: boolean
  emptyLabel?: string
}) {
  const groups = servicesByCategory(catalog)

  return (
    <select
      className="w-full rounded-2xl border border-line bg-fog px-4 py-3 text-ink outline-none transition focus:border-leaf focus:bg-surface focus:ring-2 focus:ring-leaf/20"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {groups.map(({ category, items }) => (
        <optgroup key={category} label={category}>
          {items.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} — {s.priceLabel}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

type PriceListViewProps = {
  store: SalonStore
}

export function PriceListView({ store }: PriceListViewProps) {
  const groups = useMemo(
    () => servicesByCategory(store.catalog),
    [store.catalog],
  )
  const [savedName, setSavedName] = useState<string | null>(null)

  function handlePriceChange(name: string, priceRaw: string) {
    const price = Number(priceRaw)
    if (Number.isNaN(price) || price < 0) return
    store.updateCatalogItem(name, { price })
    setSavedName(name)
  }

  function handleLabelChange(name: string, priceLabel: string) {
    store.updateCatalogItem(name, { priceLabel })
    setSavedName(name)
  }

  return (
    <div className="animate-fade-up space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Cennik
          </h1>
          <p className="mt-1 text-ink-muted">
            Edytuj ceny usług — zmiany zapisują się automatycznie.
          </p>
        </div>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => {
            if (confirm('Przywrócić domyślny cennik Złoty Lok?')) {
              store.resetCatalog()
              setSavedName(null)
            }
          }}
        >
          Przywróć domyślny
        </button>
      </header>

      <div className="space-y-4">
        {groups.map(({ category, items }) => (
          <section
            key={category}
            className="overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-sm shadow-ink/5"
          >
            <div className="border-b border-line/60 bg-forest px-5 py-3">
              <h2 className="font-display text-lg font-semibold tracking-wide text-sand uppercase">
                {category}
              </h2>
            </div>
            <ul className="divide-y divide-line/50">
              {items.map((item) => (
                <li
                  key={item.name}
                  className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    {savedName === item.name && (
                      <p className="text-[11px] font-medium text-forest">
                        Zapisano
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                      Cena
                      <input
                        type="number"
                        min={0}
                        className={`${inputClass} w-24 py-2`}
                        value={item.price}
                        onChange={(e) =>
                          handlePriceChange(item.name, e.target.value)
                        }
                      />
                      <span>zł</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                      Etykieta
                      <input
                        type="text"
                        className={`${inputClass} w-32 py-2 sm:w-36`}
                        value={item.priceLabel}
                        onChange={(e) =>
                          handleLabelChange(item.name, e.target.value)
                        }
                        placeholder="np. 80–100 zł"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="text-center text-xs text-ink-muted">
        {groups.length} kategorie · edytowalny cennik Złoty Lok
      </p>
    </div>
  )
}
