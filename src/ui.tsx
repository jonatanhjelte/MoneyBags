import type { ReactNode } from 'react'
import { formatMoney, monthLabel, shiftMonth, type Category, type MonthStatus } from './budget'

export function CategoryIcon({ icon, color, size = 44 }: { icon: string; color: string; size?: number }) {
  return (
    <span
      className="cat-icon"
      style={{ background: `${color}33`, width: size, height: size, fontSize: size * 0.52 }}
    >
      {icon}
    </span>
  )
}

export function Bar({ status, color }: { status: MonthStatus; color: string }) {
  const { limit, rollover, available, spent } = status
  const over = spent > available
  const fill = available > 0 ? Math.min(100, (spent / available) * 100) : spent > 0 ? 100 : 0
  const rolloverStart = available > 0 ? (limit / available) * 100 : 100
  return (
    <div className="bar">
      {rollover > 0 && <div className="bar-rollover" style={{ left: `${rolloverStart}%`, color }} />}
      <div className="bar-fill" style={{ width: `${fill}%`, background: over ? 'var(--danger)' : color }} />
    </div>
  )
}

type CardProps = {
  cat: Category
  status: MonthStatus
  month: string
  currency: string
  onAdd: () => void
  onDetails: () => void
}

export function CategoryCard({ cat, status, month, currency, onAdd, onDetails }: CardProps) {
  const fmt = (n: number) => formatMoney(n, currency)
  const over = status.remaining < 0
  return (
    <div className="card cat-card">
      <button className="cat-main" onClick={onAdd}>
        <CategoryIcon icon={cat.icon} color={cat.color} />
        <div className="cat-body">
          <div className="cat-row">
            <span className="cat-name">{cat.name}</span>
            <span className="cat-spent">{fmt(status.spent)}</span>
          </div>
          <div className="cat-row sub">
            <span className={over ? 'danger' : ''}>
              {over ? `${fmt(-status.remaining)} over` : `${fmt(status.remaining)} left`}
            </span>
            <span>
              of {fmt(status.available)}
              {cat.longTerm ? ' total' : ''}
            </span>
          </div>
          <Bar status={status} color={cat.color} />
          {status.rollover > 0 && (
            <div className="rollover-line" style={{ color: cat.color }}>
              ↻ +{fmt(status.rollover)} rolled over from {monthLabel(shiftMonth(month, -1), 'short')}
            </div>
          )}
        </div>
      </button>
      <button className="cat-more" onClick={onDetails} aria-label={`${cat.name} details`}>
        ›
      </button>
    </div>
  )
}

type SheetProps = {
  title: ReactNode
  left?: ReactNode
  right?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export function Sheet({ title, left, right, footer, children }: SheetProps) {
  return (
    <div className="sheet">
      <header className="sheet-head">
        <div className="sheet-side">{left}</div>
        <div className="sheet-title">{title}</div>
        <div className="sheet-side right">{right}</div>
      </header>
      <div className="sheet-body">{children}</div>
      {footer && <div className="sheet-footer">{footer}</div>}
    </div>
  )
}
