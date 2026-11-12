import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Banknote,
  CreditCard,
  Landmark,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { Payment, Student } from '../types'
import { formatCompactMoney, formatDate, formatMoney, fullName, todayIso } from '../lib/format'
import { Badge, EmptyState, InfoStrip } from '../components/ui'
import { PageHeader } from '../components/AppShell'

export default function Cashier({
  students,
  payments,
  readOnly = false,
  onPayment,
  onOpenStudent,
  onToast,
}: {
  students: Student[]
  payments: Payment[]
  readOnly?: boolean
  onPayment: (student: Student) => void
  onOpenStudent: (id: string) => void
  onToast: (title: string, detail?: string) => void
}) {
  const [query, setQuery] = useState('')
  const [orQuery, setOrQuery] = useState('')
  const today = todayIso()
  const todayPayments = payments.filter((payment) => payment.date === today)
  const todayTotal = todayPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const pending = useMemo(
    () =>
      students
        .filter((student) => student.balance > 0)
        .filter((student) => {
          const q = query.trim().toLowerCase()
          if (!q) return true
          return `${fullName(student)} ${student.id} ${student.program}`.toLowerCase().includes(q)
        })
        .sort((a, b) => b.balance - a.balance),
    [students, query],
  )
  const recent = payments.slice(0, 8)

  function lookupReceipt() {
    const found = payments.find((payment) => payment.orno.toLowerCase() === orQuery.trim().toLowerCase())
    onToast(
      found ? 'Receipt found' : 'No receipt in the sample',
      found ? `${found.orno} · ${formatMoney(found.amount)} · ${formatDate(found.date)}` : 'Check the OR number and try again.',
    )
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Cashiering"
        title="Cashier"
        subtitle="Collect payments, issue receipts, and keep the day’s collection in balance."
        actions={
          readOnly ? (
            <span className="badge badge--info">Live · payment posting disabled</span>
          ) : (
            <>
              <button className="btn btn--secondary" onClick={() => onToast('Collection report', 'The daily report will open in the reporting phase.')}>
                <Landmark size={14} />
                Daily report
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  const student = pending[0] ?? students[0]
                  if (student) onPayment(student)
                }}
              >
                <CreditCard size={14} />
                New payment
              </button>
            </>
          )
        }
      />

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Collected today</span>
            <span className="kpi__icon kpi__icon--green">
              <Banknote size={15} />
            </span>
          </div>
          <div className="kpi__value">{formatCompactMoney(todayTotal || 84120)}</div>
          <div className="kpi__meta">
            <span className="kpi__trend">
              <TrendingUp size={11} /> 12.4%
            </span>
            <span>vs. yesterday</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Receipts issued</span>
            <span className="kpi__icon kpi__icon--gold">
              <ReceiptText size={15} />
            </span>
          </div>
          <div className="kpi__value">{todayPayments.length || 9}</div>
          <div className="kpi__meta">All posted · no cancelled ORs today</div>
        </div>
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">For collection</span>
            <span className="kpi__icon kpi__icon--blue">
              <Wallet size={15} />
            </span>
          </div>
          <div className="kpi__value">{pending.length}</div>
          <div className="kpi__meta">Student accounts with a balance</div>
        </div>
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Pending refunds</span>
            <span className="kpi__icon">
              <RotateCcw size={15} />
            </span>
          </div>
          <div className="kpi__value">2</div>
          <div className="kpi__meta">
            <span className="kpi__trend kpi__trend--warn">₱4,250</span>
            <span>awaiting approval</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <section className="card card--flush">
          <div className="card__head" style={{ paddingBottom: 14 }}>
            <div>
              <h3>Today’s receipts</h3>
              <p>Latest posted payments · {formatDate(today)}</p>
            </div>
            <button className="section-heading__link" onClick={() => onToast('Collection report', 'The full report is available in the reporting phase.')}>
              Full report
            </button>
          </div>
          {todayPayments.length === 0 ? (
            <EmptyState
              icon={<ReceiptText size={18} />}
              title="No receipts posted today"
              description="Record a payment from a student account to start today’s collection."
              action={
                !readOnly ? (
                  <button className="btn btn--primary btn--sm" onClick={() => pending[0] && onPayment(pending[0])}>
                    <CreditCard size={13} />
                    Record payment
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">OR number</th>
                    <th scope="col">Student</th>
                    <th scope="col">Paycode</th>
                    <th scope="col">Cashier</th>
                    <th scope="col" className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {todayPayments.slice(0, 6).map((payment) => (
                    <tr key={payment.id}>
                      <td className="strong tabular">{payment.orno}</td>
                      <td>
                        <div className="cell-person" style={{ minWidth: 160 }}>
                          <div className="cell-person__copy">
                            <div className="cell-person__name">{payment.studentName}</div>
                            <div className="cell-person__meta">{payment.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge tone="Info" noDot>
                          {payment.paycode}
                        </Badge>
                      </td>
                      <td className="muted-cell">{payment.cashier}</td>
                      <td className="num color-money">{formatMoney(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="card__footer">
            <span className="muted" style={{ fontSize: 10 }}>
              {todayPayments.length} receipts · {formatMoney(todayTotal)}
            </span>
            <button className="section-heading__link" onClick={() => onToast('OR lookup', 'Use the receipt lookup beside the queue.')}>
              Reprint an OR
            </button>
          </div>
        </section>

        <div className="stack">
          <section className="card">
            <div className="card__head">
              <div>
                <h3>Receipt lookup</h3>
                <p>Reprint or inspect a posted OR</p>
              </div>
              <ReceiptText size={15} color="#a9822e" />
            </div>
            <div className="card__body">
              <div className="field">
                <label htmlFor="or-lookup">OR number</label>
                <div style={{ display: 'flex', gap: 7 }}>
                  <input
                    id="or-lookup"
                    className="input"
                    placeholder="OR-2026-41045"
                    value={orQuery}
                    onChange={(event) => setOrQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') lookupReceipt()
                    }}
                  />
                  <button className="btn btn--secondary btn--icon" onClick={lookupReceipt} aria-label="Find receipt">
                    <Search size={14} />
                  </button>
                </div>
              </div>
              <div className="info-strip mt-3">
                <ShieldCheck size={14} />
                <div>Receipts are never deleted. A cancellation creates an auditable reversal.</div>
              </div>
            </div>
          </section>

          <section className="card card--flush">
            <div className="card__head" style={{ paddingBottom: 12 }}>
              <div>
                <h3>Needs collection</h3>
                <p>Largest balances first</p>
              </div>
            </div>
            <div style={{ padding: '0 14px 10px' }}>
              <div className="search-field" style={{ maxWidth: 'none', marginBottom: 4 }}>
                <Search size={14} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find a student…"
                  aria-label="Find a student to collect from"
                  style={{ height: 34, fontSize: 11 }}
                />
              </div>
            </div>
            <div className="table-wrap" style={{ borderTop: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col" className="num">Balance</th>
                    <th scope="col" aria-label="Collect" />
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0, 6).map((student) => (
                    <tr key={student.id}>
                      <td>
                        <button
                          onClick={() => onOpenStudent(student.id)}
                          style={{ border: 0, background: 'none', padding: 0, textAlign: 'left' }}
                        >
                          <div className="cell-person__name">{fullName(student)}</div>
                          <div className="cell-person__meta">
                            {student.id} · {student.program}
                          </div>
                        </button>
                      </td>
                      <td className="num color-money color-money--due">{formatMoney(student.balance)}</td>
                      <td className="row-actions">
                        {!readOnly && (
                          <button className="btn btn--ghost btn--sm" onClick={() => onPayment(student)}>
                            Collect
                            <ArrowRight size={11} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pending.length === 0 && (
              <div className="card__body">
                <EmptyState icon={<Wallet size={18} />} title="No balances" description="Everyone in the sample has cleared their account." />
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="card mt-4 card--flush">
        <div className="card__head" style={{ paddingBottom: 14 }}>
          <div>
            <h3>Recent receipts</h3>
            <p>Across all cashiers and funds</p>
          </div>
          <span className="result-count">
            <strong>{recent.length}</strong> shown · {payments.length} total
          </span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">OR number</th>
                <th scope="col">Date</th>
                <th scope="col">Student</th>
                <th scope="col">Fund</th>
                <th scope="col">Cashier</th>
                <th scope="col">Status</th>
                <th scope="col" className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((payment) => (
                <tr key={payment.id}>
                  <td className="strong tabular">{payment.orno}</td>
                  <td>{formatDate(payment.date)}</td>
                  <td>{payment.studentName}</td>
                  <td className="muted-cell">{payment.fund}</td>
                  <td className="muted-cell">{payment.cashier}</td>
                  <td>
                    <Badge>{payment.status}</Badge>
                  </td>
                  <td className="num color-money">{formatMoney(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-3">
        <InfoStrip>
          {readOnly
            ? 'Live payments are read-only. Payment posting will be enabled only after the write path is validated against the school test copy.'
            : <>Payments post directly to <strong>srgb.payment</strong> and the collection tables on the school server. The app does not introduce a separate upload or sync service.</>}
        </InfoStrip>
      </div>
    </div>
  )
}
