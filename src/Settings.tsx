import { useRef, type ChangeEvent } from 'react'
import type { Data } from './budget'
import { exportData, isData, normalizeData } from './store'
import { Sheet } from './ui'

type Props = {
  data: Data
  onBack: () => void
  onCurrency: (currency: string) => void
  onImport: (data: Data) => void
}

export function Settings({ data, onBack, onCurrency, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (!isData(parsed)) throw new Error('not a backup')
      const summary = `${parsed.categories.length} categories, ${parsed.spends.length} spends`
      if (confirm(`Replace everything in the app with this backup (${summary})?`)) onImport(normalizeData(parsed))
    } catch {
      alert('That file is not a MoneyBags backup.')
    }
  }

  return (
    <Sheet
      title="Settings"
      left={
        <button className="link" onClick={onBack}>
          ‹ Back
        </button>
      }
    >
      <div className="card">
        <label className="row">
          <span>Currency</span>
          <input
            className="inline-input"
            value={data.currency}
            placeholder="none"
            onChange={(e) => onCurrency(e.target.value.slice(0, 5))}
          />
        </label>
      </div>

      <h3 className="section-title">Backup</h3>
      <div className="card">
        <button className="row link-row" onClick={() => exportData(data)}>
          Export backup
        </button>
        <button className="row link-row" onClick={() => fileInput.current?.click()}>
          Restore from backup…
        </button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={handleFile} />
      <p className="hint">
        Your data is stored only on this phone. Export a backup now and then and save it to iCloud Drive.
      </p>
    </Sheet>
  )
}
