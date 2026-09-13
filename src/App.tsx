import { useState } from 'react'
import { CalendarView } from './components/CalendarView'
import { ClientDetail } from './components/ClientDetail'
import { ClientsView } from './components/ClientsView'
import { Sidebar } from './components/Sidebar'
import { useSalonStore } from './hooks/useSalonStore'
import type { View } from './types'

export default function App() {
  const store = useSalonStore()
  const [view, setView] = useState<View>('calendar')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

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
            onBook={() => setView('calendar')}
          />
        )}

        {view === 'client-detail' && !selectedClient && (
          <ClientsView store={store} onOpenClient={openClient} />
        )}

        {view === 'calendar' && <CalendarView store={store} />}
      </main>
    </div>
  )
}
