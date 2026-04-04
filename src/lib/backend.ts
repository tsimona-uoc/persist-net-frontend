export type UnknownRecord = Record<string, unknown>

export function toRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' ? (value as UnknownRecord) : null
}

export function extractCollection<T extends UnknownRecord = UnknownRecord>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => toRecord(item)).filter((item): item is T => item !== null)
  }

  const record = toRecord(payload)

  if (!record) {
    return []
  }

  const collectionKeys = ['data', 'items', 'results', 'value']

  for (const key of collectionKeys) {
    if (Array.isArray(record[key])) {
      return record[key]
        .map((item) => toRecord(item))
        .filter((item): item is T => item !== null)
    }
  }

  return []
}

export function readString(record: UnknownRecord | null, ...keys: string[]): string {
  if (!record) {
    return ''
  }

  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

export function readNumber(record: UnknownRecord | null, ...keys: string[]): number | null {
  if (!record) {
    return null
  }

  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string' && value.trim()) {
      const parsedValue = Number(value)

      if (Number.isFinite(parsedValue)) {
        return parsedValue
      }
    }
  }

  return null
}

export function readBoolean(record: UnknownRecord | null, ...keys: string[]): boolean {
  if (!record) {
    return false
  }

  for (const key of keys) {
    if (typeof record[key] === 'boolean') {
      return record[key] as boolean
    }
  }

  return false
}

export function readObject(record: UnknownRecord | null, ...keys: string[]): UnknownRecord | null {
  if (!record) {
    return null
  }

  for (const key of keys) {
    const value = toRecord(record[key])

    if (value) {
      return value
    }
  }

  return null
}

export function readDateString(record: UnknownRecord | null, ...keys: string[]): string {
  const value = readString(record, ...keys)
  return value ? value.slice(0, 10) : ''
}

export function joinName(...parts: string[]): string {
  return parts.filter(Boolean).join(' ').trim()
}

export function extractCity(address: string): string {
  if (!address) {
    return 'Sin ciudad'
  }

  const segments = address
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)

  return segments.at(-1) ?? address
}

export function parseDate(value: string): Date | null {
  if (!value) {
    return null
  }

  const normalizedValue = value.length > 10 ? value : `${value}T00:00:00`
  const parsedDate = new Date(normalizedValue)

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export function toDateKey(value: string | Date | null): string {
  const parsedDate = value instanceof Date ? value : parseDate(value ?? '')

  if (!parsedDate) {
    return ''
  }

  const year = parsedDate.getFullYear()
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0')
  const day = `${parsedDate.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatFullDate(value: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value)
}

export function formatShortDate(value: string): string {
  const parsedDate = parseDate(value)

  if (!parsedDate) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(parsedDate)
}

export function formatCurrency(value: number | null): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

export function normalizeStatusTone(name: string): string {
  const normalizedName = name.toLowerCase()

  if (normalizedName.includes('ocup')) {
    return 'text-blue-400'
  }

  if (normalizedName.includes('dispon') || normalizedName.includes('confirm')) {
    return 'text-emerald-400'
  }

  if (normalizedName.includes('limp')) {
    return 'text-amber-400'
  }

  if (normalizedName.includes('no-show') || normalizedName.includes('noshow') || normalizedName.includes('cancel')) {
    return 'text-rose-400'
  }

  return 'text-slate-400'
}