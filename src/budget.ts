export type Category = {
  id: string
  name: string
  icon: string
  color: string
  /** Monthly max, keyed by the month ("YYYY-MM") the value takes effect from. */
  limits: Record<string, number>
  /** Month rollover was switched on. Leftovers from this month onward carry forward. */
  rolloverSince: string | null
}

export type Spend = {
  id: string
  categoryId: string
  amount: number
  name: string
  /** ISO timestamp */
  date: string
}

export type Data = {
  version: 1
  currency: string
  categories: Category[]
  spends: Spend[]
}

export type MonthStatus = {
  limit: number
  rollover: number
  available: number
  spent: number
  remaining: number
}

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + delta, 1))
}

export function monthLabel(key: string, month: 'long' | 'short' = 'long'): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month,
    ...(month === 'long' ? { year: 'numeric' } : {}),
  })
}

export function limitFor(cat: Category, month: string): number {
  const keys = Object.keys(cat.limits).sort()
  let value = keys.length ? cat.limits[keys[0]] : 0
  for (const k of keys) {
    if (k > month) break
    value = cat.limits[k]
  }
  return value
}

function spentPerMonth(spends: Spend[], categoryId: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const s of spends) {
    if (s.categoryId !== categoryId) continue
    const m = monthKey(new Date(s.date))
    map.set(m, (map.get(m) ?? 0) + s.amount)
  }
  return map
}

export function categoryStatus(cat: Category, spends: Spend[], month: string): MonthStatus {
  const spentMap = spentPerMonth(spends, cat.id)
  let rollover = 0
  if (cat.rolloverSince) {
    for (let m = cat.rolloverSince; m < month; m = shiftMonth(m, 1)) {
      rollover = Math.max(0, limitFor(cat, m) + rollover - (spentMap.get(m) ?? 0))
    }
  }
  const limit = limitFor(cat, month)
  const spent = spentMap.get(month) ?? 0
  const available = limit + rollover
  return { limit, rollover, available, spent, remaining: available - spent }
}

export function spendsInMonth(spends: Spend[], categoryId: string, month: string): Spend[] {
  return spends
    .filter((s) => s.categoryId === categoryId && monthKey(new Date(s.date)) === month)
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Previously used spend names for a category, most used first, then most recent. */
export function previousNames(spends: Spend[], categoryId: string, max = 12): string[] {
  const stats = new Map<string, { name: string; count: number; last: string }>()
  for (const s of spends) {
    const name = s.name.trim()
    if (s.categoryId !== categoryId || !name) continue
    const key = name.toLowerCase()
    const entry = stats.get(key)
    if (!entry) stats.set(key, { name, count: 1, last: s.date })
    else {
      entry.count++
      if (s.date > entry.last) {
        entry.last = s.date
        entry.name = name
      }
    }
  }
  return [...stats.values()]
    .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
    .slice(0, max)
    .map((e) => e.name)
}

/** Parses user-typed amounts, accepting both "12.5" and "12,5". */
export function parseAmount(text: string): number {
  const n = parseFloat(text.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0
}

export function formatMoney(n: number, currency: string): string {
  const s = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)
  return currency ? `${s} ${currency}` : s
}

export function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
