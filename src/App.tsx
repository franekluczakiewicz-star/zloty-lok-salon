import { Component, type ErrorInfo, type ReactNode, useState } from 'react'
import { CalendarView } from './components/CalendarView'
import { ClientDetail } from './components/ClientDetail'
import { ClientsView } from './components/ClientsView'
import { DyeReportView } from './components/DyeReportView'
import { HistoryView } from './components/HistoryView'
import { PriceListView } from './components/PriceListView'
import { ScheduleView } from './components/ScheduleView'
import { Sidebar } from './components/Sidebar'
import { useSalonStore } from './hooks/useSalonStore'
import type { View } from './types'

const STORAGE_KEY = 'zloty-lok-v8'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Złoty Lok crash:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink">
            Coś poszło nie tak
          </h1>
          <p className="text-sm text-ink-muted">
            Aplikacja nie mogła się wczytać. Najczęściej pomaga wyczyszczenie
            lokalnych danych i odświeżenie strony.
          </p>
          <pre className="overflow-auto rounded-2xl bg-fog p-3 text-left text-xs text-blush">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="rounded-2xl bg-forest px-5 py-3 text-sm font-semibold text-sand"
            onClick={() => {
              try {
                localStorage.removeItem(STORAGE_KEY)
              } catch {
                /* ignore */
              }
              window.location.reload()
            }}
          >
            Wyczyść dane i odśwież
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function SalonApp() {
  const store = useSalonStore()
  const [view, setView] = useState<View>('calendar')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [bookClientId, setBookClientId] = useState<string | null>(null)

  const selectedClient = selectedClientId
    ? store.getClient(selectedClientId)
    : undefined

  function openClient(id: string) {
    setSelectedClientId(id)
    setView('client-detail')
  }

  function goClients() {
    setView('clients')
    setSelectedClientId(null)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:px-8 lg:py-10">
      <Sidebar
        view={view}
        onNavigate={(v) => {
          if (v === 'clients') goClients()
          else setView(v)
        }}
        stats={store.stats}
      />

      <main className="min-w-0 flex-1 pb-10">
        {view === 'clients' && (
          <ClientsView store={store} onOpenClient={openClient} />
        )}

        {view === 'client-detail' && selectedClient && (
          <ClientDetail
            client={selectedClient}
            store={store}
            onBack={goClients}
            onBook={(clientId) => {
              setBookClientId(clientId)
              setView('calendar')
            }}
          />
        )}

        {view === 'client-detail' && !selectedClient && (
          <ClientsView store={store} onOpenClient={openClient} />
        )}

        {view === 'calendar' && (
          <CalendarView
            store={store}
            initialClientId={bookClientId}
            onInitialClientConsumed={() => setBookClientId(null)}
          />
        )}

        {view === 'schedule' && (
          <ScheduleView
            schedules={store.schedules}
            onUpdate={store.updateSchedule}
          />
        )}

        {view === 'prices' && <PriceListView store={store} />}

        {view === 'dyes' && <DyeReportView store={store} />}

        {view === 'history' && <HistoryView store={store} />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <SalonApp />
    </ErrorBoundary>
  )
}
