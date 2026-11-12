import { useEffect, useState } from 'react'
import { Banknote, CheckCircle2, CreditCard, Printer, ReceiptText, ShieldCheck } from 'lucide-react'
import type { Payment, Student, Term } from '../types'
import { formatDate, formatMoney, fullName } from '../lib/format'
import { Modal } from './ui'

export function PaymentDialog({
  open,
  student,
  term,
  readOnly = false,
  onClose,
  onSubmit,
  onToast,
}: {
  open: boolean
  student: Student | null
  term: Term
  readOnly?: boolean
  onClose: () => void
  onSubmit: (amount: number, paycode: string, fund: string) => void
  onToast: (title: string, detail?: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [paycode, setPaycode] = useState('TUI')
  const [fund, setFund] = useState('Trust Fund')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount('')
    setPaycode('TUI')
    setFund('Trust Fund')
    setNote('')
    setError('')
  }, [open, student?.id])

  if (!open || !student) return null

  const parsed = Number(amount.replace(/[^0-9.]/g, ''))
  const valid = Number.isFinite(parsed) && parsed > 0
  const after = Math.max(0, student.balance - (valid ? parsed : 0))
  const over = valid && parsed > student.balance && student.balance > 0

  function submit() {
    if (!valid) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (parsed > 500000) {
      setError('That amount is larger than the demo limit. Check the figure and try again.')
      return
    }
    onSubmit(parsed, paycode, fund)
  }

  return (
    <Modal
      eyebrow={`${term.label} · cashiering`}
      title="Record a payment"
      subtitle="The OR number and fund are posted together. This mirrors the existing cashier flow."
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose}>
            {readOnly ? 'Close' : 'Cancel'}
          </button>
          {!readOnly && (
            <button className="btn btn--primary" onClick={submit} disabled={!valid}>
              <CreditCard size={14} />
              Post payment
            </button>
          )}
        </>
      }
    >
      {readOnly && (
        <div className="info-strip" style={{ marginBottom: 12 }}>
          <ShieldCheck size={14} />
          <div>
            <strong>Read-only live preview.</strong> Payment posting is disabled until the live
            write path is validated.
          </div>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '11px 12px',
          border: '1px solid var(--line)',
          borderRadius: 9,
          background: '#fbf7f0',
          marginBottom: 16,
        }}
      >
        <span className="avatar avatar--md">
          {student.firstName[0]}
          {student.lastName[0]}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 650 }}>{fullName(student)}</div>
          <div className="muted" style={{ fontSize: 10, marginTop: 1 }}>
            {student.id} · {student.programName} · {student.year}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="muted" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Balance
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: student.balance > 0 ? 'var(--red)' : 'var(--green)' }}>
            {student.balance > 0 ? formatMoney(student.balance) : 'Cleared'}
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="payment-amount">Amount received</label>
          <div className="input-wrap">
            <span className="input-prefix">₱</span>
            <input
              id="payment-amount"
              className="input input--money"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value)
                setError('')
              }}
              aria-invalid={error ? true : undefined}
              autoFocus
              disabled={readOnly}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            {[0.25, 0.5, 1].map((share) => (
              <button
                key={share}
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setAmount(String(Math.round(student.balance * share)))
                  setError('')
                }}
                disabled={student.balance === 0}
              >
                {share === 1 ? 'Full balance' : `${share * 100}%`}
              </button>
            ))}
          </div>
          {error && <span className="field__error">{error}</span>}
          {over && <span className="field__hint">This is more than the outstanding balance. The account will show a credit.</span>}
        </div>

        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="paycode">Paycode</label>
            <select id="paycode" className="select" value={paycode} onChange={(event) => setPaycode(event.target.value)}>
              <option value="TUI">Tuition fee</option>
              <option value="REG">Registration fee</option>
              <option value="LAB">Laboratory fee</option>
              <option value="MISC">Miscellaneous fee</option>
              <option value="OTH">Other fee</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="fund">Fund</label>
            <select id="fund" className="select" value={fund} onChange={(event) => setFund(event.target.value)}>
              <option>Trust Fund</option>
              <option>General Fund</option>
              <option>Special Fund</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="payment-note">Note (optional)</label>
          <textarea
            id="payment-note"
            className="textarea"
            placeholder="e.g. partial payment for prelim"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        <div className="payment-summary">
          <div className="payment-summary__row">
            <span>Assessment total</span>
            <strong>{formatMoney(student.assessmentTotal)}</strong>
          </div>
          <div className="payment-summary__row">
            <span>Amount paid</span>
            <strong>{formatMoney(student.amountPaid)}</strong>
          </div>
          <div className="payment-summary__row">
            <span>Current balance</span>
            <strong>{formatMoney(student.balance)}</strong>
          </div>
          <div className="payment-summary__row">
            <span>This payment</span>
            <strong>{valid ? formatMoney(parsed) : '—'}</strong>
          </div>
          <div className="payment-summary__row payment-summary__row--total">
            <span>Balance after</span>
            <strong>{valid ? formatMoney(after) : '—'}</strong>
          </div>
        </div>

        <div className="info-strip">
          <ShieldCheck size={14} />
          <div>
            The OR number is generated by the database on save. Payments are posted in one
            transaction with the collection details.
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function ReceiptDialog({
  payment,
  student,
  live = false,
  onClose,
  onToast,
}: {
  payment: Payment | null
  student: Student | null
  live?: boolean
  onClose: () => void
  onToast: (title: string, detail?: string) => void
}) {
  if (!payment || !student) return null

  return (
    <Modal
      eyebrow={live ? 'Official receipt · live record' : 'Official receipt'}
      title={live ? 'Receipt reprint' : 'Payment posted'}
      subtitle={
        live
          ? 'Read directly from srgb.payment. The official OR print layout is still being matched.'
          : 'A sample receipt preview. The live version uses the school’s OR layout.'
      }
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--secondary" onClick={() => window.print()}>
            <Printer size={14} />
            Print receipt
          </button>
          <button className="btn btn--primary" onClick={onClose}>
            <CheckCircle2 size={14} />
            Done
          </button>
        </>
      }
    >
      <div className="receipt">
        <div className="receipt__paper">
          <div className="receipt__head">
            <div className="receipt__school">St. Peter’s College</div>
            <div className="receipt__address">Iligan City · Office of the Cashier</div>
            <div className="receipt__title">Official Receipt</div>
          </div>
          <div className="receipt__meta">
            <div>
              OR number
              <strong>{payment.orno}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              Date
              <strong>{formatDate(payment.date)}</strong>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="receipt__line">
              <span>Received from</span>
              <strong>{fullName(student)}</strong>
            </div>
            <div className="receipt__line">
              <span>Student ID</span>
              <strong>{student.id}</strong>
            </div>
            <div className="receipt__line">
              <span>Paycode</span>
              <strong>{payment.paycode}</strong>
            </div>
            <div className="receipt__line">
              <span>Fund</span>
              <strong>{payment.fund}</strong>
            </div>
            <div className="receipt__line">
              <span>Cashier</span>
              <strong>{payment.cashier}</strong>
            </div>
          </div>
          <div className="receipt__total">
            <span>Amount received</span>
            <strong>{formatMoney(payment.amount)}</strong>
          </div>
          <div className="receipt__foot">
            {live ? 'Reprinted from live school records.' : 'This is a sample preview generated from demo data.'}
            <br />
            Thank you. Keep this receipt for your records.
          </div>
        </div>
        <div className="info-strip mt-3">
          <ReceiptText size={14} />
          <div>
            The live receipt will be generated from the same PostgreSQL record. No separate upload
            step is introduced.
          </div>
        </div>
        <div className="info-strip mt-2">
          <Banknote size={14} />
          <div>Remaining balance: <strong>{formatMoney(Math.max(0, student.balance))}</strong></div>
        </div>
      </div>
    </Modal>
  )
}
