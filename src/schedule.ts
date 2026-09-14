import type { StylistId } from './types'

/** 0 = niedziela … 6 = sobota (jak Date.getDay()) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type DayAvailability = {
  enabled: boolean
  start: string
  end: string
}

/** Domyślny tydzień + nadpisania na konkretne daty (yyyy-MM-dd) */
export type StylistSchedule = {
  weekly: Record<Weekday, DayAvailability>
  dates: Record<string, DayAvailability>
}

export type SchedulesMap = Record<StylistId, StylistSchedule>

export const WEEKDAY_LABELS: { day: Weekday; label: string; short: string }[] = [
  { day: 1, label: 'Poniedziałek', short: 'Pn' },
  { day: 2, label: 'Wtorek', short: 'Wt' },
  { day: 3, label: 'Środa', short: 'Śr' },
  { day: 4, label: 'Czwartek', short: 'Cz' },
  { day: 5, label: 'Piątek', short: 'Pt' },
  { day: 6, label: 'Sobota', short: 'So' },
  { day: 0, label: 'Niedziela', short: 'Nd' },
]

export function dayOff(): DayAvailability {
  return { enabled: false, start: '09:00', end: '17:00' }
}

export function workDay(start = '09:00', end = '17:00'): DayAvailability {
  return { enabled: true, start, end }
}

export function createDefaultWeekly(): Record<Weekday, DayAvailability> {
  return {
    0: dayOff(),
    1: workDay('09:00', '17:00'),
    2: workDay('09:00', '17:00'),
    3: workDay('09:00', '17:00'),
    4: workDay('09:00', '17:00'),
    5: workDay('09:00', '17:00'),
    6: workDay('09:00', '14:00'),
  }
}

export function createDefaultSchedule(): StylistSchedule {
  return { weekly: createDefaultWeekly(), dates: {} }
}

export function createDefaultSchedules(): SchedulesMap {
  return {
    ania: createDefaultSchedule(),
    ewa: {
      weekly: {
        ...createDefaultWeekly(),
        1: workDay('10:00', '18:00'),
        2: workDay('10:00', '18:00'),
        3: workDay('10:00', '18:00'),
        4: workDay('10:00', '18:00'),
        5: workDay('10:00', '18:00'),
      },
      dates: {},
    },
    roksana: {
      weekly: {
        ...createDefaultWeekly(),
        6: dayOff(),
      },
      dates: {},
    },
  }
}

/** Migracja starego formatu (tylko tygodniowy) */
export function normalizeSchedule(raw: unknown): StylistSchedule {
  const defaults = createDefaultSchedule()
  if (!raw || typeof raw !== 'object') return defaults

  const obj = raw as Record<string, unknown>
  if ('weekly' in obj || 'dates' in obj) {
    const weekly = { ...defaults.weekly }
    const incomingWeekly = (obj.weekly ?? {}) as Record<string, DayAvailability>
    for (const key of Object.keys(weekly) as unknown as Weekday[]) {
      if (incomingWeekly[key]) weekly[key] = { ...incomingWeekly[key] }
    }
    const dates: Record<string, DayAvailability> = {}
    const incomingDates = (obj.dates ?? {}) as Record<string, DayAvailability>
    for (const [date, avail] of Object.entries(incomingDates)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && avail) {
        dates[date] = { ...avail }
      }
    }
    return { weekly, dates }
  }

  // stary format: Record<Weekday, DayAvailability>
  const weekly = { ...defaults.weekly }
  for (const key of ['0', '1', '2', '3', '4', '5', '6'] as const) {
    const day = Number(key) as Weekday
    const value = obj[key] as DayAvailability | undefined
    if (value && typeof value.enabled === 'boolean') {
      weekly[day] = { ...value }
    }
  }
  return { weekly, dates: {} }
}

export function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function toDateKey(date: Date | string) {
  if (typeof date === 'string') return date.slice(0, 10)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function hasDateOverride(schedule: StylistSchedule, date: Date | string) {
  return Boolean(schedule.dates[toDateKey(date)])
}

export function getAvailabilityForDate(
  schedule: StylistSchedule,
  date: Date | string,
): DayAvailability {
  const key = toDateKey(date)
  if (schedule.dates[key]) {
    return schedule.dates[key]
  }
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date
  const weekday = d.getDay() as Weekday
  return schedule.weekly[weekday] ?? dayOff()
}

export function isSlotAvailable(
  schedule: StylistSchedule,
  date: string,
  time: string,
  durationMin: number,
): boolean {
  const day = getAvailabilityForDate(schedule, date)
  if (!day.enabled) return false
  const start = timeToMinutes(time)
  const end = start + durationMin
  return start >= timeToMinutes(day.start) && end <= timeToMinutes(day.end)
}

export function unavailableBlocks(
  schedule: StylistSchedule,
  date: string,
  axisStartH: number,
  axisEndH: number,
): { startMin: number; endMin: number }[] {
  const axisStart = axisStartH * 60
  const axisEnd = axisEndH * 60
  const day = getAvailabilityForDate(schedule, date)

  if (!day.enabled) {
    return [{ startMin: axisStart, endMin: axisEnd }]
  }

  const workStart = timeToMinutes(day.start)
  const workEnd = timeToMinutes(day.end)
  const blocks: { startMin: number; endMin: number }[] = []

  if (workStart > axisStart) {
    blocks.push({ startMin: axisStart, endMin: Math.min(workStart, axisEnd) })
  }
  if (workEnd < axisEnd) {
    blocks.push({ startMin: Math.max(workEnd, axisStart), endMin: axisEnd })
  }
  return blocks
}

export function cloneSchedule(schedule: StylistSchedule): StylistSchedule {
  const weekly = { ...schedule.weekly } as Record<Weekday, DayAvailability>
  for (const key of Object.keys(weekly) as unknown as Weekday[]) {
    weekly[key] = { ...weekly[key] }
  }
  const dates: Record<string, DayAvailability> = {}
  for (const [k, v] of Object.entries(schedule.dates)) {
    dates[k] = { ...v }
  }
  return { weekly, dates }
}
