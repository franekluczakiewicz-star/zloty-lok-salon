import type { Appointment, Client } from '../types'

const SAMPLE_PEOPLE: { firstName: string; lastName: string; phone: string }[] = [
  { firstName: 'Anna', lastName: 'Kowalska', phone: '500100101' },
  { firstName: 'Magdalena', lastName: 'Nowak', phone: '500100102' },
  { firstName: 'Katarzyna', lastName: 'Wiśniewska', phone: '500100103' },
  { firstName: 'Joanna', lastName: 'Wójcik', phone: '500100104' },
  { firstName: 'Agnieszka', lastName: 'Kowalczyk', phone: '500100105' },
  { firstName: 'Ewa', lastName: 'Kamińska', phone: '500100106' },
  { firstName: 'Monika', lastName: 'Lewandowska', phone: '500100107' },
  { firstName: 'Natalia', lastName: 'Zielińska', phone: '500100108' },
  { firstName: 'Aleksandra', lastName: 'Szymańska', phone: '500100109' },
  { firstName: 'Paulina', lastName: 'Woźniak', phone: '500100110' },
  { firstName: 'Karolina', lastName: 'Dąbrowska', phone: '500100111' },
  { firstName: 'Justyna', lastName: 'Kozłowska', phone: '500100112' },
  { firstName: 'Weronika', lastName: 'Jankowska', phone: '500100113' },
  { firstName: 'Patrycja', lastName: 'Mazur', phone: '500100114' },
  { firstName: 'Martyna', lastName: 'Kwiatkowska', phone: '500100115' },
  { firstName: 'Dominika', lastName: 'Krawczyk', phone: '500100116' },
  { firstName: 'Julia', lastName: 'Piotrowska', phone: '500100117' },
  { firstName: 'Zuzanna', lastName: 'Grabowska', phone: '500100118' },
  { firstName: 'Maja', lastName: 'Pawłowska', phone: '500100119' },
  { firstName: 'Oliwia', lastName: 'Michalska', phone: '500100120' },
  { firstName: 'Amelia', lastName: 'Nowicka', phone: '500100121' },
  { firstName: 'Laura', lastName: 'Adamczyk', phone: '500100122' },
  { firstName: 'Nikola', lastName: 'Dudek', phone: '500100123' },
  { firstName: 'Sara', lastName: 'Zając', phone: '500100124' },
  { firstName: 'Lena', lastName: 'Wieczorek', phone: '500100125' },
  { firstName: 'Hanna', lastName: 'Jabłońska', phone: '500100126' },
  { firstName: 'Iga', lastName: 'Król', phone: '500100127' },
  { firstName: 'Emilia', lastName: 'Majewska', phone: '500100128' },
  { firstName: 'Kinga', lastName: 'Olszewska', phone: '500100129' },
  { firstName: 'Sylwia', lastName: 'Jaworska', phone: '500100130' },
  { firstName: 'Beata', lastName: 'Malinowska', phone: '500100131' },
  { firstName: 'Iwona', lastName: 'Pawlak', phone: '500100132' },
  { firstName: 'Barbara', lastName: 'Witkowska', phone: '500100133' },
  { firstName: 'Danuta', lastName: 'Walczak', phone: '500100134' },
  { firstName: 'Halina', lastName: 'Stępień', phone: '500100135' },
  { firstName: 'Teresa', lastName: 'Górska', phone: '500100136' },
  { firstName: 'Renata', lastName: 'Rutkowska', phone: '500100137' },
  { firstName: 'Małgorzata', lastName: 'Michalak', phone: '500100138' },
  { firstName: 'Elżbieta', lastName: 'Sikora', phone: '500100139' },
  { firstName: 'Grażyna', lastName: 'Baran', phone: '500100140' },
  { firstName: 'Piotr', lastName: 'Kowalski', phone: '501200201' },
  { firstName: 'Michał', lastName: 'Nowak', phone: '501200202' },
  { firstName: 'Krzysztof', lastName: 'Wiśniewski', phone: '501200203' },
  { firstName: 'Tomasz', lastName: 'Wójcik', phone: '501200204' },
  { firstName: 'Andrzej', lastName: 'Kowalczyk', phone: '501200205' },
  { firstName: 'Paweł', lastName: 'Kamiński', phone: '501200206' },
  { firstName: 'Marcin', lastName: 'Lewandowski', phone: '501200207' },
  { firstName: 'Jakub', lastName: 'Zieliński', phone: '501200208' },
  { firstName: 'Mateusz', lastName: 'Szymański', phone: '501200209' },
  { firstName: 'Adam', lastName: 'Woźniak', phone: '501200210' },
]

function slugEmail(firstName: string, lastName: string) {
  const base = `${firstName}.${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z.]/g, '')
  return `${base}@example.pl`
}

export const seedClients: Client[] = SAMPLE_PEOPLE.map((person, index) => ({
  id: `seed-client-${String(index + 1).padStart(2, '0')}`,
  firstName: person.firstName,
  lastName: person.lastName,
  phone: person.phone,
  email: slugEmail(person.firstName, person.lastName),
  services: [],
  createdAt: new Date(2025, 0, 1 + index).toISOString(),
}))

/** Dopina brakujące przykładowe konta (bez duplikatów po id / telefonie). */
export function mergeSeedClients(existing: Client[]): Client[] {
  const ids = new Set(existing.map((c) => c.id))
  const phones = new Set(existing.map((c) => c.phone.replace(/\D/g, '')))
  const missing = seedClients.filter(
    (s) => !ids.has(s.id) && !phones.has(s.phone.replace(/\D/g, '')),
  )
  if (missing.length === 0) return existing
  return [...existing, ...missing]
}

export function createSeedAppointments(_clients: Client[]): Appointment[] {
  return []
}
