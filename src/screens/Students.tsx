import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, CreditCard, Download, Plus, Search, SlidersHorizontal, UserRound, UsersRound } from 'lucide-react'
import type { Student, StudentStatus } from '../types'
import { formatMoney, fullName } from '../lib/format'
import { Badge, EmptyState } from '../components/ui'
import { PageHeader } from '../components/AppShell'
import { StudentDialog } from '../components/StudentDialog'

const statusFilters: Array<'All' | StudentStatus> = ['All', 'Enrolled', 'Unregistered', 'Graduating', 'On leave']
const PAGE_SIZE = 50

export default function Students({
  students,
  readOnly = false,
  onOpenStudent,
  onPayment,
  onAddStudent,
  onToast,
}: {
  students: Student[]
  readOnly?: boolean
  onOpenStudent: (id: string) => void
  onPayment: (student: Student) => void
  onAddStudent: (student: Student) => void
  onToast: (title: string, detail?: string) => void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<(typeof statusFilters)[number]>('All')
  const [program, setProgram] = useState('All programs')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)

  const programs = useMemo(
    () => ['All programs', ...Array.from(new Set(students.map((student) => student.program))).sort()],
    [students],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((student) => {
      const matchesQuery =
        !q ||
        `${fullName(student)} ${student.id} ${student.programName} ${student.program} ${student.status}`
          .toLowerCase()
          .includes(q)
      const matchesStatus = status === 'All' || student.status === status
      const matchesProgram = program === 'All programs' || student.program === program
      return matchesQuery && matchesStatus && matchesProgram
    })
  }, [students, query, status, program])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [query, status, program])

  const totals = useMemo(() => {
    const enrolled = students.filter((student) => student.status === 'Enrolled' || student.status === 'Graduating').length
    const balance = students.reduce((sum, student) => sum + student.balance, 0)
    const unregistered = students.filter((student) => student.status === 'Unregistered').length
    return { enrolled, balance, unregistered }
  }, [students])

  function exportCsv(rows: Student[]) {
    const header = [
      'Student ID',
      'Last name',
      'First name',
      'Middle name',
      'Program',
      'Program name',
      'College',
      'Year level',
      'Status',
      'Scholarship',
      'Units',
      'GPA',
      'Assessment',
      'Paid',
      'Balance',
    ]
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
    const lines = rows.map((student) =>
      [
        student.id,
        student.lastName,
        student.firstName,
        student.middleName,
        student.program,
        student.programName,
        student.college,
        student.year,
        student.status,
        student.scholarship,
        student.units,
        student.gpa,
        student.assessmentTotal,
        student.amountPaid,
        student.balance,
      ]
        .map(escape)
        .join(','),
    )
    const blob = new Blob([[header.map(escape).join(','), ...lines].join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `serms-students-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    onToast('Student list exported', `${rows.length} records written to CSV.`)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Student records"
        title="Students"
        subtitle={
          readOnly
            ? 'Live student records from the school server. Search and inspect; this preview is read-only.'
            : 'Search the master list, open a student record, or jump straight to an assessment or payment.'
        }
        actions={
          <>
            <button className="btn btn--secondary" onClick={() => exportCsv(filtered)}>
              <Download size={14} />
              Export list
            </button>
            {!readOnly && (
              <button className="btn btn--primary" onClick={() => setAddOpen(true)}>
                <Plus size={14} />
                Add student
              </button>
            )}
            {readOnly && <span className="badge badge--info">Live · school data</span>}
          </>
        }
      />

      <div className="card mb-4" style={{ padding: '14px 16px' }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div className="search-field">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or student ID…"
              aria-label="Search students"
            />
          </div>
          <div className="select-field">
            <select value={program} onChange={(event) => setProgram(event.target.value)} aria-label="Filter by program">
              {programs.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown size={13} />
          </div>
          <div className="filter-chips" role="group" aria-label="Filter by status">
            {statusFilters.map((item) => (
              <button
                key={item}
                className="filter-chip"
                aria-pressed={status === item}
                onClick={() => setStatus(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="toolbar__spacer" />
          <span className="result-count">
            <strong>{filtered.length}</strong> of {students.length} records
          </span>
          <button className="icon-button icon-button--bordered" title="More filters" aria-label="More filters">
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="kpi" style={{ padding: '14px 16px' }}>
          <div className="kpi__top">
            <span className="kpi__label">Active records</span>
            <span className="kpi__icon">
              <UsersRound size={14} />
            </span>
          </div>
          <div className="kpi__value" style={{ fontSize: 26 }}>{totals.enrolled}</div>
          <div className="kpi__meta">{readOnly ? 'Live records for the active term' : 'Enrolled and graduating in this sample'}</div>
        </div>
        <div className="kpi" style={{ padding: '14px 16px' }}>
          <div className="kpi__top">
            <span className="kpi__label">Outstanding balance</span>
            <span className="kpi__icon kpi__icon--gold">
              <CreditCard size={14} />
            </span>
          </div>
          <div className="kpi__value" style={{ fontSize: 26 }}>{formatMoney(totals.balance)}</div>
          <div className="kpi__meta">
            Across {students.filter((student) => student.balance > 0).length} student accounts
            {readOnly ? ' in the live set' : ''}
          </div>
        </div>
        <div className="kpi" style={{ padding: '14px 16px' }}>
          <div className="kpi__top">
            <span className="kpi__label">Needs follow-up</span>
            <span className="kpi__icon kpi__icon--green">
              <UserRound size={14} />
            </span>
          </div>
          <div className="kpi__value" style={{ fontSize: 26 }}>{totals.unregistered}</div>
          <div className="kpi__meta">{readOnly ? 'Unregistered in the live set' : 'Unregistered students in this sample'}</div>
        </div>
      </div>

      <div className="card card--flush">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={18} />}
            title="No students match"
            description="Try a different name, student ID, program, or status filter."
            action={
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => {
                  setQuery('')
                  setStatus('All')
                  setProgram('All programs')
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Student master list</caption>
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Program / year</th>
                  <th scope="col">Scholarship</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">
                    Balance
                  </th>
                  <th scope="col" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((student) => (
                  <tr
                    key={student.id}
                    data-clickable="true"
                    onClick={() => onOpenStudent(student.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') onOpenStudent(student.id)
                    }}
                    tabIndex={0}
                  >
                    <td>
                      <div className="cell-person">
                        <span className="avatar avatar--sm">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </span>
                        <div className="cell-person__copy">
                          <div className="cell-person__name">{fullName(student)}</div>
                          <div className="cell-person__meta">
                            {student.id} · {student.gender === 'F' ? 'Female' : 'Male'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="strong">{student.programName}</div>
                      <div className="muted-cell">{student.year} · {student.college.replace('College of ', '')}</div>
                    </td>
                    <td>
                      {student.scholarship === 'None' ? (
                        <span className="muted-cell">—</span>
                      ) : (
                        <Badge tone="Info" noDot>
                          {student.scholarship}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <Badge>{student.status}</Badge>
                    </td>
                    <td className="num">
                      <span className={student.balance > 0 ? 'color-money color-money--due' : 'color-money color-money--clear'}>
                        {student.balance > 0 ? formatMoney(student.balance) : 'Cleared'}
                      </span>
                    </td>
                    <td className="row-actions">
                      {!readOnly && (
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            onPayment(student)
                          }}
                          title="Record a payment"
                        >
                          <CreditCard size={12} />
                          Pay
                        </button>
                      )}
                      <button
                        className="icon-button"
                        aria-label={`Open ${fullName(student)}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onOpenStudent(student.id)
                        }}
                      >
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="card__footer">
            <span className="muted" style={{ fontSize: 10 }}>
              {filtered.length === 0
                ? 'No matching records'
                : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} matching records`}
              {readOnly ? ' · live · read-only' : ''}
            </span>
            <div className="pagination">
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={safePage <= 1}
              >
                Previous
              </button>
              <span className="pagination__status">
                Page {safePage} of {pageCount}
              </span>
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                disabled={safePage >= pageCount}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {addOpen && (
        <StudentDialog
          open
          nextId={2000 + students.length}
          onClose={() => setAddOpen(false)}
          onSave={(student) => {
            onAddStudent(student)
            setAddOpen(false)
            onToast('Student created', `${fullName(student)} · ${student.programName} · ${student.id}`)
          }}
        />
      )}
    </div>
  )
}
