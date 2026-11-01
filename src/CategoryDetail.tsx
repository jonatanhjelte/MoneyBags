import { formatMoney, monthLabel, shiftMonth, type Category, type MonthStatus, type Spend } from './budget'
import { Bar, CategoryIcon, Sheet } from './ui'

type Props = {
  cat: Category
  status: MonthStatus
  spends: Spend[]
  month: string
  currency: string
  onBack: () => void
  onEdit: () => void
  onAdd: () => void
  onDeleteSpend: (id: string) => void
}

export function CategoryDetail({ cat, status, spends, month, currency, onBack, onEdit, onAdd, onDeleteSpend }: Props) {
  const fmt = (n: number) => formatMoney(n, currency)
  const over = status.remaining < 0

  const deleteSpend = (s: Spend) => {
    if (confirm(`Delete ${fmt(s.amount)}${s.name ? ` (${s.name})` : ''}?`)) onDeleteSpend(s.id)
  }

  return (
    <Sheet
      title={cat.name}
      left={
        <button className="link" onClick={onBack}>
          ‹ Back
        </button>
      }
      right={
        <button className="link" onClick={onEdit}>
          Edit
        </button>
      }
    >
      <div className="detail-head">
        <CategoryIcon icon={cat.icon} color={cat.color} size={64} />
        <div className="big">{fmt(status.spent)}</div>
        <div className="sub">spent in {monthLabel(month)}</div>
      </div>

      <div className="card">
        <div className="row">
          <span>Monthly max</span>
          <span>{fmt(status.limit)}</span>
        </div>
        {(cat.rolloverSince !== null || status.rollover > 0) && (
          <div className="row rollover-row" style={{ color: cat.color }}>
            <span>↻ Rolled over from {monthLabel(shiftMonth(month, -1), 'short')}</span>
            <span>+{fmt(status.rollover)}</span>
          </div>
        )}
        <div className="row strong">
          <span>Available</span>
          <span>{fmt(status.available)}</span>
        </div>
        <div className="row">
          <span>Spent</span>
          <span>−{fmt(status.spent)}</span>
        </div>
        <div className={`row strong ${over ? 'danger' : ''}`}>
          <span>{over ? 'Over' : 'Left'}</span>
          <span>{fmt(Math.abs(status.remaining))}</span>
        </div>
        <div className="row-bar">
          <Bar status={status} color={cat.color} />
        </div>
      </div>
      {status.rollover > 0 && (
        <p className="hint">
          The striped part of the bar is the extra {fmt(status.rollover)} you didn't spend last month.
        </p>
      )}

      <button className="primary" onClick={onAdd}>
        + Add spend
      </button>

      <h3 className="section-title">Spends in {monthLabel(month, 'short')}</h3>
      {spends.length === 0 ? (
        <p className="hint">Nothing spent yet.</p>
      ) : (
        <>
          <div className="card">
            {spends.map((s) => (
              <button key={s.id} className="row spend-row" onClick={() => deleteSpend(s)}>
                <span>
                  <span className={s.name ? '' : 'muted'}>{s.name || 'No name'}</span>
                  <span className="sub block">
                    {new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </span>
                <span>{fmt(s.amount)}</span>
              </button>
            ))}
          </div>
          <p className="hint">Tap a spend to delete it.</p>
        </>
      )}
    </Sheet>
  )
}
