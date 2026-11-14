import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  Loader2,
  MapPin,
  Pencil,
  Search,
  UsersRound,
} from 'lucide-react'
import type { FacultyProfile, FacultyStudent, Term } from '../types'
import { Avatar, Badge, EmptyState, InfoStrip } from '../components/ui'
import { PageHeader } from '../components/AppShell'
import { facultyDisplayName, titleCaseDepartment } from '../lib/format'

const gradeTerms = [
  { key: 'prelim', label: 'Prelim' },
  { key: 'midterm', label: 'Midterm' },
  { key: 'prefinal', label: 'Semi-final' },
  { key: 'final', label: 'Final' },
] as const

type GradeField = (typeof gradeTerms)[number]['key']

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
  const [rosterQuery, setRosterQuery] = useState('')
  const [rosters, setRosters] = useState<Record<string, FacultyStudent[]>>({})
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const toastRef = useRef(onToast)
  toastRef.current = onToast
  const dirtyRef = useRef(new Set<string>())
  const savingRef = useRef(new Set<string>())
  const inputRefs = useRef(new Map<string, HTMLInputElement>())

  const classes = faculty?.classes ?? []
  const selected = useMemo(
    () => classes.find((item) => `${item.code}|${item.section}` === selectedKey) ?? classes[0] ?? null,
    [classes, selectedKey],
  )
  const rosterKey = selected ? `${selected.code}|${selected.section}` : ''

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

  const roster = (selected && rosters[rosterKey]) ?? selected?.students ?? []
  const q = rosterQuery.trim().toLowerCase()
  const visibleRoster = q
    ? roster.filter((student) =>
        `${student.name} ${student.id} ${student.program}`.toLowerCase().includes(q),
      )
    : roster

  function chooseClass(key: string) {
    setSelectedKey(key)
    setRosterQuery('')
    setEditMode(false)
  }

  function updateGrade(studentId: string, field: GradeField, value: string) {
    setRosters((current) => {
      const list = current[rosterKey] ?? roster
      return {
        ...current,
        [rosterKey]: list.map((student) =>
          student.id === studentId ? { ...student, [field]: value } : student,
        ),
      }
    })
    dirtyRef.current.add(studentId)
    setSaved((current) => ({ ...current, [studentId]: false }))
  }

  async function saveStudent(studentId: string) {
    if (!dirtyRef.current.has(studentId) || savingRef.current.has(studentId)) return
    const student = roster.find((item) => item.id === studentId)
    if (!student) return

    if (!live || !window.serms) {
      dirtyRef.current.delete(studentId)
      setSaved((current) => ({ ...current, [studentId]: true }))
      return
    }

    savingRef.current.add(studentId)
    setSaving((current) => ({ ...current, [studentId]: true }))
    const result = await window.serms.live.facultyGrade({
      studid: student.id,
      subjcode: selected?.code ?? '',
      section: selected?.section ?? '',
      prelim1: student.prelim ?? '',
      prelim2: student.midterm ?? '',
      prelim3: student.prefinal ?? '',
      prelim4: student.final ?? '',
    })
    savingRef.current.delete(studentId)
    setSaving((current) => ({ ...current, [studentId]: false }))

    if (result.ok) {
      dirtyRef.current.delete(studentId)
      setRosters((current) => ({
        ...current,
        [rosterKey]: (current[rosterKey] ?? roster).map((item) =>
          item.id === studentId ? { ...item, ...result.student } : item,
        ),
      }))
      setSaved((current) => ({ ...current, [studentId]: true }))
    } else {
      toastRef.current('Grade not saved', result.message)
    }
  }

  function handleGradeKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: GradeField,
  ) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    event.stopPropagation()
    const student = visibleRoster[index]
    if (student) void saveStudent(student.id)
    const next = visibleRoster[index + 1]
    if (!next) return
    requestAnimationFrame(() => {
      const input = inputRefs.current.get(`${next.id}|${field}`)
      input?.focus()
      input?.select()
    })
  }

  function exportRoster() {
    if (!selected || roster.length === 0) return
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
    const header = [
      'Student ID',
      'Name',
      'Program',
      'Year',
      'Prelim',
      'Midterm',
      'Semi-final',
      'Final',
      'Grade',
      'Remarks',
    ]
    const lines = roster.map((student) =>
      [
        student.id,
        student.name,
        student.program,
        student.year,
        student.prelim ?? '',
        student.midterm ?? '',
        student.prefinal ?? '',
        student.final ?? '',
        student.grade ?? '',
        student.remark ?? '',
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
    link.download = `${selected.code.replace(/\s+/g, '-')}-${selected.section.trim() || 'class'}-roster.csv`
    link.click()
    URL.revokeObjectURL(url)
    onToast('Class roster exported', `${roster.length} students written to CSV.`)
  }

  if (!faculty) {
    return (
      <div className="page">
        <PageHeader
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
            <button
              className="btn btn--secondary"
              onClick={() =>
                onToast('Faculty load', 'Ask the registrar to link your faculty account to the active term.')
              }
            >
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
        title="My Classes"
        subtitle={`${facultyDisplayName(faculty.name)} · ${titleCaseDepartment(faculty.department || 'Faculty')} · ${term.label}`}
        actions={
          live ? (
            <span className="badge badge--info">Live · school data</span>
          ) : (
            <span className="badge badge--neutral">Sample faculty load</span>
          )
        }
      />

      <div className="faculty-summary" aria-label="Teaching load summary">
        <div>
          <strong>{totals.classes}</strong>
          <span>sections</span>
        </div>
        <div>
          <strong>{totals.students}</strong>
          <span>enrolled students</span>
        </div>
        <div>
          <strong>{totals.units}</strong>
          <span>teaching units</span>
        </div>
        <div className="faculty-summary__term">
          <CalendarDays size={14} />
          {term.semester}
        </div>
      </div>

      <div className="faculty-grid">
        <section className="card">
          <div className="card__head">
            <div>
              <h3>Your sections</h3>
              <p>Choose a subject to view its roster</p>
            </div>
            <Badge>{classes.length} {classes.length === 1 ? 'class' : 'classes'}</Badge>
          </div>
          <div className="card__body faculty-class-list">
            {classes.map((item) => {
              const key = `${item.code}|${item.section}`
              const active = selected ? key === rosterKey : false
              return (
                <button
                  key={key}
                  className={`faculty-class ${active ? 'faculty-class--active' : ''}`}
                  onClick={() => chooseClass(key)}
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
              <div className="card__head faculty-roster-head">
                <div>
                  <h3>{selected.code}</h3>
                  <p>{selected.title} · Section {selected.section}</p>
                </div>
                <div className="faculty-head-actions">
                  <div className="faculty-class__facts">
                    <span><UsersRound size={13} /> {selected.enrolled} enrolled</span>
                    {selected.schedule && <span><CalendarDays size={13} /> {selected.schedule}</span>}
                    {selected.room && <span><MapPin size={13} /> {selected.room}</span>}
                  </div>
                  <button
                    className={`btn btn--sm ${editMode ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setEditMode((current) => !current)}
                    disabled={roster.length === 0 || loadingRoster}
                  >
                    {editMode ? <Check size={13} /> : <Pencil size={13} />}
                    {editMode ? 'Done editing' : 'Edit grades'}
                  </button>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={exportRoster}
                    disabled={roster.length === 0}
                  >
                    <Download size={13} />
                    Export
                  </button>
                </div>
              </div>

              {roster.length > 0 && (
                <div className="faculty-roster-toolbar">
                  <div className="search-field">
                    <Search size={14} />
                    <input
                      value={rosterQuery}
                      onChange={(event) => setRosterQuery(event.target.value)}
                      placeholder="Search this class…"
                      aria-label="Search this class roster"
                    />
                  </div>
                  <span className="result-count">
                    <strong>{visibleRoster.length}</strong> of {roster.length}{' '}
                    {roster.length === 1 ? 'student' : 'students'}
                  </span>
                </div>
              )}

              {editMode && (
                <div className="faculty-edit-note">
                  <Pencil size={13} />
                  <span>
                    Editing live grades. Press <kbd>Enter</kbd> to save and move to the next student
                    in the same term. Leaving a field also saves it.
                  </span>
                </div>
              )}

              {loadingRoster ? (
                <EmptyState
                  icon={<Loader2 size={18} className="spin" />}
                  title="Loading class roster"
                  description="Reading the enrolled students for this section."
                />
              ) : visibleRoster.length === 0 ? (
                <EmptyState
                  icon={roster.length === 0 ? <UsersRound size={18} /> : <Search size={18} />}
                  title={roster.length === 0 ? 'No students enrolled' : 'No students match'}
                  description={
                    roster.length === 0
                      ? 'This section has no registration rows for the active term.'
                      : 'Try a different name or student ID.'
                  }
                />
              ) : (
                <div className="table-wrap faculty-table-wrap">
                  <table className="data-table faculty-roster-table">
                    <caption className="sr-only">Students enrolled in {selected.code}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Student</th>
                        <th scope="col">Program / year</th>
                        {gradeTerms.map((item) => (
                          <th scope="col" className="center" key={item.key}>
                            {item.label}
                          </th>
                        ))}
                        <th scope="col" className="center">Grade</th>
                        <th scope="col" aria-label="Open" />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRoster.map((student, index) => (
                        <tr
                          key={student.id}
                          className={dirtyRef.current.has(student.id) ? 'grade-row--dirty' : ''}
                          onClick={() => {
                            if (!editMode) onOpenStudent(student.id)
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
                          {gradeTerms.map((item) => (
                            <td className="center grade-cell" key={item.key}>
                              {editMode ? (
                                <input
                                  ref={(node) => {
                                    const key = `${student.id}|${item.key}`
                                    if (node) inputRefs.current.set(key, node)
                                    else inputRefs.current.delete(key)
                                  }}
                                  className="grade-input"
                                  value={student[item.key] ?? ''}
                                  inputMode="decimal"
                                  maxLength={5}
                                  disabled={saving[student.id]}
                                  aria-label={`${item.label} grade for ${student.name}`}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) =>
                                    updateGrade(
                                      student.id,
                                      item.key,
                                      event.target.value.replace(/[^0-9.]/g, '').slice(0, 5),
                                    )
                                  }
                                  onFocus={(event) => event.currentTarget.select()}
                                  onBlur={() => void saveStudent(student.id)}
                                  onKeyDown={(event) => handleGradeKeyDown(event, index, item.key)}
                                />
                              ) : (
                                <span className="tabular">{student[item.key] || '—'}</span>
                              )}
                            </td>
                          ))}
                          <td className="center">
                            <div className="grade-result">
                              {student.grade ? <Badge tone="Info">{student.grade}</Badge> : <span className="muted-cell">—</span>}
                              {saving[student.id] && <Loader2 size={12} className="spin" aria-label="Saving" />}
                              {!saving[student.id] && saved[student.id] && (
                                <span className="grade-saved">
                                  <Check size={11} /> Saved
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="row-actions">
                            <button
                              className="icon-button"
                              aria-label={`Open ${student.name}`}
                              onClick={(event) => {
                                event.stopPropagation()
                                onOpenStudent(student.id)
                              }}
                            >
                              <ChevronRight size={14} />
                            </button>
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
                  {editMode ? 'Enter saves and advances to the next student' : 'Click a student to open the record'}
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
            Class assignments are read from <strong>srgb.semsubject</strong>; rosters and grades are
            read from <strong>srgb.registration</strong>. Grade edits write directly to the school
            database and the trigger computes the final grade.
          </InfoStrip>
        </div>
      )}
    </div>
  )
}
