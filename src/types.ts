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

export type AppointmentStatus = 'planned' | 'done' | 'cancelled' | 'no_show'

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  planned: 'Zaplanowana',
  done: 'Zakończona',
  cancelled: 'Anulowana',
  no_show: 'Klient nie przyszedł',
}

/** Statusy, które znikają z terminarza (zwalniają termin) */
export function isAppointmentInactive(status: AppointmentStatus) {
  return status === 'cancelled'
}

/** Wizyta przekreślona w terminarzu (zrealizowana) */
export function isAppointmentStrikethrough(status: AppointmentStatus) {
  return status === 'done'
}

export type Appointment = {
  id: string
  stylistId: StylistId
  clientId: string
  personName: string
  serviceName: string
  date: string
  time: string
  durationMin: number
  price: number
  status: AppointmentStatus
  notes?: string
  /** Numer / nazwa farby (tylko koloryzacja) */
  dyeColor?: string
  /** Ilość farby w gramach */
  dyeAmountG?: number
}

/** Wizyta przeniesiona do historii (kosz) — można przywrócić */
export type DeletedAppointment = Appointment & {
  deletedAt: string
}

export type View =
  | 'clients'
  | 'calendar'
  | 'client-detail'
  | 'schedule'
  | 'prices'
  | 'history'
  | 'dyes'

export type ServiceCatalogItem = {
  category: string
  name: string
  /** Domyślna / wyjściowa cena do formularza */
  price: number
  /** Tekst z cennika, np. „60–70 zł” */
  priceLabel: string
  durationMin: number
}

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  // Strzyżenie damskie
  {
    category: 'Strzyżenie damskie',
    name: 'Strzyżenie bez modelowania — krótkie',
    price: 50,
    priceLabel: '50 zł',
    durationMin: 30,
  },
  {
    category: 'Strzyżenie damskie',
    name: 'Strzyżenie bez modelowania — średnie',
    price: 60,
    priceLabel: '60–70 zł',
    durationMin: 40,
  },
  {
    category: 'Strzyżenie damskie',
    name: 'Strzyżenie bez modelowania — długie',
    price: 80,
    priceLabel: '80–100 zł',
    durationMin: 50,
  },
  {
    category: 'Strzyżenie damskie',
    name: 'Strzyżenie z modelowaniem — krótkie',
    price: 70,
    priceLabel: '70 zł',
    durationMin: 45,
  },
  {
    category: 'Strzyżenie damskie',
    name: 'Strzyżenie z modelowaniem — średnie',
    price: 80,
    priceLabel: '80–90 zł',
    durationMin: 55,
  },
  {
    category: 'Strzyżenie damskie',
    name: 'Strzyżenie z modelowaniem — długie',
    price: 100,
    priceLabel: '100–120 zł',
    durationMin: 65,
  },
  {
    category: 'Strzyżenie damskie',
    name: 'Strzyżenie na sucho',
    price: 50,
    priceLabel: '50–60 zł',
    durationMin: 30,
  },
  {
    category: 'Strzyżenie damskie',
    name: 'Grzywka',
    price: 10,
    priceLabel: '10–20 zł',
    durationMin: 15,
  },

  // Strzyżenie męskie
  {
    category: 'Strzyżenie męskie',
    name: 'Strzyżenie klasyczne',
    price: 40,
    priceLabel: '40 zł',
    durationMin: 30,
  },
  {
    category: 'Strzyżenie męskie',
    name: 'Strzyżenie + broda',
    price: 55,
    priceLabel: '55 zł',
    durationMin: 40,
  },
  {
    category: 'Strzyżenie męskie',
    name: 'Strzyżenie + odsiwianie',
    price: 60,
    priceLabel: '60 zł',
    durationMin: 45,
  },

  // Dziecięce
  {
    category: 'Strzyżenie dziecięce (do 6 lat)',
    name: 'Strzyżenie klasyczne — chłopiec',
    price: 35,
    priceLabel: '35 zł',
    durationMin: 25,
  },
  {
    category: 'Strzyżenie dziecięce (do 6 lat)',
    name: 'Strzyżenie — dziewczynka',
    price: 40,
    priceLabel: '40–50 zł',
    durationMin: 30,
  },

  // Koloryzacja
  {
    category: 'Koloryzacja',
    name: 'Koloryzacja jednolita — krótkie',
    price: 130,
    priceLabel: '130 zł',
    durationMin: 90,
  },
  {
    category: 'Koloryzacja',
    name: 'Koloryzacja jednolita — średnie',
    price: 140,
    priceLabel: '140–160 zł',
    durationMin: 105,
  },
  {
    category: 'Koloryzacja',
    name: 'Koloryzacja jednolita — długie',
    price: 180,
    priceLabel: '180–250 zł',
    durationMin: 120,
  },
  {
    category: 'Koloryzacja',
    name: 'Pasemka — krótkie',
    price: 150,
    priceLabel: '150–180 zł',
    durationMin: 120,
  },
  {
    category: 'Koloryzacja',
    name: 'Pasemka — średnie',
    price: 180,
    priceLabel: '180–350 zł',
    durationMin: 150,
  },
  {
    category: 'Koloryzacja',
    name: 'Pasemka — długie',
    price: 400,
    priceLabel: '400–600 zł',
    durationMin: 180,
  },
  {
    category: 'Koloryzacja',
    name: 'Air Touch',
    price: 300,
    priceLabel: '300–600 zł',
    durationMin: 180,
  },
  {
    category: 'Koloryzacja',
    name: 'Balayage — krótkie',
    price: 180,
    priceLabel: '180–230 zł',
    durationMin: 150,
  },
  {
    category: 'Koloryzacja',
    name: 'Balayage — średnie',
    price: 230,
    priceLabel: '230–280 zł',
    durationMin: 165,
  },
  {
    category: 'Koloryzacja',
    name: 'Balayage — długie',
    price: 280,
    priceLabel: '280–600 zł',
    durationMin: 180,
  },
  {
    category: 'Koloryzacja',
    name: 'Ombre / Sombre — średnie',
    price: 250,
    priceLabel: '250–350 zł',
    durationMin: 150,
  },
  {
    category: 'Koloryzacja',
    name: 'Ombre / Sombre — długie',
    price: 350,
    priceLabel: '350–600 zł',
    durationMin: 180,
  },
  {
    category: 'Koloryzacja',
    name: 'Tonowanie — krótkie',
    price: 100,
    priceLabel: '100–130 zł',
    durationMin: 45,
  },
  {
    category: 'Koloryzacja',
    name: 'Tonowanie — średnie',
    price: 120,
    priceLabel: '120–150 zł',
    durationMin: 50,
  },
  {
    category: 'Koloryzacja',
    name: 'Tonowanie — długie',
    price: 150,
    priceLabel: '150–220 zł',
    durationMin: 60,
  },
  {
    category: 'Koloryzacja',
    name: 'Dekoloryzacja globalna — krótkie',
    price: 200,
    priceLabel: '200–250 zł',
    durationMin: 150,
  },
  {
    category: 'Koloryzacja',
    name: 'Dekoloryzacja globalna — średnie',
    price: 250,
    priceLabel: '250–350 zł',
    durationMin: 180,
  },
  {
    category: 'Koloryzacja',
    name: 'Dekoloryzacja globalna — długie',
    price: 350,
    priceLabel: '350–500 zł',
    durationMin: 210,
  },

  // Stylizacja
  {
    category: 'Stylizacja i modelowanie',
    name: 'Modelowanie — krótkie',
    price: 30,
    priceLabel: '30 zł',
    durationMin: 30,
  },
  {
    category: 'Stylizacja i modelowanie',
    name: 'Modelowanie — średnie',
    price: 40,
    priceLabel: '40 zł',
    durationMin: 35,
  },
  {
    category: 'Stylizacja i modelowanie',
    name: 'Modelowanie — długie',
    price: 50,
    priceLabel: '50 zł',
    durationMin: 40,
  },
  {
    category: 'Stylizacja i modelowanie',
    name: 'Upięcie',
    price: 80,
    priceLabel: '80–120 zł',
    durationMin: 60,
  },
  {
    category: 'Stylizacja i modelowanie',
    name: 'Loki / Fale — krótkie',
    price: 50,
    priceLabel: '50 zł',
    durationMin: 40,
  },
  {
    category: 'Stylizacja i modelowanie',
    name: 'Loki / Fale — średnie',
    price: 60,
    priceLabel: '60–70 zł',
    durationMin: 50,
  },
  {
    category: 'Stylizacja i modelowanie',
    name: 'Loki / Fale — długie',
    price: 80,
    priceLabel: '80–120 zł',
    durationMin: 60,
  },
]

export const DEFAULT_SERVICE_CATALOG: ServiceCatalogItem[] = SERVICE_CATALOG

export function servicesByCategory(catalog: ServiceCatalogItem[] = SERVICE_CATALOG) {
  const categories = [...new Set(catalog.map((s) => s.category))]
  return categories.map((category) => ({
    category,
    items: catalog.filter((s) => s.category === category),
  }))
}

export function isColoringService(
  serviceName: string,
  catalog: ServiceCatalogItem[] = SERVICE_CATALOG,
) {
  const item = catalog.find((s) => s.name === serviceName)
  if (item) return item.category === 'Koloryzacja'
  return /koloryzac|pasemk|balayage|ombre|sombre|tonowan|dekoloryzac|air\s*touch/i.test(
    serviceName,
  )
}

/** Sugestia ilości farby (g) wg długości włosów w nazwie usługi */
export function defaultDyeAmountG(serviceName: string) {
  if (/długie/i.test(serviceName)) return 60
  if (/średnie/i.test(serviceName)) return 45
  if (/krótkie/i.test(serviceName)) return 30
  return 40
}

export function formatDyeAmount(grams: number) {
  if (Number.isInteger(grams)) return `${grams} g`
  return `${grams.toFixed(1)} g`
}

export function normalizeCatalog(
  raw: unknown,
): ServiceCatalogItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return SERVICE_CATALOG.map((s) => ({ ...s }))
  }
  return raw
    .filter(
      (item): item is ServiceCatalogItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as ServiceCatalogItem).name === 'string' &&
        typeof (item as ServiceCatalogItem).price === 'number',
    )
    .map((item) => ({
      category: item.category || 'Inne',
      name: item.name,
      price: item.price,
      priceLabel: item.priceLabel || `${item.price} zł`,
      durationMin: item.durationMin || 30,
    }))
}

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
