import type { Student } from '../types'

export interface FeeLine {
  label: string
  amount: number
  note?: string
}

export function getFeeLines(student: Student): FeeLine[] {
  if (student.units === 0) {
    return [{ label: 'Prior balance', amount: student.balance, note: 'Carried from a previous term' }]
  }
  const labFee = Math.max(0, student.assessmentTotal - student.units * 685 - 4780)
  return [
    { label: 'Tuition fee', amount: student.units * 685, note: `${student.units} units × ₱685` },
    { label: 'Registration fee', amount: 850 },
    { label: 'Library fee', amount: 620 },
    { label: 'Medical / dental', amount: 380 },
    { label: 'Athletics fee', amount: 300 },
    { label: 'Student publication', amount: 250 },
    { label: 'Student government', amount: 180 },
    { label: 'Guidance fee', amount: 300 },
    { label: 'ID fee', amount: 250 },
    { label: 'Facilities development', amount: 1200 },
    { label: 'Laboratory fee', amount: labFee, note: student.programName },
    { label: 'Miscellaneous fee (CHED)', amount: 450 },
  ]
}
