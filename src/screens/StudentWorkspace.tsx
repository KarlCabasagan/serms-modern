import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  ScrollText,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react'
import type { Enrollment, Payment, Student, Subject, Term } from '../types'
import { subjects } from '../data/mock'
import { getFeeLines } from '../lib/fees'
import { formatDate, formatMoney, fullName } from '../lib/format'
import { Badge, EmptyState, InfoStrip, Modal } from '../components/ui'
import { StudentDialog } from '../components/StudentDialog'
import { DocumentPreview, type DocumentKind } from '../components/DocumentPreview'
import { LiveGradeDialog } from '../components/LiveGradeDialog'
import { LiveClassGradeDialog } from '../components/LiveClassGradeDialog'

type TabKey = 'overview' | 'enrollment' | 'assessment' | 'payments' | 'grades' | 'documents'

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'enrollment', label: 'Enrollment' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'payments', label: 'Payments' },
  { key: 'grades', label: 'Grades' },
  { key: 'documents', label: 'Documents' },
]

export default function StudentWorkspace({
  student,
  enrollments,
  payments,
  term,
  readOnly = false,
  canWriteGrades = true,
  assessmentLines,
  assessmentLoading = false,
  classStudents,
  classEnrollments,
  onBack,
  onPayment,
  onUpdateStudent,
  onSaveLiveGrades,
  onToast,
}: {
  student: Student
  enrollments: Enrollment[]
  payments: Payment[]
  term: Term
  readOnly?: boolean
  canWriteGrades?: boolean
  assessmentLines?: Array<{ code: string; label: string; amount: number }>
  assessmentLoading?: boolean
  classStudents?: Student[]
  classEnrollments?: Enrollment[]
  onBack: () => void
  onPayment: (student: Student) => void
  onUpdateStudent: (student: Student) => void
  onSaveLiveGrades?: (rows: Array<{ studid: string; subjcode: string; prelim1: string; prelim2: string; prelim3: string; prelim4: string; remarks: string }>) => Promise<boolean>
  onToast: (title: string, detail?: string) => void
}) {
  const [tab, setTab] = useState<TabKey>('overview')
  const [localEnrollments, setLocalEnrollments] = useState<Enrollment[]>(enrollments)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [liveGradeOpen, setLiveGradeOpen] = useState(false)
  const [classGradeOpen, setClassGradeOpen] = useState(false)
  const [docPreview, setDocPreview] = useState<DocumentKind | null>(null)
  const [subjectQuery, setSubjectQuery] = useState('')

  const totalUnits = localEnrollments.reduce((sum, item) => sum + item.units, 0)
  const totalPaid = payments.filter((payment) => payment.status === 'Posted').reduce((sum, payment) => sum + payment.amount, 0)
  const lastPayment = payments[0]
  const fees = getFeeLines(student)
  const liveFeeLines =
    readOnly && assessmentLines && assessmentLines.length > 0
      ? assessmentLines.map((line) => ({
          label: line.label,
          amount: line.amount,
          note: line.code,
        }))
      : null
  const displayedFees = liveFeeLines ?? fees

  const availableSubjects = useMemo(() => {
    const current = new Set(localEnrollments.map((item) => item.code))
    const q = subjectQuery.trim().toLowerCase()
    return subjects
      .filter((subject) => !current.has(subject.code))
      .filter((subject) => !q || `${subject.code} ${subject.title} ${subject.instructor}`.toLowerCase().includes(q))
      .slice(0, 7)
  }, [localEnrollments, subjectQuery])

  function addSubject(subject: Subject) {
    setLocalEnrollments((current) => [
      ...current,
      {
        studentId: student.id,
        code: subject.code,
        title: subject.title,
        units: subject.units,
        section: subject.section,
        schedule: subject.schedule,
        room: subject.room,
        instructor: subject.instructor,
        status: 'Enrolled',
      },
    ])
    setPickerOpen(false)
    setSubjectQuery('')
    onToast('Subject added to the demo COR', `${subject.code} · ${subject.title}. The assessment will recompute when connected to the database.`)
    setTab('enrollment')
  }

  function printDocument(kind: DocumentKind) {
    if (readOnly && kind === 'assessment' && assessmentLoading) {
      onToast('Loading assessment', 'The live fee lines are still being read from the school database.')
      return
    }
    if (readOnly && kind === 'assessment' && !liveFeeLines) {
      onToast(
        'No live fee lines to print',
        'The live total and balance are available in Account summary, but srgb.ass_details has no fee breakdown for this student.',
      )
      return
    }
    setDocPreview(kind)
  }

  function removeSubject(code: string, section: string) {
    setLocalEnrollments((current) =>
      current.filter((item) => !(item.code === code && item.section === section)),
    )
    onToast('Subject removed from the demo COR', `${code} · Section ${section}`)
  }

  return (
    <div className="page">
      <section className="student-hero" aria-labelledby="student-name">
        <div className="student-hero__main">
          <div className="avatar avatar--xl avatar--gold student-hero__avatar">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div className="student-hero__identity">
            <button className="student-hero__back" onClick={onBack}>
              <ArrowLeft size={11} />
              Student directory
            </button>
            <h1 className="student-hero__name" id="student-name">
              {fullName(student)}
            </h1>
            <div className="student-hero__meta">
              <span>
                <UserRound size={12} />
                {student.id}
              </span>
              <span>
                <GraduationCap size={12} />
                {student.programName} · {student.year}
              </span>
              <span>
                <CalendarDays size={12} />
                Enrolled {formatDate(student.enrolledAt)}
              </span>
            </div>
            <div className="student-hero__chips">
              <span className="student-hero__chip">
                <ShieldCheck size={11} />
                {student.status}
              </span>
              <span className="student-hero__chip student-hero__chip--gold">
                <BadgeCheck size={11} />
                {student.scholarship}
              </span>
              <span className="student-hero__chip">{student.college}</span>
              {student.status === 'Graduating' && (
                <span className="student-hero__chip student-hero__chip--gold">Graduation candidate</span>
              )}
            </div>
          </div>
        </div>

        <div className="student-hero__side">
          <div className="student-hero__balance">
            <div className="student-hero__balance-label">Outstanding balance</div>
            <div className={`student-hero__balance-value ${student.balance === 0 ? 'student-hero__balance-value--clear' : ''}`}>
              {student.balance === 0 ? 'Cleared' : formatMoney(student.balance)}
            </div>
            <div className="student-hero__balance-note">
              {lastPayment ? `Last payment ${formatDate(lastPayment.date)}` : 'No payments posted'}
            </div>
          </div>
          <div className="student-hero__actions">
            <button className="btn btn--secondary btn--sm" onClick={() => printDocument('cor')}>
              <Printer size={13} />
              Print COR
            </button>
            {readOnly ? (
              <span className="badge badge--info">Live · school data</span>
            ) : (
              <button className="btn btn--primary btn--sm" onClick={() => onPayment(student)}>
                <CreditCard size={13} />
                Record payment
              </button>
            )}
          </div>
        </div>
      </section>

      <nav className="tabs" role="tablist" aria-label="Student record sections">
        {tabs.map((item) => (
          <button
            key={item.key}
            className="tab"
            role="tab"
            aria-selected={tab === item.key}
            aria-controls={`tab-panel-${item.key}`}
            id={`tab-${item.key}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
            {item.key === 'enrollment' && <span className="tab__count">{localEnrollments.length}</span>}
            {item.key === 'payments' && <span className="tab__count">{payments.length}</span>}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div id="tab-panel-overview" role="tabpanel" aria-labelledby="tab-overview">
          <div className="detail-grid">
            <div className="stack">
              <section className="card">
                <div className="card__head">
                  <div>
                    <h3>Current registration</h3>
                    <p>
                      {term.label} · {totalUnits} units
                    </p>
                  </div>
                  <button className="section-heading__link" onClick={() => setTab('enrollment')}>
                    Open enrollment
                  </button>
                </div>
                <div className="table-wrap">
                  {localEnrollments.length === 0 ? (
                    <EmptyState
                      icon={<BookOpen size={18} />}
                      title="No subjects on the COR"
                      description="This student has no registration for the active term."
                      action={
                        !readOnly ? (
                          <button className="btn btn--primary btn--sm" onClick={() => setPickerOpen(true)}>
                            <Plus size={13} />
                            Add subjects
                          </button>
                        ) : undefined
                      }
                    />
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th scope="col">Code</th>
                          <th scope="col">Subject</th>
                          <th scope="col">Schedule</th>
                          <th scope="col">Room</th>
                          <th scope="col" className="center">
                            Units
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {localEnrollments.map((item) => (
                          <tr key={`${item.code}-${item.section}`}>
                            <td className="strong nowrap">{item.code}</td>
                            <td>
                              <div className="strong">{item.title}</div>
                              <div className="muted-cell">{item.instructor}</div>
                            </td>
                            <td className="nowrap">{item.schedule}</td>
                            <td className="muted-cell">{item.room}</td>
                            <td className="center tabular">{item.units}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {localEnrollments.length > 0 && (
                  <div className="card__footer">
                    <span className="muted" style={{ fontSize: 10 }}>
                      Section {localEnrollments[0]?.section}
                      {student.adviser ? ` · ${student.adviser}` : ''}
                    </span>
                    <span className="strong" style={{ fontSize: 11 }}>
                      Total: {totalUnits} units
                    </span>
                  </div>
                )}
              </section>

              <section className="card">
                <div className="card__head">
                  <div>
                    <h3>Student information</h3>
                    <p>Contact and personal details</p>
                  </div>
                  {!readOnly && (
                    <button className="section-heading__link" onClick={() => setEditOpen(true)}>
                      Edit
                    </button>
                  )}
                </div>
                <div className="card__body">
                  <div className="detail-list">
                    <div className="detail-row">
                      <span className="detail-row__label">Email</span>
                      <span className="detail-row__value">{student.email || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Mobile</span>
                      <span className="detail-row__value">{student.phone || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Address</span>
                      <span className="detail-row__value">{student.address || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Date of birth</span>
                      <span className="detail-row__value">{formatDate(student.birthDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Adviser</span>
                      <span className="detail-row__value">{student.adviser}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="stack">
              <section className="card">
                <div className="card__head">
                  <div>
                    <h3>Account summary</h3>
                    <p>Current term assessment</p>
                  </div>
                  <button className="section-heading__link" onClick={() => setTab('assessment')}>
                    Details
                  </button>
                </div>
                <div className="card__body">
                  <div className="summary-panel">
                    <div className="summary-panel__label">Total assessment</div>
                    <div className="summary-panel__value">{formatMoney(student.assessmentTotal)}</div>
                    <div className="summary-panel__rows">
                      <div className="summary-panel__row">
                        <span>Amount paid</span>
                        <strong>{formatMoney(totalPaid)}</strong>
                      </div>
                      <div className={`summary-panel__row ${student.balance > 0 ? 'summary-panel__row--due' : 'summary-panel__row--clear'}`}>
                        <span>Balance</span>
                        <strong>{student.balance > 0 ? formatMoney(student.balance) : 'Cleared'}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="info-strip mt-3">
                    <Wallet size={14} />
                    <div>
                      {student.assessmentTotal <= 0
                        ? 'No assessment is recorded for this term. The live record is showing enrollment and payment history only.'
                        : student.balance > 0
                          ? 'A payment can be posted directly to this account. The cashier flow keeps the OR number and fund together.'
                          : 'This account is fully paid for the active term. Any new charge will appear here after reassessment.'}
                    </div>
                  </div>
                </div>
                <div className="card__footer">
                  <span className="muted" style={{ fontSize: 10 }}>
                    {payments.length} payment{payments.length === 1 ? '' : 's'} on record
                  </span>
                  {!readOnly && (
                    <button className="btn btn--soft btn--sm" onClick={() => onPayment(student)}>
                      <CreditCard size={12} />
                      Record payment
                    </button>
                  )}
                </div>
              </section>

              <section className="card">
                <div className="card__head">
                  <div>
                    <h3>Academic snapshot</h3>
                    <p>Current standing</p>
                  </div>
                </div>
                <div className="card__body">
                  <div className="detail-list">
                    <div className="detail-row">
                      <span className="detail-row__label">Cumulative GPA</span>
                      <span className="detail-row__value detail-row__value--strong">{student.gpa ? student.gpa.toFixed(2) : '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Year level</span>
                      <span className="detail-row__value">{student.year}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Program</span>
                      <span className="detail-row__value">{student.program}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Scholarship</span>
                      <span className="detail-row__value">{student.scholarship}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Status</span>
                      <span className="detail-row__value">
                        <Badge>{student.status}</Badge>
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {tab === 'enrollment' && (
        <div id="tab-panel-enrollment" role="tabpanel" aria-labelledby="tab-enrollment">
          <div className="toolbar">
            <div>
              <h2 className="section-heading" style={{ marginBottom: 2 }}>
                Subjects on the COR
              </h2>
              <p className="muted" style={{ fontSize: 11 }}>
                {term.label} · validated by the same registration rules as the current system
              </p>
            </div>
            <div className="toolbar__spacer" />
            <button className="btn btn--secondary" onClick={() => onToast('COR preview', 'Printing is deferred to the reporting phase.')}>
              <Printer size={14} />
              Print COR
            </button>
            {!readOnly && (
              <button className="btn btn--primary" onClick={() => setPickerOpen(true)}>
                <Plus size={14} />
                Add subject
              </button>
            )}
          </div>

          <div className="card card--flush">
            {localEnrollments.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={18} />}
                title="No enrollment yet"
                description="Add subjects to build the Certificate of Registration for this student."
                action={
                  !readOnly ? (
                    <button className="btn btn--primary btn--sm" onClick={() => setPickerOpen(true)}>
                      <Plus size={13} />
                      Add first subject
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Code</th>
                      <th scope="col">Descriptive title</th>
                      <th scope="col">Section</th>
                      <th scope="col">Schedule</th>
                      <th scope="col">Room</th>
                      <th scope="col">Instructor</th>
                      <th scope="col" className="center">Units</th>
                      <th scope="col">Status</th>
                      {!readOnly && <th scope="col" aria-label="Remove" />}
                    </tr>
                  </thead>
                  <tbody>
                    {localEnrollments.map((item) => (
                      <tr key={`${item.code}-${item.section}`}>
                        <td className="strong nowrap">{item.code}</td>
                        <td>
                          <div className="strong">{item.title}</div>
                          <div className="muted-cell">{item.instructor}</div>
                        </td>
                        <td>{item.section}</td>
                        <td className="nowrap">{item.schedule}</td>
                        <td className="muted-cell">{item.room}</td>
                        <td className="muted-cell">{item.instructor}</td>
                        <td className="center tabular">{item.units}</td>
                        <td>
                          <Badge>{item.status}</Badge>
                        </td>
                        {!readOnly && (
                          <td className="row-actions">
                            <button
                              className="icon-button"
                              onClick={() => removeSubject(item.code, item.section)}
                              aria-label={`Remove ${item.code} from the COR`}
                              title="Remove from COR"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {localEnrollments.length > 0 && (
              <div className="card__footer">
                <span className="muted" style={{ fontSize: 10 }}>
                  Prerequisites and subject locks are enforced by the database, not the screen.
                </span>
                <span className="strong" style={{ fontSize: 11 }}>
                  Total unit load: {totalUnits}
                </span>
              </div>
            )}
          </div>
          <div className="info-strip mt-3">
            <ShieldCheck size={14} />
            <div>
              Registration is written directly to <strong>srgb.registration</strong> on the school server.
              The existing trigger still checks prerequisites, duplicate subjects, and grade locks.
            </div>
          </div>
        </div>
      )}

      {tab === 'assessment' && (
        <div id="tab-panel-assessment" role="tabpanel" aria-labelledby="tab-assessment">
          <div className="detail-grid">
            <section className="card">
              <div className="card__head">
                <div>
                  <h3>Assessment breakdown</h3>
                  <p>{term.label} · {student.units} units · {student.programName}</p>
                </div>
                <button className="btn btn--secondary btn--sm" onClick={() => printDocument('assessment')}>
                  <Printer size={13} />
                  Print
                </button>
              </div>
              <div className="card__body">
                {assessmentLoading && (
                  <div className="info-strip" style={{ marginBottom: 0 }}>
                    <Loader2 size={14} className="spin" />
                    <div>Loading live fee lines from the school database…</div>
                  </div>
                )}
                {!assessmentLoading && readOnly && !liveFeeLines && (
                  <div className="info-strip" style={{ marginBottom: 0 }}>
                    <ShieldCheck size={14} />
                    <div>
                      The live assessment total is read from the school database. There are no
                      fee lines in <strong>srgb.ass_details</strong> for this student, so the demo
                      breakdown is not shown.
                    </div>
                  </div>
                )}
                {!assessmentLoading && (!readOnly || liveFeeLines) && (
                  <>
                    <div className="fee-list">
                      {displayedFees.map((fee) => (
                        <div className="fee-row" key={`${fee.label}-${'code' in fee ? fee.code : ''}`}>
                          <div>
                            <div className="fee-row__label">{fee.label}</div>
                            {'note' in fee && fee.note && <span className="fee-row__note">{fee.note}</span>}
                          </div>
                          <div className="fee-row__amount">{formatMoney(fee.amount)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="fee-total">
                      <span>Total assessment</span>
                      <strong>{formatMoney(student.assessmentTotal)}</strong>
                    </div>
                  </>
                )}
              </div>
            </section>

            <div className="stack">
              <section className="card">
                <div className="card__head">
                  <div>
                    <h3>Payment status</h3>
                    <p>As of {formatDate(payments[0]?.date ?? student.enrolledAt)}</p>
                  </div>
                </div>
                <div className="card__body">
                  <div className="summary-panel">
                    <div className="summary-panel__label">Balance due</div>
                    <div className="summary-panel__value">{student.balance === 0 ? 'Cleared' : formatMoney(student.balance)}</div>
                    <div className="summary-panel__rows">
                      <div className="summary-panel__row">
                        <span>Total assessment</span>
                        <strong>{formatMoney(student.assessmentTotal)}</strong>
                      </div>
                      <div className="summary-panel__row">
                        <span>Total paid</span>
                        <strong>{formatMoney(totalPaid)}</strong>
                      </div>
                    </div>
                  </div>
                  {!readOnly && (
                    <button className="btn btn--primary mt-3" style={{ width: '100%' }} onClick={() => onPayment(student)}>
                      <CreditCard size={14} />
                      Record a payment
                    </button>
                  )}
                </div>
              </section>

              <section className="card">
                <div className="card__head">
                  <div>
                    <h3>Installment schedule</h3>
                    <p>Based on the active payment policy</p>
                  </div>
                </div>
                <div className="card__body">
                  <div className="detail-list">
                    {[
                      ['Prelim', 0.3],
                      ['Midterm', 0.3],
                      ['Semi-final', 0.2],
                      ['Final', 0.2],
                    ].map(([label, share]) => (
                      <div className="detail-row" key={String(label)}>
                        <span className="detail-row__label">{label}</span>
                        <span className="detail-row__value">{formatMoney(student.assessmentTotal * Number(share))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div id="tab-panel-payments" role="tabpanel" aria-labelledby="tab-payments">
          <div className="toolbar">
            <div>
              <h2 className="section-heading" style={{ marginBottom: 2 }}>
                Payment history
              </h2>
              <p className="muted" style={{ fontSize: 11 }}>
                Posted receipts for this student · {formatMoney(totalPaid)} total
              </p>
            </div>
            <div className="toolbar__spacer" />
            <button className="btn btn--secondary" onClick={() => printDocument('statement')}>
              <Download size={14} />
              Statement
            </button>
            {!readOnly && (
              <button className="btn btn--primary" onClick={() => onPayment(student)}>
                <CreditCard size={14} />
                Record payment
              </button>
            )}
          </div>

          <div className="card card--flush">
            {payments.length === 0 ? (
              <EmptyState
                icon={<ReceiptText size={18} />}
                title="No payments yet"
                description={
                  readOnly
                    ? 'No payments are posted for this student in the active term.'
                    : 'Post the first payment for this student. The OR number will be generated by the database.'
                }
                action={
                  !readOnly ? (
                    <button className="btn btn--primary btn--sm" onClick={() => onPayment(student)}>
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
                      <th scope="col">Date</th>
                      <th scope="col">Paycode</th>
                      <th scope="col">Fund</th>
                      <th scope="col">Cashier</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="strong tabular">{payment.orno}</td>
                        <td>{formatDate(payment.date)}</td>
                        <td>
                          <Badge tone="Info" noDot>
                            {payment.paycode}
                          </Badge>
                        </td>
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
            )}
            {payments.length > 0 && (
              <div className="card__footer">
                <span className="muted" style={{ fontSize: 10 }}>
                  Official receipts can be reprinted from the Cashier report library.
                </span>
                <span className="strong" style={{ fontSize: 11 }}>
                  Total paid: {formatMoney(totalPaid)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'grades' && (
        <div id="tab-panel-grades" role="tabpanel" aria-labelledby="tab-grades">
          <div className="toolbar">
            <div>
              <h2 className="section-heading" style={{ marginBottom: 2 }}>
                Grades · {term.label}
              </h2>
              <p className="muted" style={{ fontSize: 11 }}>
                Current enrollment grades and completion status
              </p>
            </div>
            <div className="toolbar__spacer" />
            <button className="btn btn--secondary" onClick={() => printDocument('tor')}>
              <ScrollText size={14} />
              TOR preview
            </button>
            {!readOnly ? (
              <button className="btn btn--primary" onClick={() => onToast('Grade sheet', 'The grade entry sheet opens for the assigned faculty account.')}>
                <ClipboardList size={14} />
                Open grade sheet
              </button>
            ) : canWriteGrades ? (
              <>
                <button className="btn btn--secondary" onClick={() => setLiveGradeOpen(true)}>
                  <ClipboardList size={14} />
                  Live grade entry
                </button>
                {classStudents && classEnrollments && (
                  <button className="btn btn--primary" onClick={() => setClassGradeOpen(true)}>
                    <ClipboardList size={14} />
                    Class grade sheet
                  </button>
                )}
              </>
            ) : (
              <span className="badge badge--neutral">Grade entry not available for this role</span>
            )}
          </div>

          <div className="detail-grid">
            <section className="card card--flush">
              <div className="card__head" style={{ paddingBottom: 14 }}>
                <div>
                  <h3>Subject grades</h3>
                  <p>Prelim, midterm, pre-final, and final</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Code</th>
                      <th scope="col">Subject</th>
                      <th scope="col" className="center">Prelim</th>
                      <th scope="col" className="center">Midterm</th>
                      <th scope="col" className="center">Pre-final</th>
                      <th scope="col" className="center">Final</th>
                      <th scope="col">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty-state" style={{ padding: '34px 16px' }}>
                            <p>No subjects are registered for this term.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      localEnrollments.map((item) => (
                        <tr key={`${item.code}-${item.section}`}>
                          <td className="strong nowrap">{item.code}</td>
                          <td>
                            <div className="strong">{item.title}</div>
                            <div className="muted-cell">Section {item.section} · {item.instructor}</div>
                          </td>
                          <td className="center tabular">{item.prelim ?? '—'}</td>
                          <td className="center tabular">{item.midterm ?? '—'}</td>
                          <td className="center tabular">{item.prefinal ?? '—'}</td>
                          <td className="center tabular">{item.final ?? '—'}</td>
                          <td>
                            <Badge tone={item.prelim ? 'pending' : 'neutral'}>
                              {item.prelim ? 'In progress' : 'Not started'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="stack">
              <section className="card">
                <div className="card__head">
                  <div>
                    <h3>GPA snapshot</h3>
                    <p>Cumulative academic standing</p>
                  </div>
                  <GraduationCap size={16} color="#a9822e" />
                </div>
                <div className="card__body">
                  <div className="summary-panel">
                    <div className="summary-panel__label">Cumulative GPA</div>
                    <div className="summary-panel__value">{student.gpa ? student.gpa.toFixed(2) : '—'}</div>
                    <div className="summary-panel__rows">
                      <div className="summary-panel__row">
                        <span>Units earned</span>
                        <strong>{student.units}</strong>
                      </div>
                      <div className="summary-panel__row">
                        <span>Academic status</span>
                        <strong>Good standing</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <div className="info-strip">
                <ShieldCheck size={14} />
                <div>
                  Grades are saved directly to <strong>srgb.registration</strong> on the school server.
                  There is no separate upload service; the same database rules apply.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div id="tab-panel-documents" role="tabpanel" aria-labelledby="tab-documents">
          <div className="toolbar">
            <div>
              <h2 className="section-heading" style={{ marginBottom: 2 }}>
                Documents
              </h2>
              <p className="muted" style={{ fontSize: 11 }}>
                Official records generated from the student’s current data
              </p>
            </div>
          </div>
          <div className="docs-grid">
            {[
              { title: 'Certificate of Registration', meta: 'Current term · with schedule', icon: FileText, kind: 'cor' as DocumentKind },
              { title: 'Assessment', meta: 'Current term · fee breakdown', icon: ReceiptText, kind: 'assessment' as DocumentKind },
              { title: 'Transcript of Records', meta: 'Cumulative · all terms', icon: ScrollText, kind: 'tor' as DocumentKind },
              { title: 'Statement of Account', meta: 'Payments and running balance', icon: Wallet, kind: 'statement' as DocumentKind },
              { title: 'Official Receipt', meta: lastPayment ? lastPayment.orno : 'No payment posted', icon: BadgeCheck, kind: null },
              { title: 'Exam Permit', meta: 'Eligibility and account status', icon: ClipboardList, kind: 'assessment' as DocumentKind },
            ].map((doc) => {
              const Icon = doc.icon
              return (
                <button
                  className="doc-card"
                  key={doc.title}
                  onClick={() => {
                    if (doc.title === 'Official Receipt') {
                      onToast('Receipt preview', lastPayment ? `Open ${lastPayment.orno} from the payments tab.` : 'No payment has been posted.')
                      return
                    }
                    if (doc.kind) printDocument(doc.kind)
                  }}
                >
                  <span className="doc-card__icon">
                    <Icon size={16} />
                  </span>
                  <h3>{doc.title}</h3>
                  <p>{doc.meta}</p>
                  <span className="doc-card__meta">
                    <Printer size={11} />
                    Preview document
                    <ChevronRight size={11} />
                  </span>
                </button>
              )
            })}
          </div>
          <div className="info-strip mt-3">
            <FileText size={14} />
            <div>
              Print layouts will be matched to the official Registrar and Cashier forms during the
              reporting phase. The document data comes from the same PostgreSQL records.
            </div>
          </div>
        </div>
      )}

      {classGradeOpen && readOnly && canWriteGrades && onSaveLiveGrades && classStudents && classEnrollments && (
        <LiveClassGradeDialog
          student={student}
          students={classStudents}
          enrollments={classEnrollments}
          term={term}
          onClose={() => setClassGradeOpen(false)}
          onSave={onSaveLiveGrades}
        />
      )}

      {liveGradeOpen && readOnly && onSaveLiveGrades && (
        <LiveGradeDialog
          student={student}
          enrollments={localEnrollments}
          term={term}
          onClose={() => setLiveGradeOpen(false)}
          onSave={onSaveLiveGrades}
        />
      )}

      {docPreview && (
        <DocumentPreview
          kind={docPreview}
          student={student}
          enrollments={localEnrollments}
          payments={payments}
          term={term}
          live={readOnly}
          feeLines={liveFeeLines ?? undefined}
          onClose={() => setDocPreview(null)}
        />
      )}

      {editOpen && (
        <StudentDialog
          open
          student={student}
          nextId={0}
          onClose={() => setEditOpen(false)}
          onSave={(updated) => {
            onUpdateStudent(updated)
            setEditOpen(false)
            onToast('Student record updated', `${fullName(updated)} · ${updated.programName}`)
          }}
        />
      )}

      {pickerOpen && (
        <Modal
          eyebrow={`${term.label} · subject offering`}
          title="Add a subject"
          subtitle={`Choose an available subject for ${fullName(student)}. Prerequisites are checked by the database on save.`}
          onClose={() => {
            setPickerOpen(false)
            setSubjectQuery('')
          }}
          footer={
            <>
              <button className="btn btn--secondary" onClick={() => setPickerOpen(false)}>
                Cancel
              </button>
              <span className="muted" style={{ fontSize: 10 }}>
                {availableSubjects.length} available in the demo list
              </span>
            </>
          }
        >
          <div className="search-field" style={{ maxWidth: 'none', marginBottom: 12 }}>
            <Search size={15} />
            <input
              value={subjectQuery}
              onChange={(event) => setSubjectQuery(event.target.value)}
              placeholder="Search by subject code, title, or instructor…"
              aria-label="Search available subjects"
              autoFocus
            />
          </div>
          {availableSubjects.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={18} />}
              title="No matching subjects"
              description="Try a different subject code or clear the search."
            />
          ) : (
            <div className="stack--sm" style={{ display: 'grid', gap: 8 }}>
              {availableSubjects.map((subject) => (
                <div
                  key={subject.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    border: '1px solid var(--line)',
                    borderRadius: 9,
                    background: '#fffdf9',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 650 }}>
                      {subject.code} · {subject.title}
                    </div>
                    <div className="muted" style={{ fontSize: 9.5, marginTop: 2 }}>
                      {subject.units} units · {subject.schedule} · {subject.room} · {subject.instructor}
                    </div>
                  </div>
                  <button className="btn btn--soft btn--sm" onClick={() => addSubject(subject)}>
                    Add
                    <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
