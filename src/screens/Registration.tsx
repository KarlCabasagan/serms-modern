import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FilePlus2,
  Search,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import type { Offering, Student, Term } from '../types'
import { formatMoney, fullName } from '../lib/format'
import { Badge, EmptyState, InfoStrip } from '../components/ui'
import { PageHeader } from '../components/AppShell'

export default function Registration({
  students,
  offerings,
  term,
  onOpenStudent,
  onPayment,
  onToast,
}: {
  students: Student[]
  offerings: Offering[]
  term: Term
  onOpenStudent: (id: string) => void
  onPayment: (student: Student) => void
  onToast: (title: string, detail?: string) => void
}) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sectionQuery, setSectionQuery] = useState('')
  const [sectionProgram, setSectionProgram] = useState('All programs')

  const queue = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students
      .filter((student) => student.status === 'Unregistered' || student.balance > 0)
      .filter((student) => !q || `${fullName(student)} ${student.id} ${student.program}`.toLowerCase().includes(q))
      .slice(0, 6)
  }, [students, query])

  const selected = students.find((student) => student.id === selectedId) ?? null
  const filteredOfferings = useMemo(() => {
    const q = sectionQuery.trim().toLowerCase()
    return offerings.filter((offering) => {
      const matchesProgram = sectionProgram === 'All programs' || offering.program === sectionProgram || offering.program === 'All programs'
      const matchesQuery = !q || `${offering.code} ${offering.title} ${offering.instructor} ${offering.section}`.toLowerCase().includes(q)
      return matchesProgram && matchesQuery
    })
  }, [offerings, sectionQuery, sectionProgram])

  return (
    <div className="page">
      <PageHeader
        eyebrow={`Registration · ${term.label}`}
        title="Registration desk"
        subtitle="Build a COR, check an assessment, and keep the enrollment queue moving without leaving the desk."
        actions={
          <>
            <button className="btn btn--secondary" onClick={() => onToast('Block offerings', 'Block enrollment opens in the database phase.')}>
              <UsersRound size={14} />
              Block offerings
            </button>
            <button className="btn btn--primary" onClick={() => setSelectedId(queue[0]?.id ?? students[0]?.id ?? null)}>
              <FilePlus2 size={14} />
              Start a registration
            </button>
          </>
        }
      />

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="kpi" style={{ padding: '14px 16px' }}>
          <div className="kpi__top">
            <span className="kpi__label">Open sections</span>
            <span className="kpi__icon">
              <BookOpen size={14} />
            </span>
          </div>
          <div className="kpi__value" style={{ fontSize: 26 }}>86</div>
          <div className="kpi__meta">Across 12 programs · 3 colleges</div>
        </div>
        <div className="kpi" style={{ padding: '14px 16px' }}>
          <div className="kpi__top">
            <span className="kpi__label">Waiting for a COR</span>
            <span className="kpi__icon kpi__icon--gold">
              <Clock3 size={14} />
            </span>
          </div>
          <div className="kpi__value" style={{ fontSize: 26 }}>12</div>
          <div className="kpi__meta">Students in the sample queue</div>
        </div>
        <div className="kpi" style={{ padding: '14px 16px' }}>
          <div className="kpi__top">
            <span className="kpi__label">Assessed today</span>
            <span className="kpi__icon kpi__icon--green">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div className="kpi__value" style={{ fontSize: 26 }}>44</div>
          <div className="kpi__meta">Saved assessments · 3 awaiting review</div>
        </div>
      </div>

      <div className="detail-grid">
        <section className="card card--flush">
          <div className="card__head" style={{ paddingBottom: 14 }}>
            <div>
              <h3>Registration queue</h3>
              <p>Students who still need a COR or an assessment</p>
            </div>
            <span className="result-count">
              <strong>{queue.length}</strong> in view
            </span>
          </div>
          <div style={{ padding: '0 16px 12px' }}>
            <div className="search-field" style={{ maxWidth: 'none' }}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the queue by name or student ID…"
                aria-label="Search the registration queue"
              />
            </div>
          </div>
          <div className="table-wrap" style={{ borderTop: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Program</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">Balance</th>
                  <th scope="col" aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {queue.map((student) => (
                  <tr key={student.id} data-clickable="true" onClick={() => setSelectedId(student.id)}>
                    <td>
                      <div className="cell-person">
                        <span className="avatar avatar--sm">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </span>
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
                    <td className="num color-money color-money--due">{formatMoney(student.balance)}</td>
                    <td className="row-actions">
                      <ArrowRight size={14} color="#a39789" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {queue.length === 0 && (
            <EmptyState
              icon={<CheckCircle2 size={18} />}
              title="Queue is clear"
              description="Every student in this sample has a saved COR and assessment."
            />
          )}
          <div className="card__footer">
            <span className="muted" style={{ fontSize: 10 }}>
              Select a student to start the COR on the right.
            </span>
            <button className="section-heading__link" onClick={() => onToast('Registration log', 'The audit trail will be available from the database.')}>
              View registration log
            </button>
          </div>
        </section>

        <div className="stack">
          <section className="card">
            <div className="card__head">
              <div>
                <h3>Start a registration</h3>
                <p>One student at a time</p>
              </div>
              <UserPlus size={15} color="#a9822e" />
            </div>
            <div className="card__body">
              {selected ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                    <span className="avatar avatar--md">
                      {selected.firstName[0]}
                      {selected.lastName[0]}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 650 }}>{fullName(selected)}</div>
                      <div className="muted" style={{ fontSize: 10 }}>
                        {selected.id} · {selected.programName}
                      </div>
                    </div>
                    <button className="icon-button" onClick={() => setSelectedId(null)} aria-label="Clear selected student">
                      ×
                    </button>
                  </div>
                  <div className="detail-list">
                    <div className="detail-row">
                      <span className="detail-row__label">Year level</span>
                      <span className="detail-row__value">{selected.year}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Scholarship</span>
                      <span className="detail-row__value">{selected.scholarship}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Current units</span>
                      <span className="detail-row__value">{selected.units} units</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Balance</span>
                      <span className="detail-row__value">{formatMoney(selected.balance)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 7, marginTop: 14 }}>
                    <button className="btn btn--primary" onClick={() => onOpenStudent(selected.id)}>
                      <ClipboardList size={14} />
                      Open COR builder
                    </button>
                    <button className="btn btn--secondary" onClick={() => onPayment(selected)}>
                      <FilePlus2 size={14} />
                      Go to assessment
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="muted" style={{ fontSize: 11, lineHeight: 1.6 }}>
                    Pick a student from the queue or search the master list. The COR builder keeps
                    the student header in view while you add subjects.
                  </p>
                  <button className="btn btn--secondary mt-3" style={{ width: '100%' }} onClick={() => setSelectedId(queue[0]?.id ?? students[0].id)}>
                    <UserPlus size={14} />
                    Choose the next student
                  </button>
                </>
              )}
            </div>
          </section>
          <InfoStrip>
            Adding a subject writes to <strong>srgb.registration</strong> only after the database
            validates prerequisites, duplicates, and the active term lock.
          </InfoStrip>
        </div>
      </div>

      <section className="card mt-4 card--flush">
        <div className="card__head" style={{ paddingBottom: 14 }}>
          <div>
            <h3>Open sections</h3>
            <p>Subject offerings for the active term</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="search-field" style={{ minWidth: 190, maxWidth: 250 }}>
              <Search size={14} />
              <input
                value={sectionQuery}
                onChange={(event) => setSectionQuery(event.target.value)}
                placeholder="Find a section…"
                aria-label="Find a subject section"
                style={{ height: 34, fontSize: 11 }}
              />
            </div>
            <div className="select-field">
              <select
                value={sectionProgram}
                onChange={(event) => setSectionProgram(event.target.value)}
                aria-label="Filter sections by program"
                style={{ height: 34, fontSize: 10.5 }}
              >
                <option>All programs</option>
                <option>BSCS</option>
                <option>BSIT</option>
                <option>BSN</option>
                <option>BSA</option>
                <option>BSED</option>
                <option>BSCRIM</option>
                <option>BSBA</option>
                <option>BEED</option>
              </select>
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Subject</th>
                <th scope="col">Section</th>
                <th scope="col">Schedule</th>
                <th scope="col">Room</th>
                <th scope="col">Instructor</th>
                <th scope="col" className="num">Load</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOfferings.map((offering) => {
                const full = offering.enrolled >= offering.capacity
                return (
                  <tr key={`${offering.code}-${offering.section}`}>
                    <td className="strong nowrap">{offering.code}</td>
                    <td>{offering.title}</td>
                    <td>{offering.section}</td>
                    <td className="muted-cell nowrap">{offering.schedule}</td>
                    <td className="muted-cell">{offering.room}</td>
                    <td className="muted-cell">{offering.instructor}</td>
                    <td className="num">
                      <span className={full ? 'color-money color-money--due' : 'color-money'}>
                        {offering.enrolled}/{offering.capacity}
                      </span>
                    </td>
                    <td>
                      <Badge tone={full ? 'dropped' : offering.enrolled / offering.capacity > 0.85 ? 'pending' : 'enrolled'}>
                        {full ? 'Full' : offering.enrolled / offering.capacity > 0.85 ? 'Nearly full' : 'Open'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredOfferings.length === 0 && (
          <EmptyState
            icon={<CalendarDays size={18} />}
            title="No matching sections"
            description="Try a different subject code or program filter."
          />
        )}
        <div className="card__footer">
          <span className="muted" style={{ fontSize: 10 }}>
            {filteredOfferings.length} sections shown · capacity is checked on save
          </span>
          <button className="section-heading__link" onClick={() => onToast('Subject offering', 'The full offering editor is scheduled for the administration phase.')}>
            Manage offerings
          </button>
        </div>
      </section>
    </div>
  )
}
