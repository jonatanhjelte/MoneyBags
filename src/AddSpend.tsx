import { useState } from 'react'
import { formatMoney, parseAmount, type Category, type MonthStatus } from './budget'
import { CategoryIcon, Sheet } from './ui'

const STEPS = [500, 200, 100, 50, 20, 10, 5, 1]

type Props = {
  cat: Category
  status: MonthStatus
  names: string[]
  currency: string
  monthNote: string | null
  onCancel: () => void
  onSave: (amount: number, name: string) => void
}

export function AddSpend({ cat, status, names, currency, monthNote, onCancel, onSave }: Props) {
  const [text, setText] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [name, setName] = useState('')
  const fmt = (n: number) => formatMoney(n, currency)
  const amount = parseAmount(text)
  const after = status.remaining - amount

  const bump = (step: number) => {
    setHistory([...history, text])
    setText(String(Math.round((amount + step) * 100) / 100))
  }
  const undo = () => {
    setText(history[history.length - 1] ?? '')
    setHistory(history.slice(0, -1))
  }
  const clear = () => {
    setHistory([...history, text])
    setText('')
  }

  return (
    <Sheet
      title="Add spend"
      left={
        <button className="link" onClick={onCancel}>
          Cancel
        </button>
      }
      footer={
        <button className="primary" disabled={amount <= 0} onClick={() => onSave(amount, name.trim())}>
          {amount > 0 ? `Add ${fmt(amount)}` : 'Add'}
        </button>
      }
    >
      <div className="add-head">
        <CategoryIcon icon={cat.icon} color={cat.color} />
        <div>
          <div className="add-cat">{cat.name}</div>
          <div className="sub">
            {status.remaining < 0 ? `${fmt(-status.remaining)} over` : `${fmt(status.remaining)} left`}
            {status.rollover > 0 && ` (incl. ${fmt(status.rollover)} rollover)`}
          </div>
        </div>
      </div>
      {monthNote && <div className="note">{monthNote}</div>}

      <label className="amount-box">
        <input
          className="amount-input"
          inputMode="decimal"
          placeholder="0"
          value={text}
          style={{ width: `${Math.max(1, (text || '0').length) + 0.5}ch` }}
          onChange={(e) => setText(e.target.value.replace(/[^0-9.,]/g, ''))}
        />
        <span className="amount-currency">{currency}</span>
      </label>
      <div className={`after sub ${after < 0 ? 'danger' : ''}`}>
        {amount > 0 ? (after >= 0 ? `${fmt(after)} left after this` : `${fmt(-after)} over after this`) : '\u00a0'}
      </div>

      <div className="steps">
        {STEPS.map((n) => (
          <button key={n} className="step" onClick={() => bump(n)}>
            +{n}
          </button>
        ))}
      </div>
      <div className="step-tools">
        <button className="link" onClick={undo} disabled={!history.length}>
          Undo
        </button>
        <button className="link" onClick={clear} disabled={!text}>
          Clear
        </button>
      </div>

      <input
        className="field"
        placeholder="Name (optional)"
        value={name}
        enterKeyHint="done"
        onChange={(e) => setName(e.target.value)}
      />
      {names.length > 0 && (
        <div className="chips">
          {names.map((n) => (
            <button
              key={n}
              className={`chip ${n === name ? 'selected' : ''}`}
              onClick={() => setName(n === name ? '' : n)}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </Sheet>
  )
}
