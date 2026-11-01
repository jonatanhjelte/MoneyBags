import { Fragment, useEffect, useMemo, useState } from 'react'
import { AddSpend } from './AddSpend'
import {
  categoryStatus,
  formatMoney,
  monthKey,
  monthLabel,
  newId,
  previousNames,
  shiftMonth,
  spendsInMonth,
  type Category,
} from './budget'
import { CategoryDetail } from './CategoryDetail'
import { CategoryEditor } from './CategoryEditor'
import { Settings } from './Settings'
import { useData } from './store'
import { CategoryCard } from './ui'

type View =
  | { kind: 'add'; categoryId: string }
  | { kind: 'detail'; categoryId: string }
  | { kind: 'edit'; categoryId: string | null }
  | { kind: 'settings' }

export default function App() {
  const [data, setData] = useData()
  const [currentMonth, setCurrentMonth] = useState(() => monthKey())
  const [offset, setOffset] = useState(0)
  const [stack, setStack] = useState<View[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const month = shiftMonth(currentMonth, offset)
  const isCurrent = offset === 0
  const fmt = (n: number) => formatMoney(n, data.currency)

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setCurrentMonth(monthKey())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const statuses = useMemo(
    () => data.categories.map((cat) => ({ cat, status: categoryStatus(cat, data.spends, month) })),
    [data, month],
  )
  const totals = statuses.reduce(
    (t, { status }) => ({
      spent: t.spent + status.spent,
      available: t.available + status.available,
      rollover: t.rollover + status.rollover,
    }),
    { spent: 0, available: 0, rollover: 0 },
  )
  const totalLeft = totals.available - totals.spent

  const push = (view: View) => setStack((s) => [...s, view])
  const pop = () => setStack((s) => s.slice(0, -1))
  const findCategory = (id: string) => data.categories.find((c) => c.id === id)
  const statusOf = (cat: Category) => categoryStatus(cat, data.spends, month)

  const addSpend = (cat: Category, amount: number, name: string) => {
    const [y, m] = month.split('-').map(Number)
    // Spends added while looking at an earlier month are dated on that month's last day.
    const date = isCurrent ? new Date() : new Date(y, m, 0, 12)
    setData((d) => ({
      ...d,
      spends: [...d.spends, { id: newId(), categoryId: cat.id, amount, name, date: date.toISOString() }],
    }))
    setToast(`Added ${fmt(amount)} to ${cat.name}`)
    pop()
  }

  const saveCategory = (cat: Category) => {
    setData((d) => ({
      ...d,
      categories: d.categories.some((c) => c.id === cat.id)
        ? d.categories.map((c) => (c.id === cat.id ? cat : c))
        : [...d.categories, cat],
    }))
    pop()
  }

  const deleteCategory = (id: string) => {
    setData((d) => ({
      ...d,
      categories: d.categories.filter((c) => c.id !== id),
      spends: d.spends.filter((s) => s.categoryId !== id),
    }))
    setStack([])
  }

  const deleteSpend = (id: string) => setData((d) => ({ ...d, spends: d.spends.filter((s) => s.id !== id) }))

  const renderSheet = (view: View) => {
    switch (view.kind) {
      case 'add': {
        const cat = findCategory(view.categoryId)
        if (!cat) return null
        return (
          <AddSpend
            cat={cat}
            status={statusOf(cat)}
            names={previousNames(data.spends, cat.id)}
            currency={data.currency}
            monthNote={isCurrent ? null : `This will be added to ${monthLabel(month)}.`}
            onCancel={pop}
            onSave={(amount, name) => addSpend(cat, amount, name)}
          />
        )
      }
      case 'detail': {
        const cat = findCategory(view.categoryId)
        if (!cat) return null
        return (
          <CategoryDetail
            cat={cat}
            status={statusOf(cat)}
            spends={spendsInMonth(data.spends, cat.id, month)}
            month={month}
            currency={data.currency}
            onBack={pop}
            onEdit={() => push({ kind: 'edit', categoryId: cat.id })}
            onAdd={() => push({ kind: 'add', categoryId: cat.id })}
            onDeleteSpend={deleteSpend}
          />
        )
      }
      case 'edit':
        return (
          <CategoryEditor
            cat={view.categoryId ? (findCategory(view.categoryId) ?? null) : null}
            currentMonth={currentMonth}
            currency={data.currency}
            onCancel={pop}
            onSave={saveCategory}
            onDelete={deleteCategory}
          />
        )
      case 'settings':
        return (
          <Settings
            data={data}
            onBack={pop}
            onCurrency={(currency) => setData((d) => ({ ...d, currency }))}
            onImport={(imported) => {
              setData({ ...imported, version: 1, currency: imported.currency ?? data.currency })
              setStack([])
            }}
          />
        )
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="month-nav">
          <button className="icon-btn" onClick={() => setOffset((o) => o - 1)} aria-label="Previous month">
            ‹
          </button>
          <span className="month-title">{monthLabel(month)}</span>
          <button
            className="icon-btn"
            onClick={() => setOffset((o) => o + 1)}
            disabled={isCurrent}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <button className="icon-btn" onClick={() => push({ kind: 'settings' })} aria-label="Settings">
          ⚙︎
        </button>
      </header>

      <section className="card summary">
        <div className="sub">{isCurrent ? 'Spent this month' : `Spent in ${monthLabel(month, 'short')}`}</div>
        <div className="big">{fmt(totals.spent)}</div>
        {data.categories.length > 0 && (
          <div className="sub">
            of {fmt(totals.available)} ·{' '}
            <span className={totalLeft < 0 ? 'danger' : ''}>
              {totalLeft < 0 ? `${fmt(-totalLeft)} over` : `${fmt(totalLeft)} left`}
            </span>
          </div>
        )}
        {totals.rollover > 0 && (
          <div className="rollover-total">↻ Includes {fmt(totals.rollover)} extra rolled over from last month</div>
        )}
      </section>

      {!isCurrent && (
        <button className="link center" onClick={() => setOffset(0)}>
          Back to this month
        </button>
      )}

      <section className="list">
        {statuses.map(({ cat, status }) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            status={status}
            month={month}
            currency={data.currency}
            onAdd={() => push({ kind: 'add', categoryId: cat.id })}
            onDetails={() => push({ kind: 'detail', categoryId: cat.id })}
          />
        ))}
        {data.categories.length === 0 && (
          <p className="hint center">Create your first category to start tracking.</p>
        )}
        <button className="new-cat" onClick={() => push({ kind: 'edit', categoryId: null })}>
          + New category
        </button>
      </section>

      {stack.map((view, i) => (
        <Fragment key={i}>{renderSheet(view)}</Fragment>
      ))}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
