import { useEffect, useState } from 'react'
import type { Data } from './budget'

const STORAGE_KEY = 'moneybags-v1'

export function emptyData(): Data {
  return { version: 1, currency: 'kr', categories: [], spends: [] }
}

export function isData(value: unknown): value is Data {
  const v = value as Data
  return !!v && typeof v === 'object' && Array.isArray(v.categories) && Array.isArray(v.spends)
}

/** Fills in defaults for fields that older saves and backups don't have. */
export function normalizeData(raw: Data): Data {
  return {
    ...emptyData(),
    ...raw,
    version: 1,
    currency: typeof raw.currency === 'string' ? raw.currency : emptyData().currency,
    categories: raw.categories.map((c) => ({
      ...c,
      limits: c.limits ?? {},
      rolloverSince: c.rolloverSince ?? null,
      longTerm: c.longTerm === true,
    })),
    spends: raw.spends.map((s) => ({ ...s, name: s.name ?? '' })),
  }
}

function load(): Data {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (isData(parsed)) return normalizeData(parsed)
  } catch {
    // fall through to empty data
  }
  return emptyData()
}

export function useData() {
  const [data, setData] = useState<Data>(load)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])
  return [data, setData] as const
}

export async function exportData(data: Data): Promise<void> {
  const name = `moneybags-backup-${new Date().toISOString().slice(0, 10)}.json`
  const file = new File([JSON.stringify(data, null, 2)], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
