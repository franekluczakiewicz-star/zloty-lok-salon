export type ServiceRecord = {
  id: string
  name: string
  price: number
  durationMin: number
  notes?: string
  date: string
}

export type Client = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  notes?: string
  services: ServiceRecord[]
  createdAt: string
}

export type StylistId = 'ania' | 'ewa' | 'roksana'

export type Stylist = {
  id: StylistId
  name: string
  shortName: string
  color: string
}

/** Fryzjerki do wyboru przy nowej wizycie */
export const STYLISTS: Stylist[] = [
  { id: 'ania', name: 'Ania', shortName: 'Ania', color: '#c9a98a' },
  { id: 'ewa', name: 'Ewa', shortName: 'Ewa', color: '#1b4d3e' },
  { id: 'roksana', name: 'Roksana', shortName: 'Roksana', color: '#8b5e5e' },
]

export type AppointmentStatus = 'planned' | 'done' | 'cancelled'

export type Appointment = {
  id: string
  stylistId: StylistId
  clientId?: string
  personName: string
  serviceName: string
  date: string
  time: string
  durationMin: number
  price: number
  status: AppointmentStatus
  notes?: string
}

export type View = 'clients' | 'calendar' | 'client-detail'

export const SERVICE_CATALOG = [
  { name: 'Strzyżenie damskie', price: 90, durationMin: 45 },
  { name: 'Strzyżenie męskie', price: 60, durationMin: 30 },
  { name: 'Koloryzacja', price: 220, durationMin: 120 },
  { name: 'Balayage', price: 350, durationMin: 150 },
  { name: 'Modelowanie', price: 80, durationMin: 40 },
  { name: 'Regeneracja', price: 120, durationMin: 60 },
  { name: 'Fryzura okolicznościowa', price: 180, durationMin: 90 },
] as const

export function createId() {
  return crypto.randomUUID()
}

export function getStylist(id: StylistId) {
  return STYLISTS.find((s) => s.id === id) ?? STYLISTS[0]
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export function formatPhone(phone: string) {
  const digits = normalizePhone(phone)
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  if (digits.length === 11 && digits.startsWith('48')) {
    return `+48 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }
  return phone
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(price)
}

export function clientFullName(client: Client) {
  return `${client.firstName} ${client.lastName}`
}
