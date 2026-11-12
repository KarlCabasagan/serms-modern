import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Save } from 'lucide-react'
import type { Enrollment, Student, Term } from '../types'
import { fullName } from '../lib/format'
import { Modal } from './ui'

interface Row {
  subjcode: string
  title: string
  section: string
  prelim1: string
  prelim2: string
  prelim3: string
  prelim4: string
  grade: string
  remarks: string
}

export function LiveGradeDialog({
  student,
  enrollments,
  term,
  onClose,
  onSave,
}: {
  student: Student
  enrollments: Enrollment[]
  term: Term
  onClose: () => void
  onSave: (rows: Array<{ studid: string; subjcode: string; prelim1: string; prelim2: string; prelim3: string; prelim4: string; remarks: string }>) => Promise<boolean>
}) {
  const [rows, setRows] = useState<Row[]>(
    enrollments.map((item) => ({
      subjcode: item.code,
      title: item.title,
      section: item.section,
      prelim1: item.prelim ?? '',
      prelim2: item.midterm ?? '',
      prelim3: item.prefinal ?? '',
      prelim4: item.final ?? '',
      grade: item.grade ?? '',
      remarks: item.remark ?? '',
    })),
  )
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
        studid: student.id,
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
    else setError('The database did not accept the grade write. Review the server message and try again.')
  }

  return (
    <Modal
      eyebrow={`${term.label} · live grade entry`}
      title={`Grades — ${fullName(student)}`}
      subtitle="This sheet writes raw components to srgb.registration on the school server."
      onClose={onClose}
      size="wide"
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={save} disabled={!confirmed || saving || rows.length === 0}>
            {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
            Save to school database
          </button>
        </>
      }
    >
      <div className="info-strip" style={{ marginBottom: 13, borderColor: '#efcccc', background: 'var(--red-bg)', color: 'var(--red)' }}>
        <AlertTriangle size={14} />
        <div>
          <strong>Live write.</strong> These values update <strong>srgb.registration</strong> for
          {' '}{term.label}. This is the same table and key used by the original grade sheet. Only
          use this on a test student until the school confirms the workflow.
        </div>
      </div>

      <div className="table-wrap" style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Subject</th>
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
              <tr key={`${row.subjcode}-${row.section}`}>
                <td>
                  <div className="strong">{row.subjcode}</div>
                  <div className="muted-cell">{row.title} · Section {row.section}</div>
                </td>
                {(['prelim1', 'prelim2', 'prelim3', 'prelim4'] as const).map((field) => (
                  <td key={field} className="center">
                    <input
                      className="input"
                      style={{ width: 62, height: 32, padding: '0 5px', textAlign: 'center' }}
                      value={row[field]}
                      maxLength={6}
                      inputMode="decimal"
                      aria-label={`${field} for ${row.subjcode}`}
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
                    aria-label={`Remarks for ${row.subjcode}`}
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
        I understand that saving writes these grades to the live school database.
      </label>

      {error && (
        <div className="form-error" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}

      <div className="info-strip" style={{ marginTop: 10 }}>
        <CheckCircle2 size={14} />
        <div>
          The cumulative grade is computed by the database trigger from the four components.
          The update uses the same key as the original app:
          <strong> sy, sem, studid, subjcode</strong>. It does not touch assessment or payment rows.
        </div>
      </div>
    </Modal>
  )
}
