import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FilePlus2,
  FileText,
  Search,
  TrendingUp,
  UserMinus,
  UsersRound,
} from 'lucide-react'
import type { NavKey, Payment, Role, Student, Term } from '../types'
import { formatCompactMoney, formatDateShort, formatMoney, fullName, greeting } from '../lib/format'
import { Badge } from '../components/ui'
import { PageHeader } from '../components/AppShell'

export default function Dashboard({
  role,
  term,
  live,
  liveStats,
  students,
  payments,
  activities,
  onOpenStudent,
  onNavigate,
  onSearch,
  onPayment,
  onToast,
}: {
  role: Role
  term: Term
  live: boolean
  liveStats: {
    students: number
    enrolled: number
    unregistered: number
    balance: number
    collected: number
  } | null
  students: Student[]
  payments: Payment[]
  activities: Array<{ id: string; title: string; detail: string; time: string; tone: string }>
  onOpenStudent: (id: string) => void
  onNavigate: (key: NavKey) => void
  onSearch: () => void
  onPayment: (student: Student) => void
  onToast: (title: string, detail?: string) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const todayPayments = payments.filter((payment) => payment.date === today)
  const todayTotal = todayPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const withBalance = [...students]
    .filter((student) => student.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5)
  const unregistered = students.filter((student) => student.status === 'Unregistered')
  const greetingText = `${greeting()}, ${role === 'Administrator' ? 'Admin' : role === 'Faculty' ? 'Professor' : role}`

  const chart = [
    { label: 'Mon', enrolled: 62, assessed: 38 },
    { label: 'Tue', enrolled: 84, assessed: 51 },
    { label: 'Wed', enrolled: 57, assessed: 34 },
    { label: 'Thu', enrolled: 96, assessed: 62 },
    { label: 'Fri', enrolled: 73, assessed: 49 },
    { label: 'Sat', enrolled: 38, assessed: 21 },
    { label: 'Today', enrolled: 51, assessed: 44 },
  ]

  function openStudent(student: Student) {
    onOpenStudent(student.id)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${role === 'Faculty' ? 'Faculty desk' : role === 'Cashier' ? 'Cashier desk' : role === 'Accounting' ? 'Accounting desk' : "Registrar's desk"} · ${term.label}${live ? ' · live' : ''}`}
        title={
          <>
            {greetingText.split(',')[0]}, <em>{greetingText.split(', ')[1] ?? 'Registrar'}</em>
          </>
        }
        subtitle={`${formatDateShort(today)} · Here is what needs attention across the student records desk today.`}
        actions={
          <>
            <button className="btn btn--secondary" onClick={onSearch}>
              <Search size={14} />
              Find a student
            </button>
            {!live &&
              ((role === 'Registrar' || role === 'Administrator') ? (
                <button className="btn btn--primary" onClick={() => onNavigate('registration')}>
                  <FilePlus2 size={14} />
                  New registration
                </button>
              ) : (
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    const student = students.find((item) => item.balance > 0) ?? students[0]
                    if (student) onPayment(student)
                  }}
                >
                  <CreditCard size={14} />
                  Record payment
                </button>
              ))}
          </>
        }
      />

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Enrolled this term</span>
            <span className="kpi__icon">
              <UsersRound size={15} />
            </span>
          </div>
          <div className="kpi__value">
            {live && liveStats ? liveStats.enrolled.toLocaleString() : '1,331'}
          </div>
          <div className="kpi__meta">
            <span className="kpi__trend">
              <TrendingUp size={11} /> {live ? 'Live' : '4.2%'}
            </span>
            <span>{live ? 'from srgb.semstudent' : 'vs. same period last term'}</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Not yet enrolled</span>
            <span className="kpi__icon kpi__icon--gold">
              <UserMinus size={15} />
            </span>
          </div>
          <div className="kpi__value">
            {live && liveStats ? liveStats.unregistered.toLocaleString() : '47'}
          </div>
          <div className="kpi__meta">
            <span className="kpi__trend kpi__trend--warn">{live ? 'Live' : '12 cleared'}</span>
            <span>{live ? 'not registered for the term' : 'since Monday'}</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">{live ? 'Collected this term' : 'Collected today'}</span>
            <span className="kpi__icon kpi__icon--green">
              <Banknote size={15} />
            </span>
          </div>
          <div className="kpi__value">
            {formatCompactMoney(live && liveStats ? liveStats.collected : todayTotal || 84120)}
          </div>
          <div className="kpi__meta">
            <span className="kpi__trend">
              {live && liveStats ? liveStats.students.toLocaleString() : todayPayments.length || 9}{' '}
              {live ? 'students' : 'receipts'}
            </span>
            <span>{live ? 'in the read-only sample' : 'posted at the cashier'}</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Grade sheets open</span>
            <span className="kpi__icon kpi__icon--blue">
              <ClipboardCheck size={15} />
            </span>
          </div>
          <div className="kpi__value">{live ? '—' : '23'}</div>
          <div className="kpi__meta">
            <span className="kpi__trend kpi__trend--warn">{live ? 'Controlled write' : '5 due today'}</span>
            <span>{live ? 'grade entry is confirmation-gated' : 'before the Registrar locks grades'}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stack">
          <section className="card pulse-card" aria-labelledby="pulse-heading">
            <div className="card__head">
              <div>
                <h3 id="pulse-heading">Enrollment pulse</h3>
                <p>Students processed each day this week</p>
              </div>
              <div className="pulse-legend" aria-hidden="true">
                <span>
                  <i /> Enrolled
                </span>
                <span>
                  <i /> Assessed
                </span>
              </div>
            </div>
            <div className="card__body">
              <div className="chart" role="img" aria-label="Enrollment and assessment counts for the past seven days">
                {chart.map((day) => (
                  <div className="chart__col" key={day.label}>
                    <div className="chart__stack">
                      <div className="chart__bar" style={{ height: `${(day.enrolled / 110) * 100}%` }} />
                      <div className="chart__bar chart__bar--muted" style={{ height: `${(day.assessed / 110) * 100}%` }} />
                    </div>
                    <span className="chart__label">{day.label}</span>
                  </div>
                ))}
              </div>
              <p className="chart__note">
                <CheckCircle2 size={13} color="#2e6b50" />
                {live ? (
                  <>Live student records are read-only · the weekly chart remains demo data.</>
                ) : (
                  <>
                    <strong>51 students</strong> processed today · 44 have a saved assessment
                  </>
                )}
              </p>
            </div>
          </section>

          <section className="card card--flush">
            <div className="card__head" style={{ paddingBottom: 14 }}>
              <div>
                <h3>Students needing attention</h3>
                <p>Outstanding balances and unregistered accounts</p>
              </div>
              <button className="section-heading__link" onClick={() => onNavigate('students')}>
                View all students
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col">Program</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="num">
                      Balance
                    </th>
                    <th scope="col" aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {withBalance.map((student) => (
                    <tr
                      key={student.id}
                      data-clickable="true"
                      tabIndex={0}
                      onClick={() => openStudent(student)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') openStudent(student)
                      }}
                    >
                      <td>
                        <div className="cell-person">
                          <span className="avatar avatar--xs">{student.firstName[0]}{student.lastName[0]}</span>
                          <div className="cell-person__copy">
                            <div className="cell-person__name">{fullName(student)}</div>
                            <div className="cell-person__meta">{student.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="strong">{student.program}</div>
                        <div className="muted-cell">{student.year}</div>
                      </td>
                      <td>
                        <Badge>{student.status}</Badge>
                      </td>
                      <td className="num">
                        <span className="color-money color-money--due">{formatMoney(student.balance)}</span>
                      </td>
                      <td className="row-actions">
                        <button
                          className="icon-button"
                          onClick={(event) => {
                            event.stopPropagation()
                            openStudent(student)
                          }}
                          aria-label={`Open ${fullName(student)}`}
                        >
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card__footer">
              <span className="muted" style={{ fontSize: 10 }}>
                {unregistered.length} unregistered · 1,284 enrolled
              </span>
              <button className="section-heading__link" onClick={() => onNavigate('reports')}>
                Open balance report
              </button>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card" aria-labelledby="quick-heading">
            <div className="card__head">
              <div>
                <h3 id="quick-heading">Quick actions</h3>
                <p>The four things the desk does most</p>
              </div>
            </div>
            <div className="card__body">
              <div className="quick-grid">
                <button className="quick-action" onClick={onSearch}>
                  <span className="quick-action__icon">
                    <Search size={15} />
                  </span>
                  <span className="quick-action__label">Find a student</span>
                  <span className="quick-action__hint">Name, ID, or program</span>
                </button>
                {!live && (
                  <button
                    className="quick-action"
                    onClick={() => {
                      const student = students.find((item) => item.balance > 0) ?? students[0]
                      if (student) onPayment(student)
                    }}
                  >
                    <span className="quick-action__icon">
                      <CreditCard size={15} />
                    </span>
                    <span className="quick-action__label">Record a payment</span>
                    <span className="quick-action__hint">Post an official receipt</span>
                  </button>
                )}
                {!live && (
                  <button className="quick-action" onClick={() => onNavigate('registration')}>
                    <span className="quick-action__icon">
                      <FilePlus2 size={15} />
                    </span>
                    <span className="quick-action__label">Create a COR</span>
                    <span className="quick-action__hint">Enroll and assess</span>
                  </button>
                )}
                <button className="quick-action" onClick={() => onNavigate('reports')}>
                  <span className="quick-action__icon">
                    <FileText size={15} />
                  </span>
                  <span className="quick-action__label">Generate report</span>
                  <span className="quick-action__hint">Official lists and forms</span>
                </button>
              </div>
            </div>
          </section>

          {!live && (
          <section className="card" aria-labelledby="tasks-heading">
            <div className="card__head">
              <div>
                <h3 id="tasks-heading">Today’s checklist</h3>
                <p>Small tasks that keep records clean</p>
              </div>
              <span className="badge badge--pending">4 open</span>
            </div>
            <div className="card__body">
              <div className="task-list">
                <button className="task" onClick={() => onNavigate('reports')}>
                  <span className="task__check">
                    <CheckCircle2 size={13} />
                  </span>
                  <span className="task__copy">
                    <span className="task__title">Review grade sheets with blank grades</span>
                    <span className="task__meta">CS 201 · IT 201 · NUR 201</span>
                  </span>
                  <span className="task__count">23</span>
                </button>
                <button className="task" onClick={() => onNavigate('cashier')}>
                  <span className="task__check">
                    <CheckCircle2 size={13} />
                  </span>
                  <span className="task__copy">
                    <span className="task__title">Reconcile yesterday’s collection</span>
                    <span className="task__meta">Cashier · A. Ramirez</span>
                  </span>
                  <span className="task__count task__count--gold">1</span>
                </button>
                <button className="task" onClick={() => onNavigate('students')}>
                  <span className="task__check">
                    <CheckCircle2 size={13} />
                  </span>
                  <span className="task__copy">
                    <span className="task__title">Follow up on unregistered students</span>
                    <span className="task__meta">Before the add/drop period closes</span>
                  </span>
                  <span className="task__count task__count--green">47</span>
                </button>
                <button
                  className="task"
                  onClick={() => onToast('All caught up', 'The remaining tasks will appear here as records change.')}
                >
                  <span className="task__check">
                    <CheckCircle2 size={13} />
                  </span>
                  <span className="task__copy">
                    <span className="task__title">Send the daily enrollment summary</span>
                    <span className="task__meta">Registrar · Dean’s office</span>
                  </span>
                  <span className="task__count task__count--gold">Scheduled</span>
                </button>
              </div>
            </div>
          </section>
          )}

          {!live && (
          <section className="card" aria-labelledby="activity-heading">
            <div className="card__head">
              <div>
                <h3 id="activity-heading">Recent activity</h3>
                <p>Across registration and cashiering</p>
              </div>
              <CalendarDays size={15} color="#9a8e80" />
            </div>
            <div className="card__body" style={{ paddingTop: 8 }}>
              <div className="activity-list">
                {activities.slice(0, 5).map((activity) => (
                  <div className="activity" key={activity.id}>
                    <span className={`activity__dot activity__dot--${activity.tone}`} />
                    <div className="activity__copy">
                      <div className="activity__title">{activity.title}</div>
                      <div className="activity__detail">{activity.detail}</div>
                    </div>
                    <span className="activity__time">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card__footer">
              <span className="muted" style={{ fontSize: 10 }}>
                <AlertCircle size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                Demo records · no database writes
              </span>
              <button className="section-heading__link" onClick={() => onNavigate('reports')}>
                View audit log
              </button>
            </div>
          </section>
          )}
        </div>
      </div>

      {todayPayments.length > 0 && (
        <section className="card mt-4" aria-labelledby="collections-heading">
          <div className="card__head" style={{ paddingBottom: 14 }}>
            <div>
              <h3 id="collections-heading">Today’s collections</h3>
              <p>Latest receipts posted at the cashier</p>
            </div>
            <span className="result-count">
              <strong>{formatMoney(todayTotal)}</strong> · {todayPayments.length} receipts
            </span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">OR number</th>
                  <th scope="col">Student</th>
                  <th scope="col">Paycode</th>
                  <th scope="col">Cashier</th>
                  <th scope="col" className="num">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {todayPayments.slice(0, 4).map((payment) => (
                  <tr key={payment.id}>
                    <td className="strong tabular">{payment.orno}</td>
                    <td>{payment.studentName}</td>
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
        </section>
      )}
    </div>
  )
}
