import { useState } from 'react'
import { limitFor, newId, parseAmount, type Category } from './budget'
import { CategoryIcon, Sheet } from './ui'

const ICONS = [
  '🛒', '🍔', '🍕', '🥗', '🍣', '☕', '🍺', '🍷', '🍬', '🏠', '💡', '🔥',
  '📱', '💻', '🚗', '⛽', '🚌', '🚕', '🅿️', '✈️', '🏖️', '🎁', '🛍️', '👕',
  '👟', '💄', '💇', '💊', '🏥', '🏋️', '⚽', '🎮', '🎬', '🎵', '📚', '🎓',
  '🐶', '🐱', '👶', '🧸', '🔧', '🧹', '🧾', '💳', '💰', '🏦', '📦', '🎉',
]

const COLORS = [
  '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be', '#30b0c7',
  '#007aff', '#5856d6', '#af52de', '#ff2d55', '#a2845e', '#8e8e93',
]

type Props = {
  cat: Category | null
  /** Only used when creating; existing categories keep their type. */
  longTerm: boolean
  currentMonth: string
  currency: string
  onCancel: () => void
  onSave: (cat: Category) => void
  onDelete: (id: string) => void
}

export function CategoryEditor({ cat, longTerm: newLongTerm, currentMonth, currency, onCancel, onSave, onDelete }: Props) {
  const longTerm = cat ? cat.longTerm === true : newLongTerm
  const [name, setName] = useState(cat?.name ?? '')
  const [limitText, setLimitText] = useState(
    cat ? String(limitFor(cat, longTerm ? '9999-12' : currentMonth)) : '',
  )
  const [rollover, setRollover] = useState(cat ? cat.rolloverSince !== null : false)
  const [icon, setIcon] = useState(cat?.icon ?? ICONS[0])
  const [color, setColor] = useState(cat?.color ?? COLORS[3])
  const canSave = name.trim().length > 0

  const save = () => {
    const limit = parseAmount(limitText)
    const limits = longTerm
      ? { [currentMonth]: limit }
      : cat && limitFor(cat, currentMonth) === limit
        ? cat.limits
        : { ...cat?.limits, [currentMonth]: limit }
    onSave({
      id: cat?.id ?? newId(),
      name: name.trim(),
      icon,
      color,
      limits,
      rolloverSince: rollover && !longTerm ? (cat?.rolloverSince ?? currentMonth) : null,
      longTerm,
    })
  }

  const remove = () => {
    if (cat && confirm(`Delete "${cat.name}" and all its spends?`)) onDelete(cat.id)
  }

  return (
    <Sheet
      title={cat ? 'Edit category' : longTerm ? 'New long-term budget' : 'New category'}
      left={
        <button className="link" onClick={onCancel}>
          Cancel
        </button>
      }
      right={
        <button className="link strong" disabled={!canSave} onClick={save}>
          Save
        </button>
      }
    >
      <div className="detail-head">
        <CategoryIcon icon={icon} color={color} size={64} />
      </div>

      <div className="card">
        <label className="row">
          <span>Name</span>
          <input
            className="inline-input"
            placeholder={longTerm ? 'e.g. Christmas' : 'e.g. Groceries'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="row">
          <span>{longTerm ? 'Total budget' : 'Monthly max'}</span>
          <span className="inline-money">
            <input
              className="inline-input"
              inputMode="decimal"
              placeholder="0"
              value={limitText}
              onChange={(e) => setLimitText(e.target.value.replace(/[^0-9.,]/g, ''))}
            />
            <span className="muted">{currency}</span>
          </span>
        </label>
        {!longTerm && (
          <label className="row">
            <span>Roll over unspent money</span>
            <input
              type="checkbox"
              className="switch"
              checked={rollover}
              onChange={(e) => setRollover(e.target.checked)}
            />
          </label>
        )}
      </div>
      <p className="hint">
        {longTerm
          ? 'Never resets. Every spend you add counts toward the total budget, no matter the month.'
          : rollover
            ? "Whatever you don't spend this month is added to next month's max."
            : 'Each month starts fresh at the monthly max.'}
        {cat && !longTerm && ' Changing the max applies from this month onward.'}
      </p>

      <h3 className="section-title">Icon</h3>
      <div className="card picker icons">
        {ICONS.map((i) => (
          <button key={i} className={`pick ${i === icon ? 'selected' : ''}`} onClick={() => setIcon(i)}>
            {i}
          </button>
        ))}
      </div>

      <h3 className="section-title">Color</h3>
      <div className="card picker colors">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`swatch ${c === color ? 'selected' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
            aria-label={c}
          />
        ))}
      </div>

      {cat && (
        <button className="danger-button" onClick={remove}>
          Delete category
        </button>
      )}
    </Sheet>
  )
}
