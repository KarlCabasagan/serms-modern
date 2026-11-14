import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpenCheck, CalendarDays, ChevronRight, Loader2, MapPin, UsersRound } from 'lucide-react'
import type { FacultyProfile, FacultyStudent, Term } from '../types'
import { Avatar, Badge, EmptyState, InfoStrip } from '../components/ui'
import { PageHeader } from '../components/AppShell'

export default function FacultyClasses({
  faculty,
  live,
  term,
  onOpenStudent,
  onToast,
}: {
  faculty: FacultyProfile | null
  live: boolean
  term: Term
  onOpenStudent: (id: string) => void
  onToast: (title: string, detail?: string) => void
}) {
  const [selectedKey, setSelectedKey] = useState('')
  const [rosters, setRosters] = useState<Record<string, FacultyStudent[]>>({})
  const [loadingRoster, setLoadingRoster] = useState(false)
  const toastRef = useRef(onToast)
  toastRef.current = onToast

  const classes = faculty?.classes ?? []
  const selected = useMemo(
    () => classes.find((item) => `${item.code}|${item.section}` === selectedKey) ?? classes[0] ?? null,
    [classes, selectedKey],
  )

  const totals = useMemo(() => {
    let units = 0
    let students = 0
    for (const item of classes) {
      units += item.units
      students += item.enrolled
    }
    return { classes: classes.length, students, units }
  }, [classes])

  useEffect(() => {
    if (!live || !selected || !window.serms) return
    const key = `${selected.code}|${selected.section}`
    if (rosters[key] || selected.students.length > 0) return
    let cancelled = false
    setLoadingRoster(true)
    window.serms.live
      .facultyRoster({ code: selected.code, section: selected.section })
      .then((result) => {
        if (cancelled) return
        if (result.ok) {
          setRosters((current) => ({ ...current, [key]: result.students }))
        } else {
          toastRef.current('Roster not loaded', result.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRoster(false)
      })
    return () => {
      cancelled = true
    }
  }, [live, selected, rosters])

  const roster =
    (selected && rosters[`${selected.code}|${selected.section}`]) ?? selected?.students ?? []

  if (!faculty) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Faculty workspace"
          title="My Classes"
          subtitle="Your assigned subjects and the students enrolled in each section."
          actions={live ? <span className="badge badge--info">Live · school data</span> : undefined}
        />
        <EmptyState
          icon={<BookOpenCheck size={20} />}
          title={live ? 'No faculty load is linked to this account' : 'Live faculty load is not available in the demo'}
          description={
            live
              ? 'This database account has no row in srgb.faculty_username, or no subjects assigned for the active term.'
              : 'Sign in with a faculty school account to see your assigned subjects and class rosters.'
          }
          action={
            <button className="btn btn--secondary" onClick={() => onToast('Faculty load', 'Ask the registrar to link your faculty account to the active term.')}>
              How is this linked?
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Faculty workspace"
        title="My Classes"
        subtitle={`${faculty.name} · ${faculty.department || 'Faculty'} · ${term.label}`}
        actions={
          live ? (
            <span className="badge badge--info">Live · school data</span>
          ) : (
            <span className="badge badge--neutral">Sample faculty load</span>
          )
        }
      />

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="kpi" style={{ padding: '14px 16px' }}>
          <div className="kpi__top">
            <span className="kpi__label">Assigned subjects</span>
            <span className="kpi__icon"><BookOpenCheck size={14} /></span>
          </div>
          <div className="kpi__value" style={{ fontSize: 26 }}>{totals.classes}</div>
          <div className="kpi__meta">Sections for {term.semester}</div>
        </div>
        <div className="kpi" style={{ padding: '14px 16px' }}>
          <div className="kpi__top">
            <span className="kpi__label">Students</span>
            <span className="kpi__icon kpi__icon--green"><UsersRound size={14} /></span>
          </div>
          <div className="kpi__value" style={{ fontSize: 26 }}>{totals.students}</div>
          <div className="kpi__meta">Across your sections</div>
        </div>
        <div className="kpi" style={{ padding: '14px 16px' }}>
          <div className="kpi__top">
            <span className="kpi__label">Teaching units</span>
            <span className="kpi__icon kpi__icon--gold"><CalendarDays size={14} /></span>
          </div>
          <div className="kpi__value" style={{ fontSize: 26 }}>{totals.units}</div>
          <div className="kpi__meta">Total subject units</div>
        </div>
      </div>

      <div className="faculty-grid">
        <section className="card">
          <div className="card__head">
            <div>
              <h3>Your sections</h3>
              <p>Choose a subject to view its roster</p>
            </div>
            <Badge>{classes.length} classes</Badge>
          </div>
          <div className="card__body faculty-class-list">
            {classes.map((item) => {
              const key = `${item.code}|${item.section}`
              const active = selected ? key === `${selected.code}|${selected.section}` : false
              return (
                <button
                  key={key}
                  className={`faculty-class ${active ? 'faculty-class--active' : ''}`}
                  onClick={() => setSelectedKey(key)}
                  aria-pressed={active}
                >
                  <span className="faculty-class__top">
                    <span className="faculty-class__code">{item.code}</span>
                    <ChevronRight size={15} />
                  </span>
                  <span className="faculty-class__title">{item.title}</span>
                  <span className="faculty-class__meta">
                    Section {item.section} · {item.enrolled}/{item.capacity || '—'} students
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="card card--flush">
          {selected ? (
            <>
              <div className="card__head">
                <div>
                  <h3>{selected.code}</h3>
                  <p>{selected.title} · Section {selected.section}</p>
                </div>
                <div className="faculty-class__facts">
                  <span><UsersRound size={13} /> {selected.enrolled} enrolled</span>
                  {selected.schedule && <span><CalendarDays size={13} /> {selected.schedule}</span>}
                  {selected.room && <span><MapPin size={13} /> {selected.room}</span>}
                </div>
              </div>
              {loadingRoster ? (
                <EmptyState
                  icon={<Loader2 size={18} className="spin" />}
                  title="Loading class roster"
                  description="Reading the enrolled students for this section."
                />
              ) : roster.length === 0 ? (
                <EmptyState
                  icon={<UsersRound size={18} />}
                  title="No students enrolled"
                  description="This section has no registration rows for the active term."
                />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <caption className="sr-only">Students enrolled in {selected.code}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Student</th>
                        <th scope="col">Program / year</th>
                        <th scope="col" className="center">Prelim</th>
                        <th scope="col" className="center">Midterm</th>
                        <th scope="col" className="center">Final</th>
                        <th scope="col" className="center">Grade</th>
                        <th scope="col" aria-label="Open" />
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((student) => (
                        <tr
                          key={student.id}
                          data-clickable="true"
                          tabIndex={0}
                          onClick={() => onOpenStudent(student.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') onOpenStudent(student.id)
                          }}
                        >
                          <td>
                            <div className="cell-person">
                              <Avatar name={student.name} size="sm" />
                              <div className="cell-person__copy">
                                <div className="cell-person__name">{student.name}</div>
                                <div className="cell-person__meta">{student.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="strong">{student.program || '—'}</div>
                            <div className="muted-cell">{student.year}</div>
                          </td>
                          <td className="center tabular">{student.prelim || '—'}</td>
                          <td className="center tabular">{student.midterm || '—'}</td>
                          <td className="center tabular">{student.final || '—'}</td>
                          <td className="center">
                            {student.grade ? <Badge tone="Info">{student.grade}</Badge> : <span className="muted-cell">—</span>}
                          </td>
                          <td className="row-actions">
                            <ChevronRight size={14} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="card__footer">
                <span className="muted" style={{ fontSize: 10 }}>
                  {selected.enrolled} enrolled · {selected.units} units
                </span>
                <span className="muted" style={{ fontSize: 10 }}>
                  Click a student to open the record
                </span>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<BookOpenCheck size={18} />}
              title="Select a subject"
              description="Choose one of your assigned sections to see its students."
            />
          )}
        </section>
      </div>

      {live && (
        <div className="mt-3">
          <InfoStrip>
            Class assignments are read from <strong>srgb.semsubject</strong>, and rosters from{' '}
            <strong>srgb.registration</strong>. The list is read-only.
          </InfoStrip>
        </div>
      )}
    </div>
  )
}

