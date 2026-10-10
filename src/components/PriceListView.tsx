import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SalonStore } from '../hooks/useSalonStore'
import {
  servicesByCategory,
  type ServiceCatalogItem,
} from '../types'
import {
  Field,
  Modal,
  btnPrimary,
  btnSecondary,
  inputClass,
} from './ui'

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
  const categories = useMemo(
    () => groups.map((g) => g.category),
    [groups],
  )
  const [savedName, setSavedName] = useState<string | null>(null)
  const [adding, setAdding] = useState<{ category?: string } | null>(null)

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

  function handleDurationChange(name: string, durationRaw: string) {
    const durationMin = Number(durationRaw)
    if (Number.isNaN(durationMin) || durationMin < 5) return
    store.updateCatalogItem(name, { durationMin })
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
            Dodawaj, edytuj i usuwaj usługi — zmiany zapisują się automatycznie.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setAdding({})}
          >
            <Plus className="h-4 w-4" />
            Nowa usługa
          </button>
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
        </div>
      </header>

      <div className="space-y-4">
        {groups.map(({ category, items }) => (
          <section
            key={category}
            className="overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-sm shadow-ink/5"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-forest px-5 py-3">
              <h2 className="font-display text-lg font-semibold tracking-wide text-sand uppercase">
                {category}
              </h2>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sand/15 px-3 py-1.5 text-xs font-semibold text-sand transition hover:bg-sand/25"
                onClick={() => setAdding({ category })}
              >
                <Plus className="h-3.5 w-3.5" />
                Dodaj
              </button>
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
                    <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                      Czas
                      <input
                        type="number"
                        min={5}
                        step={5}
                        className={`${inputClass} w-20 py-2`}
                        value={item.durationMin}
                        onChange={(e) =>
                          handleDurationChange(item.name, e.target.value)
                        }
                      />
                      <span>min</span>
                    </label>
                    <button
                      type="button"
                      className="rounded-xl p-2 text-ink-muted transition hover:bg-blush/15 hover:text-blush"
                      aria-label={`Usuń ${item.name}`}
                      onClick={() => {
                        if (
                          confirm(
                            `Usunąć usługę „${item.name}” z cennika?`,
                          )
                        ) {
                          store.deleteCatalogItem(item.name)
                          if (savedName === item.name) setSavedName(null)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
              {items.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-ink-muted">
                  Brak usług w tej kategorii.
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>

      {store.catalog.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line/80 bg-surface/60 px-6 py-16 text-center">
          <p className="font-display text-xl text-ink">Cennik jest pusty</p>
          <p className="mt-2 text-sm text-ink-muted">
            Dodaj pierwszą usługę albo przywróć domyślny cennik.
          </p>
          <button
            type="button"
            className={`${btnPrimary} mt-4`}
            onClick={() => setAdding({})}
          >
            <Plus className="h-4 w-4" />
            Nowa usługa
          </button>
        </div>
      )}

      <p className="text-center text-xs text-ink-muted">
        {store.catalog.length} usług · {groups.length}{' '}
        {groups.length === 1 ? 'kategoria' : 'kategorie'}
      </p>

      {adding && (
        <AddServiceModal
          categories={categories}
          initialCategory={adding.category}
          existingNames={store.catalog.map((c) => c.name)}
          onClose={() => setAdding(null)}
          onSave={(item) => {
            const name = store.addCatalogItem(item)
            if (!name) return
            setSavedName(name)
            setAdding(null)
          }}
        />
      )}
    </div>
  )
}

function AddServiceModal({
  categories,
  initialCategory,
  existingNames,
  onClose,
  onSave,
}: {
  categories: string[]
  initialCategory?: string
  existingNames: string[]
  onClose: () => void
  onSave: (item: ServiceCatalogItem) => void
}) {
  const [categoryMode, setCategoryMode] = useState<'existing' | 'new'>(
    initialCategory || categories.length > 0 ? 'existing' : 'new',
  )
  const [category, setCategory] = useState(
    initialCategory || categories[0] || '',
  )
  const [newCategory, setNewCategory] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('50')
  const [priceLabel, setPriceLabel] = useState('')
  const [durationMin, setDurationMin] = useState('30')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const cat =
      categoryMode === 'new' ? newCategory.trim() : category.trim()
    const priceNum = Number(price)
    const durationNum = Number(durationMin)

    if (!trimmedName) {
      setError('Podaj nazwę usługi.')
      return
    }
    if (existingNames.includes(trimmedName)) {
      setError('Usługa o takiej nazwie już istnieje.')
      return
    }
    if (!cat) {
      setError('Wybierz lub wpisz kategorię.')
      return
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Cena musi być liczbą.')
      return
    }
    if (Number.isNaN(durationNum) || durationNum < 5) {
      setError('Czas musi wynosić co najmniej 5 minut.')
      return
    }

    onSave({
      category: cat,
      name: trimmedName,
      price: priceNum,
      priceLabel: priceLabel.trim() || `${priceNum} zł`,
      durationMin: durationNum,
    })
  }

  return (
    <Modal title="Nowa usługa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Kategoria
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                categoryMode === 'existing'
                  ? 'bg-mist text-forest'
                  : 'bg-fog text-ink-muted hover:text-ink'
              }`}
              onClick={() => setCategoryMode('existing')}
              disabled={categories.length === 0}
            >
              Istniejąca
            </button>
            <button
              type="button"
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                categoryMode === 'new'
                  ? 'bg-mist text-forest'
                  : 'bg-fog text-ink-muted hover:text-ink'
              }`}
              onClick={() => setCategoryMode('new')}
            >
              Nowa kategoria
            </button>
          </div>
          {categoryMode === 'existing' ? (
            <select
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={inputClass}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="np. Pielęgnacja"
            />
          )}
        </div>

        <Field label="Nazwa usługi">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Strzyżenie + modelowanie"
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cena (zł)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={price}
              onChange={(e) => {
                setPrice(e.target.value)
                if (!priceLabel) {
                  /* keep empty — auto label on save */
                }
              }}
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

        <Field label="Etykieta ceny (opcjonalnie)">
          <input
            className={inputClass}
            value={priceLabel}
            onChange={(e) => setPriceLabel(e.target.value)}
            placeholder={`np. ${price || '50'} zł albo 80–100 zł`}
          />
        </Field>

        {error && <p className="text-sm text-blush">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Anuluj
          </button>
          <button type="submit" className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Dodaj do cennika
          </button>
        </div>
      </form>
    </Modal>
  )
}
