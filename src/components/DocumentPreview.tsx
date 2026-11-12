import { Printer, X } from 'lucide-react'
import type { Enrollment, Payment, Student, Term } from '../types'
import { getFeeLines, type FeeLine } from '../lib/fees'
import { formatDate, formatMoney, fullName } from '../lib/format'
import { Modal } from './ui'

export type DocumentKind = 'cor' | 'assessment' | 'statement' | 'tor'

const titles: Record<DocumentKind, { eyebrow: string; title: string; office: string }> = {
  cor: {
    eyebrow: 'Registrar · official document',
    title: 'Certificate of Registration',
    office: 'Office of the Registrar',
  },
  assessment: {
    eyebrow: 'Accounting · official document',
    title: 'Enrollment Assessment',
    office: 'Office of the Accountant',
  },
  statement: {
    eyebrow: 'Cashier · student account',
    title: 'Statement of Account',
    office: 'Office of the Cashier',
  },
  tor: {
    eyebrow: 'Registrar · academic record',
    title: 'Transcript of Records',
    office: 'Office of the Registrar',
  },
}

export function DocumentPreview({
  kind,
  student,
  enrollments,
  payments,
  term,
  live = false,
  feeLines,
  onClose,
}: {
  kind: DocumentKind
  student: Student
  enrollments: Enrollment[]
  payments: Payment[]
  term: Term
  live?: boolean
  feeLines?: FeeLine[]
  onClose: () => void
}) {
  const meta = titles[kind]
  const fees = feeLines ?? getFeeLines(student)
  const totalUnits = enrollments.reduce((sum, item) => sum + item.units, 0)
  const totalPaid = payments
    .filter((payment) => payment.status === 'Posted')
    .reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <Modal
      eyebrow={meta.eyebrow}
      title={meta.title}
      subtitle="Preview only. The final print layout is being matched to the official Registrar/Cashier forms."
      onClose={onClose}
      size="wide"
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose}>
            <X size={14} />
            Close
          </button>
          <button className="btn btn--primary" onClick={() => window.print()}>
            <Printer size={14} />
            Print document
          </button>
        </>
      }
    >
      <article className="document-sheet" id="print-document">
        <header className="doc-letterhead">
          <img src="./spc-logo.jpg" alt="" />
          <div>
            <div className="doc-school">St. Peter’s College</div>
            <div className="doc-place">Iligan City · Philippines</div>
            <div className="doc-office">{meta.office}</div>
          </div>
        </header>

        <div className="doc-rule" />
        <h1 className="doc-title">{meta.title}</h1>
        <p className="doc-term">{term.label}</p>

        <div className="doc-meta">
          <div>
            <span>Student</span>
            <strong>{fullName(student)}</strong>
          </div>
          <div>
            <span>Student ID</span>
            <strong>{student.id}</strong>
          </div>
          <div>
            <span>Program</span>
            <strong>{student.programName}</strong>
          </div>
          <div>
            <span>Year level</span>
            <strong>{student.year}</strong>
          </div>
        </div>

        {kind === 'assessment' ? (
          <>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Fee</th>
                  <th className="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.label}>
                    <td>
                      {fee.label}
                      {fee.note && <small>{fee.note}</small>}
                    </td>
                    <td className="right">{formatMoney(fee.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="doc-totals">
              <div>
                <span>Total assessment</span>
                <strong>{formatMoney(student.assessmentTotal)}</strong>
              </div>
              <div>
                <span>Amount paid</span>
                <strong>{formatMoney(totalPaid)}</strong>
              </div>
              <div className="doc-totals__balance">
                <span>Outstanding balance</span>
                <strong>{formatMoney(Math.max(0, student.balance))}</strong>
              </div>
            </div>
          </>
        ) : kind === 'statement' ? (
          <>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>OR number</th>
                  <th>Date</th>
                  <th>Paycode</th>
                  <th>Fund</th>
                  <th className="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No payments posted for {term.label}.</td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.orno}</td>
                      <td>{formatDate(payment.date)}</td>
                      <td>{payment.paycode}</td>
                      <td>{payment.fund}</td>
                      <td className="right">{formatMoney(payment.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="doc-totals">
              <div>
                <span>Total assessment</span>
                <strong>{formatMoney(student.assessmentTotal)}</strong>
              </div>
              <div>
                <span>Total paid</span>
                <strong>{formatMoney(totalPaid)}</strong>
              </div>
              <div className="doc-totals__balance">
                <span>Balance</span>
                <strong>{formatMoney(Math.max(0, student.balance))}</strong>
              </div>
            </div>
          </>
        ) : kind === 'tor' ? (
          <>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Descriptive title</th>
                  <th className="center">Prelim</th>
                  <th className="center">Midterm</th>
                  <th className="center">Pre-final</th>
                  <th className="center">Final</th>
                  <th className="center">Units</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((item) => (
                  <tr key={`${item.code}-${item.section}`}>
                    <td>{item.code}</td>
                    <td>{item.title}</td>
                    <td className="center">{item.prelim ?? '—'}</td>
                    <td className="center">{item.midterm ?? '—'}</td>
                    <td className="center">{item.prefinal ?? '—'}</td>
                    <td className="center">{item.final ?? '—'}</td>
                    <td className="center">{item.units}</td>
                    <td>{item.remark ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="doc-totals">
              <div>
                <span>Total units</span>
                <strong>{totalUnits}</strong>
              </div>
              <div>
                <span>Cumulative GPA</span>
                <strong>{student.gpa ? student.gpa.toFixed(2) : '—'}</strong>
              </div>
            </div>
          </>
        ) : (
          <>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Descriptive title</th>
                  <th>Section</th>
                  <th>Schedule</th>
                  <th>Room</th>
                  <th className="center">Units</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((item) => (
                  <tr key={`${item.code}-${item.section}`}>
                    <td>{item.code}</td>
                    <td>{item.title}</td>
                    <td>{item.section}</td>
                    <td>{item.schedule}</td>
                    <td>{item.room}</td>
                    <td className="center">{item.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="doc-totals">
              <div>
                <span>Total units</span>
                <strong>{totalUnits}</strong>
              </div>
              <div>
                <span>Assessment</span>
                <strong>{formatMoney(student.assessmentTotal)}</strong>
              </div>
              <div className="doc-totals__balance">
                <span>Balance</span>
                <strong>{formatMoney(Math.max(0, student.balance))}</strong>
              </div>
            </div>
          </>
        )}

        <div className="doc-signatures">
          <div>
            <div className="doc-signature-line" />
            <span>Registrar / Authorized Signatory</span>
          </div>
          <div>
            <div className="doc-signature-line" />
            <span>Student / Guardian</span>
          </div>
        </div>

        <footer className="doc-footer">
          Generated from SERMS Modern · {formatDate(new Date().toISOString().slice(0, 10))} ·{' '}
          {live
            ? 'Read-only live record preview. Official layout validation is still pending.'
            : 'This preview uses sample data until the live print service is enabled.'}
        </footer>
      </article>
    </Modal>
  )
}
