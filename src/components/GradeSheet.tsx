import { useMemo, useState } from 'react'
import { CheckCircle2, LockKeyhole, Save, ShieldCheck } from 'lucide-react'
import type { Enrollment, Offering, Student } from '../types'
import { fullName } from '../lib/format'
import { Modal } from './ui'

interface GradeRow {
  studentId: string
  name: string
  prelim: string
  midterm: string
  prefinal: string
  final: string
  remarks: string
}

export function GradeSheetDialog({
  offering,
  students,
  enrollments,
  onClose,
  onSave,
}: {
  offering: Offering | null
  students: Student[]
  enrollments: Enrollment[]
  onClose: () => void
  onSave: (offering: Offering, rows: GradeRow[]) => void
}) {
  const roster = useMemo(() => {
    if (!offering) return []
    const matching = enrollments.filter(
      (entry) => entry.code === offering.code && entry.section === offering.section,
    )
    const studentIds = new Set(matching.map((entry) => entry.studentId))
    const candidates = students.filter((student) => studentIds.has(student.id))
    const fallback = students.filter((student) => student.units > 0).slice(0, 6)
    return (candidates.length >= 3 ? candidates : fallback).map((student) => ({
      student,
      enrollment: matching.find((entry) => entry.studentId === student.id),
    }))
  }, [offering, enrollments, students])

  const [rows, setRows] = useState<GradeRow[]>(() =>
    roster.map(({ student, enrollment }) => ({
      studentId: student.id,
      name: fullName(student),
      prelim: enrollment?.prelim ?? '',
      midterm: enrollment?.midterm ?? '',
      prefinal: enrollment?.prefinal ?? '',
      final: enrollment?.final ?? '',
      remarks: enrollment?.remark ?? '',
    })),
  )
  const [saved, setSaved] = useState(false)

  if (!offering) return null

  function update(index: number, field: keyof GradeRow, value: string) {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    )
    setSaved(false)
  }

  return (
    <Modal
      eyebrow={`${offering.code} · Section ${offering.section} · Grade sheet`}
      title={`${offering.code} — ${offering.title}`}
      subtitle={`${offering.instructor} · ${offering.schedule} · ${offering.room}`}
      onClose={onClose}
      size="wide"
      footer={
        <>
          <span className="muted" style={{ fontSize: 10 }}>
            <LockKeyhole size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
            Grades are written to <strong>srgb.registration</strong> on save.
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn--primary"
              onClick={() => {
                onSave(offering, rows)
                setSaved(true)
              }}
            >
              <Save size={14} />
              Save grades
            </button>
          </div>
        </>
      }
    >
      <div className="info-strip" style={{ marginBottom: 14 }}>
        <ShieldCheck size={14} />
        <div>
          This is the grade desk. Entering a grade here posts it directly to the school server,
          exactly like the current SERMS grade sheet. There is no separate upload step.
        </div>
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
              <th scope="col">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.studentId}>
                <td>
                  <div className="cell-person">
                    <span className="avatar avatar--xs">
                      {row.name.split(' ')[0]?.[0]}
                      {row.name.split(' ').slice(-1)[0]?.[0]}
                    </span>
                    <div className="cell-person__copy">
                      <div className="cell-person__name">{row.name}</div>
                      <div className="cell-person__meta">{row.studentId}</div>
                    </div>
                  </div>
                </td>
                {(['prelim', 'midterm', 'prefinal', 'final'] as const).map((field) => (
                  <td key={field} className="center">
                    <input
                      className="input"
                      style={{ width: 64, height: 32, padding: '0 6px', textAlign: 'center' }}
                      value={row[field]}
                      maxLength={4}
                      inputMode="decimal"
                      aria-label={`${field} grade for ${row.name}`}
                      onChange={(event) => update(index, field, event.target.value)}
                    />
                  </td>
                ))}
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

      {saved && (
        <div className="info-strip" style={{ marginTop: 12, color: 'var(--green)' }}>
          <CheckCircle2 size={14} />
          <div>Saved to the sample grade sheet. In the live build this becomes the PostgreSQL write.</div>
        </div>
      )}
    </Modal>
  )
}
