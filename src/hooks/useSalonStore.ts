import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSeedAppointments, seedClients } from '../data/seed'
import type { Appointment, Client, ServiceRecord } from '../types'
import { createId, normalizePhone } from '../types'

const STORAGE_KEY = 'zloty-lok-v4'

type StoreData = {
  clients: Client[]
  appointments: Appointment[]
}

function loadStore(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as StoreData
    }
  } catch {
    /* ignore */
  }
  const clients = seedClients
  return {
    clients,
    appointments: createSeedAppointments(clients),
  }
}

export function useSalonStore() {
  const [data] = useState(() => loadStore())
  const [clients, setClients] = useState<Client[]>(data.clients)
  const [appointments, setAppointments] = useState<Appointment[]>(
    data.appointments,
  )

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ clients, appointments }),
    )
  }, [clients, appointments])

  const addClient = useCallback(
    (data: Omit<Client, 'id' | 'services' | 'createdAt'>) => {
      const client: Client = {
        ...data,
        id: createId(),
        services: [],
        createdAt: new Date().toISOString(),
      }
      setClients((prev) => [client, ...prev])
      return client
    },
    [],
  )

  const updateClient = useCallback(
    (id: string, data: Partial<Omit<Client, 'id' | 'services'>>) => {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
      )
    },
    [],
  )

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
    setAppointments((prev) => prev.filter((a) => a.clientId !== id))
  }, [])

  const addService = useCallback(
    (clientId: string, service: Omit<ServiceRecord, 'id'>) => {
      const record: ServiceRecord = { ...service, id: createId() }
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                services: [record, ...c.services].sort((a, b) =>
                  b.date.localeCompare(a.date),
                ),
              }
            : c,
        ),
      )
      return record
    },
    [],
  )

  const deleteService = useCallback((clientId: string, serviceId: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, services: c.services.filter((s) => s.id !== serviceId) }
          : c,
      ),
    )
  }, [])

  const addAppointment = useCallback(
    (data: Omit<Appointment, 'id'>) => {
      const appointment: Appointment = { ...data, id: createId() }
      setAppointments((prev) => [...prev, appointment])
      return appointment
    },
    [],
  )

  const updateAppointment = useCallback(
    (id: string, data: Partial<Omit<Appointment, 'id'>>) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data } : a)),
      )
    },
    [],
  )

  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const searchClients = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase()
      if (!q) return clients

      const phoneQ = normalizePhone(q)
      return clients.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
        const phone = normalizePhone(c.phone)
        return (
          fullName.includes(q) ||
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          (phoneQ.length > 0 && phone.includes(phoneQ)) ||
          (c.email?.toLowerCase().includes(q) ?? false)
        )
      })
    },
    [clients],
  )

  const getClient = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients],
  )

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayAppointments = appointments.filter(
      (a) => a.date === today && a.status === 'planned',
    )
    return {
      clientsCount: clients.length,
      todayCount: todayAppointments.length,
      totalServices: clients.reduce((sum, c) => sum + c.services.length, 0),
    }
  }, [clients, appointments])

  return {
    clients,
    appointments,
    stats,
    addClient,
    updateClient,
    deleteClient,
    addService,
    deleteService,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    searchClients,
    getClient,
  }
}

export type SalonStore = ReturnType<typeof useSalonStore>
