import { useState, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import type { Student } from '../types'
import { Modal } from './ui'

const programs = [
  ['BSCS', 'BS Computer Science', 'College of Computer Studies'],
  ['BSIT', 'BS Information Technology', 'College of Computer Studies'],
  ['BSN', 'BS Nursing', 'College of Nursing'],
  ['BSA', 'BS Accountancy', 'College of Business Administration'],
  ['BSBA', 'BS Business Administration', 'College of Business Administration'],
  ['BEED', 'Bachelor of Elementary Education', 'College of Education'],
  ['BSED', 'Bachelor of Secondary Education', 'College of Education'],
  ['BSCRIM', 'BS Criminology', 'College of Criminal Justice'],
] as const

export function StudentDialog({
  open,
  nextId,
  student,
  onClose,
  onSave,
}: {
  open: boolean
  nextId: number
  student?: Student
  onClose: () => void
  onSave: (student: Student) => void
}) {
  const editing = Boolean(student)
  const [firstName, setFirstName] = useState(student?.firstName ?? '')
  const [middleName, setMiddleName] = useState(student?.middleName ?? '')
  const [lastName, setLastName] = useState(student?.lastName ?? '')
  const [program, setProgram] = useState<string>(student?.program ?? 'BSCS')
  const [year, setYear] = useState(student?.year ?? '1st Year')
  const [gender, setGender] = useState<'F' | 'M'>(student?.gender ?? 'F')
  const [scholarship, setScholarship] = useState(student?.scholarship ?? 'None')
  const [error, setError] = useState('')

  if (!open) return null

  const selectedProgram = programs.find(([code]) => code === program) ?? programs[0]
  const id = student?.id ?? `2026-${String(nextId).padStart(4, '0')}`

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.')
      return
    }
    setError('')
    onSave({
      ...(student ?? {
        phone: '',
        address: 'Iligan City, Lanao del Norte',
        birthDate: '2005-01-01',
        units: 0,
        gpa: 0,
        assessmentTotal: 0,
        amountPaid: 0,
        balance: 0,
        adviser: 'Unassigned',
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'Enrolled' as const,
        suffix: undefined,
      }),
      id,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      program: selectedProgram[0],
      programName: selectedProgram[1],
      college: selectedProgram[2],
      year,
      scholarship,
      gender,
      email: `${firstName.trim().toLowerCase().replace(/[^a-z]+/g, '.')}.${lastName
        .trim()
        .toLowerCase()}@spc.edu.ph`,
    })
  }

  return (
    <Modal
      eyebrow={editing ? 'Student records · edit record' : 'Student records · new record'}
      title={editing ? 'Edit student' : 'Add a student'}
      subtitle={
        editing
          ? 'Update the master record. Enrollment, assessment, and payment history stay attached.'
          : 'Create the master record first. Enrollment and assessment follow from the student workspace.'
      }
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" form="student-form" type="submit">
            <UserPlus size={14} />
            {editing ? 'Save changes' : 'Create student'}
          </button>
        </>
      }
    >
      <form className="form-grid" id="student-form" onSubmit={submit} noValidate>
        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="new-first">First name</label>
            <input
              id="new-first"
              className="input"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value)
                setError('')
              }}
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="new-middle">Middle name</label>
            <input id="new-middle" className="input" value={middleName} onChange={(event) => setMiddleName(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="new-last">Last name</label>
            <input
              id="new-last"
              className="input"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value)
                setError('')
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="new-id">Student ID</label>
            <input id="new-id" className="input" value={id} readOnly />
          </div>
        </div>

        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="new-program">Program</label>
            <select id="new-program" className="select" value={program} onChange={(event) => setProgram(event.target.value)}>
              {programs.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="new-year">Year level</label>
            <select id="new-year" className="select" value={year} onChange={(event) => setYear(event.target.value)}>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
              <option>5th Year</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="new-gender">Sex</label>
            <select id="new-gender" className="select" value={gender} onChange={(event) => setGender(event.target.value as 'F' | 'M')}>
              <option value="F">Female</option>
              <option value="M">Male</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="new-scholarship">Scholarship</label>
            <select id="new-scholarship" className="select" value={scholarship} onChange={(event) => setScholarship(event.target.value)}>
              <option>None</option>
              <option>Dean's Lister</option>
              <option>CHED TES</option>
              <option>STUFAP</option>
              <option>DOST</option>
            </select>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="info-strip">
          <UserPlus size={14} />
          <div>
            {editing
              ? 'Changes apply to the student master record. Existing enrollment and payment history are not touched.'
              : 'The new record starts unassessed. Add subjects in the student workspace; the assessment is generated from the same database functions as the current SERMS.'}
          </div>
        </div>
      </form>
    </Modal>
  )
}
