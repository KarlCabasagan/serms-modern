import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Save } from 'lucide-react'
import type { Enrollment, Student, Term } from '../types'
import { fullName } from '../lib/format'
import { Modal } from './ui'

interface Row {
  studentId: string
  name: string
  subjcode: string
  section: string
  prelim1: string
  prelim2: string
  prelim3: string
  prelim4: string
  grade: string
  remarks: string
}

export function LiveClassGradeDialog({
  student,
  students,
  enrollments,
  term,
  onClose,
  onSave,
}: {
  student: Student
  students: Student[]
  enrollments: Enrollment[]
  term: Term
  onClose: () => void
  onSave: (rows: Array<{ studid: string; subjcode: string; prelim1: string; prelim2: string; prelim3: string; prelim4: string; remarks: string }>) => Promise<boolean>
}) {
  const subjectOptions = useMemo(() => {
    const seen = new Set<string>()
    return enrollments
      .filter((entry) => entry.studentId === student.id)
      .filter((entry) => {
        const key = `${entry.code}|${entry.section}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }, [enrollments, student.id])
  const [subjectKey, setSubjectKey] = useState(
    subjectOptions[0] ? `${subjectOptions[0].code}|${subjectOptions[0].section}` : '',
  )
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [code, section] = subjectKey.split('|')
  const roster = useMemo(
    () =>
      enrollments
        .filter((entry) => entry.code === code && entry.section === section)
        .map((entry) => {
          const match = students.find((item) => item.id === entry.studentId)
          if (!match) return null
          return {
            studentId: entry.studentId,
            name: fullName(match),
            subjcode: entry.code,
            section: entry.section,
            prelim1: entry.prelim ?? '',
            prelim2: entry.midterm ?? '',
            prelim3: entry.prefinal ?? '',
            prelim4: entry.final ?? '',
            grade: entry.grade ?? '',
            remarks: entry.remark ?? '',
          } satisfies Row
        })
        .filter((entry): entry is Row => Boolean(entry)),
    [code, enrollments, section, students],
  )
  const [rows, setRows] = useState<Row[]>(roster)

  function chooseSubject(key: string) {
    setSubjectKey(key)
    setConfirmed(false)
    setError('')
    const [nextCode, nextSection] = key.split('|')
    setRows(
      enrollments
        .filter((entry) => entry.code === nextCode && entry.section === nextSection)
        .map((entry) => {
          const match = students.find((item) => item.id === entry.studentId)
          if (!match) return null
          return {
            studentId: entry.studentId,
            name: fullName(match),
            subjcode: entry.code,
            section: entry.section,
            prelim1: entry.prelim ?? '',
            prelim2: entry.midterm ?? '',
            prelim3: entry.prefinal ?? '',
            prelim4: entry.final ?? '',
            grade: entry.grade ?? '',
            remarks: entry.remark ?? '',
          } satisfies Row
        })
        .filter((entry): entry is Row => Boolean(entry)),
    )
  }

  function update(index: number, field: keyof Row, value: string) {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    )
    setError('')
  }

  async function save() {
    if (!confirmed) {
      setError('Confirm that you understand this writes to the school database.')
      return
    }
    setSaving(true)
    setError('')
    const ok = await onSave(
      rows.map((row) => ({
        studid: row.studentId,
        subjcode: row.subjcode,
        prelim1: row.prelim1,
        prelim2: row.prelim2,
        prelim3: row.prelim3,
        prelim4: row.prelim4,
        remarks: row.remarks,
      })),
    )
    setSaving(false)
    if (ok) onClose()
    else setError('The database did not accept the class grade write.')
  }

  return (
    <Modal
      eyebrow={`${term.label} · live class grade sheet`}
      title={`Class grades — ${code || 'Select a subject'}`}
      subtitle="Writes the four raw components for every student in this section."
      onClose={onClose}
      size="wide"
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={save} disabled={!confirmed || saving || rows.length === 0}>
            {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
            Save class to school database
          </button>
        </>
      }
    >
      <div className="info-strip" style={{ marginBottom: 12, borderColor: '#efcccc', background: 'var(--red-bg)', color: 'var(--red)' }}>
        <AlertTriangle size={14} />
        <div>
          <strong>Live write.</strong> This updates <strong>srgb.registration</strong> for every
          student in the selected section. The database trigger computes each cumulative grade.
        </div>
      </div>

      <div className="field" style={{ marginBottom: 12, maxWidth: 360 }}>
        <label htmlFor="class-subject">Subject / section</label>
        <select
          id="class-subject"
          className="select"
          value={subjectKey}
          onChange={(event) => chooseSubject(event.target.value)}
        >
          {subjectOptions.map((entry) => (
            <option key={`${entry.code}|${entry.section}`} value={`${entry.code}|${entry.section}`}>
              {entry.code} · {entry.title} · Section {entry.section}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap" style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Student</th>
              <th scope="col" className="center">Prelim</th>
              <th scope="col" className="center">Midterm</th>
              <th scope="col" className="center">Pre-final</th>
              <th scope="col" className="center">Final</th>
              <th scope="col" className="center">Computed</th>
              <th scope="col">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.studentId}-${row.subjcode}`}>
                <td>
                  <div className="strong">{row.name}</div>
                  <div className="muted-cell">{row.studentId}</div>
                </td>
                {(['prelim1', 'prelim2', 'prelim3', 'prelim4'] as const).map((field) => (
                  <td key={field} className="center">
                    <input
                      className="input"
                      style={{ width: 62, height: 32, padding: '0 5px', textAlign: 'center' }}
                      value={row[field]}
                      maxLength={6}
                      inputMode="decimal"
                      aria-label={`${field} for ${row.name}`}
                      onChange={(event) => update(index, field, event.target.value)}
                    />
                  </td>
                ))}
                <td className="center">
                  <span className="strong tabular">{row.grade || '—'}</span>
                  <div className="muted-cell" style={{ fontSize: 8 }}>DB computed</div>
                </td>
                <td>
                  <input
                    className="input"
                    style={{ minWidth: 110, height: 32, fontSize: 11 }}
                    value={row.remarks}
                    placeholder="—"
                    aria-label={`Remarks for ${row.name}`}
                    onChange={(event) => update(index, 'remarks', event.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <label className="checkbox-row" style={{ marginTop: 13 }}>
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        I understand that saving writes this whole section to the live school database.
      </label>

      {error && <div className="form-error" style={{ marginTop: 10 }}>{error}</div>}

      <div className="info-strip" style={{ marginTop: 10 }}>
        <CheckCircle2 size={14} />
        <div>
          The update uses <strong>sy, sem, studid, subjcode</strong>. Assessment and payment rows
          are not touched.
        </div>
      </div>
    </Modal>
  )
}
