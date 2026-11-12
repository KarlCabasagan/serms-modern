import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  LockKeyhole,
  Printer,
  Search,
  UsersRound,
} from 'lucide-react'
import type { Enrollment, FacultyMember, Offering, Student } from '../types'
import { fullName } from '../lib/format'
import { Badge, EmptyState, InfoStrip } from '../components/ui'
import { PageHeader } from '../components/AppShell'
import { GradeSheetDialog } from '../components/GradeSheet'

type AcademicTab = 'sheets' | 'faculty' | 'deans'

export default function Academics({
  offerings,
  faculty,
  students,
  enrollments,
  onOpenStudent,
  onToast,
}: {
  offerings: Offering[]
  faculty: FacultyMember[]
  students: Student[]
  enrollments: Enrollment[]
  onOpenStudent: (id: string) => void
  onToast: (title: string, detail?: string) => void
}) {
  const [tab, setTab] = useState<AcademicTab>('sheets')
  const [query, setQuery] = useState('')
  const [openSheet, setOpenSheet] = useState<Offering | null>(null)
  const deanList = useMemo(
    () => students.filter((student) => student.gpa > 0 && student.gpa <= 1.75).sort((a, b) => a.gpa - b.gpa),
    [students],
  )
  const filteredFaculty = faculty.filter((member) => {
    const q = query.trim().toLowerCase()
    return !q || `${member.name} ${member.department}`.toLowerCase().includes(q)
  })
  const filteredSheets = offerings.filter((offering) => {
    const q = query.trim().toLowerCase()
    return !q || `${offering.code} ${offering.title} ${offering.instructor} ${offering.section}`.toLowerCase().includes(q)
  })

  return (
    <div className="page">
      <PageHeader
        eyebrow="Academic records"
        title="Academics"
        subtitle="Grade sheets, completion, faculty load, and the Dean’s List — in one academic workspace."
        actions={
          <>
            <button className="btn btn--secondary" onClick={() => onToast('Grade sheet report', 'The printable grade sheet opens in the reporting phase.')}>
              <Printer size={14} />
              Print all sheets
            </button>
            <button className="btn btn--primary" onClick={() => onToast('Grade locking', 'Period locks are applied by the Registrar on the live database.')}>
              <LockKeyhole size={14} />
              Lock grades
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Open grade sheets</span>
            <span className="kpi__icon kpi__icon--gold">
              <ClipboardCheck size={15} />
            </span>
          </div>
          <div className="kpi__value">23</div>
          <div className="kpi__meta">5 due before the lock date</div>
        </div>
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Submitted this week</span>
            <span className="kpi__icon kpi__icon--green">
              <CheckCircle2 size={15} />
            </span>
          </div>
          <div className="kpi__value">61</div>
          <div className="kpi__meta">Across 14 departments</div>
        </div>
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Faculty on load</span>
            <span className="kpi__icon">
              <UsersRound size={15} />
            </span>
          </div>
          <div className="kpi__value">128</div>
          <div className="kpi__meta">6 overloaded · 4 under review</div>
        </div>
        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Dean’s List</span>
            <span className="kpi__icon kpi__icon--blue">
              <Award size={15} />
            </span>
          </div>
          <div className="kpi__value">84</div>
          <div className="kpi__meta">Term GPA 1.75 or better</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="filter-chips" role="group" aria-label="Academic section">
          <button className="filter-chip" aria-pressed={tab === 'sheets'} onClick={() => setTab('sheets')}>
            Grade sheets
          </button>
          <button className="filter-chip" aria-pressed={tab === 'faculty'} onClick={() => setTab('faculty')}>
            Faculty load
          </button>
          <button className="filter-chip" aria-pressed={tab === 'deans'} onClick={() => setTab('deans')}>
            Dean’s List
          </button>
        </div>
        <div className="toolbar__spacer" />
        <div className="search-field">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tab === 'faculty' ? 'Find a faculty member…' : 'Find a subject or section…'}
            aria-label="Search academics"
          />
        </div>
      </div>

      {tab === 'sheets' && (
        <section className="card card--flush">
          <div className="card__head" style={{ paddingBottom: 14 }}>
            <div>
              <h3>Grade sheets</h3>
              <p>Subject sections assigned to faculty</p>
            </div>
            <span className="result-count">
              <strong>{filteredSheets.length}</strong> sections in view
            </span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Subject</th>
                  <th scope="col">Section</th>
                  <th scope="col">Faculty</th>
                  <th scope="col" className="num">Enrolled</th>
                  <th scope="col" className="num">Submitted</th>
                  <th scope="col">Status</th>
                  <th scope="col" aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {filteredSheets.map((offering, index) => {
                  const submitted = index % 3 === 0 ? offering.enrolled : index % 3 === 1 ? Math.round(offering.enrolled * 0.72) : 0
                  const complete = submitted >= offering.enrolled
                  return (
                    <tr key={`${offering.code}-${offering.section}`}>
                      <td>
                        <div className="strong">{offering.code} · {offering.title}</div>
                        <div className="muted-cell">{offering.schedule}</div>
                      </td>
                      <td>{offering.section}</td>
                      <td className="muted-cell">{offering.instructor}</td>
                      <td className="num tabular">{offering.enrolled}</td>
                      <td className="num tabular">{submitted}</td>
                      <td>
                        <Badge tone={complete ? 'complete' : submitted > 0 ? 'pending' : 'neutral'}>
                          {complete ? 'Complete' : submitted > 0 ? 'In progress' : 'Not started'}
                        </Badge>
                      </td>
                      <td className="row-actions">
                        <button className="btn btn--ghost btn--sm" onClick={() => setOpenSheet(offering)}>
                          Open
                          <ArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredSheets.length === 0 && (
            <EmptyState icon={<Search size={18} />} title="No sheets match" description="Try a different subject code, section, or faculty name." />
          )}
          <div className="card__footer">
            <span className="muted" style={{ fontSize: 10 }}>
              Grades are written to <strong>srgb.registration</strong> — direct to the school server.
            </span>
            <button className="section-heading__link" onClick={() => onToast('Lock policy', 'The active semester lock is enforced by the database trigger.')}>
              View lock policy
            </button>
          </div>
        </section>
      )}

      {tab === 'faculty' && (
        <section className="card card--flush">
          <div className="card__head" style={{ paddingBottom: 14 }}>
            <div>
              <h3>Teaching load</h3>
              <p>Current term assignments and load status</p>
            </div>
            <span className="result-count">
              <strong>{filteredFaculty.length}</strong> faculty in view
            </span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Faculty</th>
                  <th scope="col">Department</th>
                  <th scope="col" className="num">Subjects</th>
                  <th scope="col" className="num">Units</th>
                  <th scope="col">Status</th>
                  <th scope="col" aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {filteredFaculty.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="cell-person">
                        <span className="avatar avatar--sm">
                          {member.name.split(' ').slice(1, 2).map((part) => part[0]).join('')}
                          {member.name.split(' ').slice(-1)[0]?.[0]}
                        </span>
                        <div className="cell-person__copy">
                          <div className="cell-person__name">{member.name}</div>
                          <div className="cell-person__meta">{member.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted-cell">{member.department}</td>
                    <td className="num tabular">{member.subjects}</td>
                    <td className="num tabular">{member.load}</td>
                    <td>
                      <Badge>{member.status}</Badge>
                    </td>
                    <td className="row-actions">
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => onToast('Faculty load', `${member.name} · ${member.load} units across ${member.subjects} subjects.`)}
                      >
                        Open
                        <ArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card__footer">
            <span className="muted" style={{ fontSize: 10 }}>
              Load limits are advisory; the final assignment is approved by the Dean.
            </span>
            <button className="section-heading__link" onClick={() => onToast('Teaching load report', 'The printable summary is in the report library.')}>
              Print load summary
            </button>
          </div>
        </section>
      )}

      {tab === 'deans' && (
        <section className="card card--flush">
          <div className="card__head" style={{ paddingBottom: 14 }}>
            <div>
              <h3>Dean’s List</h3>
              <p>Students with a term GPA of 1.75 or better</p>
            </div>
            <span className="result-count">
              <strong>{deanList.length}</strong> in the sample
            </span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Program</th>
                  <th scope="col">Year</th>
                  <th scope="col" className="num">GPA</th>
                  <th scope="col" className="num">Units</th>
                  <th scope="col" aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {deanList.map((student) => (
                  <tr key={student.id} data-clickable="true" onClick={() => onOpenStudent(student.id)}>
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
                    <td className="muted-cell">{student.programName}</td>
                    <td>{student.year}</td>
                    <td className="num strong">{student.gpa.toFixed(2)}</td>
                    <td className="num tabular">{student.units}</td>
                    <td className="row-actions">
                      <button
                        className="icon-button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onOpenStudent(student.id)
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
          {deanList.length === 0 && (
            <EmptyState icon={<Award size={18} />} title="No qualifiers yet" description="Term GPAs are still being finalized." />
          )}
        </section>
      )}

      <div className="mt-4">
        <InfoStrip>
          Grade entry and the grade lock are the same database operations as the current SERMS:
          <strong> srgb.registration</strong> plus the semester and subject locks. The UI does not
          add a new upload service.
        </InfoStrip>
      </div>

      {openSheet && (
        <GradeSheetDialog
          offering={openSheet}
          students={students}
          enrollments={enrollments}
          onClose={() => setOpenSheet(null)}
          onSave={(offering, rows) => {
            onToast(
              'Grades saved to the sample sheet',
              `${offering.code} · Section ${offering.section} · ${rows.length} students. The live build writes to srgb.registration.`,
            )
          }}
        />
      )}
    </div>
  )
}
