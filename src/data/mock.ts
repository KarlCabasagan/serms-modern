import type {
  Activity,
  Enrollment,
  FacultyMember,
  Offering,
  Payment,
  ReportDef,
  Student,
  Subject,
  Term,
} from '../types'
import { fullName, makeOrno, todayIso } from '../lib/format'

export const currentTerm: Term = {
  ay: '2026–2027',
  semester: 'First Semester',
  label: '1st Semester · AY 2026–2027',
  sem: '1',
}

export const terms: Term[] = [
  currentTerm,
  { ay: '2025–2026', semester: 'Second Semester', label: '2nd Semester · AY 2025–2026', sem: '2' },
  { ay: '2025–2026', semester: 'First Semester', label: '1st Semester · AY 2025–2026', sem: '1' },
  { ay: '2024–2025', semester: 'Summer', label: 'Summer · AY 2024–2025', sem: 'S' },
]

const programInfo: Record<
  string,
  { name: string; college: string; lab: number; core: string[] }
> = {
  BSCS: {
    name: 'BS Computer Science',
    college: 'College of Computer Studies',
    lab: 3200,
    core: ['CS 101', 'CS 102', 'CS 201', 'MATH 101'],
  },
  BSIT: {
    name: 'BS Information Technology',
    college: 'College of Computer Studies',
    lab: 2800,
    core: ['IT 101', 'IT 102', 'IT 201', 'MATH 101'],
  },
  BSN: {
    name: 'BS Nursing',
    college: 'College of Nursing',
    lab: 4800,
    core: ['NUR 101', 'NUR 102', 'ANA 101', 'NUR 201'],
  },
  BSA: {
    name: 'BS Accountancy',
    college: 'College of Business Administration',
    lab: 2200,
    core: ['ACC 101', 'ACC 102', 'BUS 101', 'TAX 101'],
  },
  BSBA: {
    name: 'BS Business Administration',
    college: 'College of Business Administration',
    lab: 1800,
    core: ['BUS 101', 'MKT 101', 'FIN 101', 'BUS 201'],
  },
  BEED: {
    name: 'Bachelor of Elementary Education',
    college: 'College of Education',
    lab: 1800,
    core: ['EDU 101', 'EDU 102', 'PSY 101', 'EDU 201'],
  },
  BSED: {
    name: 'Bachelor of Secondary Education',
    college: 'College of Education',
    lab: 1800,
    core: ['EDU 101', 'EDU 102', 'PSY 101', 'EDU 202'],
  },
  BSCRIM: {
    name: 'BS Criminology',
    college: 'College of Criminal Justice',
    lab: 2200,
    core: ['CRIM 101', 'CRIM 102', 'LAW 101', 'CRIM 201'],
  },
}

const catalog: Record<string, Omit<Subject, 'section' | 'schedule' | 'room'>> = {
  'CS 101': { code: 'CS 101', title: 'Introduction to Computing', units: 3, instructor: 'Prof. A. Salazar', department: 'Computer Studies' },
  'CS 102': { code: 'CS 102', title: 'Programming Fundamentals', units: 3, instructor: 'Prof. M. Ocampo', department: 'Computer Studies' },
  'CS 201': { code: 'CS 201', title: 'Data Structures & Algorithms', units: 3, instructor: 'Prof. J. Abellanosa', department: 'Computer Studies' },
  'IT 101': { code: 'IT 101', title: 'Platform Technologies', units: 3, instructor: 'Prof. R. Cabahug', department: 'Computer Studies' },
  'IT 102': { code: 'IT 102', title: 'Web Systems & Technologies', units: 3, instructor: 'Prof. K. Yap', department: 'Computer Studies' },
  'IT 201': { code: 'IT 201', title: 'Database Management Systems', units: 3, instructor: 'Prof. J. Abellanosa', department: 'Computer Studies' },
  'NUR 101': { code: 'NUR 101', title: 'Fundamentals of Nursing', units: 3, instructor: 'Prof. L. Villamor', department: 'Nursing' },
  'NUR 102': { code: 'NUR 102', title: 'Health Assessment', units: 3, instructor: 'Prof. C. Estrella', department: 'Nursing' },
  'NUR 201': { code: 'NUR 201', title: 'Community Health Nursing', units: 3, instructor: 'Prof. T. Manalo', department: 'Nursing' },
  'ANA 101': { code: 'ANA 101', title: 'Anatomy & Physiology', units: 3, instructor: 'Prof. D. Peralta', department: 'Nursing' },
  'ACC 101': { code: 'ACC 101', title: 'Financial Accounting', units: 3, instructor: 'Prof. E. Lim', department: 'Accountancy' },
  'ACC 102': { code: 'ACC 102', title: 'Managerial Accounting', units: 3, instructor: 'Prof. E. Lim', department: 'Accountancy' },
  'TAX 101': { code: 'TAX 101', title: 'Income Taxation', units: 3, instructor: 'Prof. B. Tan', department: 'Accountancy' },
  'BUS 101': { code: 'BUS 101', title: 'Principles of Management', units: 3, instructor: 'Prof. F. Uy', department: 'Business' },
  'BUS 201': { code: 'BUS 201', title: 'Operations Management', units: 3, instructor: 'Prof. F. Uy', department: 'Business' },
  'MKT 101': { code: 'MKT 101', title: 'Principles of Marketing', units: 3, instructor: 'Prof. S. Go', department: 'Business' },
  'FIN 101': { code: 'FIN 101', title: 'Business Finance', units: 3, instructor: 'Prof. B. Tan', department: 'Business' },
  'EDU 101': { code: 'EDU 101', title: 'Foundations of Education', units: 3, instructor: 'Prof. N. Alonto', department: 'Education' },
  'EDU 102': { code: 'EDU 102', title: 'Child & Adolescent Development', units: 3, instructor: 'Prof. G. Mercado', department: 'Education' },
  'EDU 201': { code: 'EDU 201', title: 'Curriculum Development', units: 3, instructor: 'Prof. N. Alonto', department: 'Education' },
  'EDU 202': { code: 'EDU 202', title: 'Assessment of Learning', units: 3, instructor: 'Prof. G. Mercado', department: 'Education' },
  'PSY 101': { code: 'PSY 101', title: 'General Psychology', units: 3, instructor: 'Prof. H. Cabrera', department: 'Arts & Sciences' },
  'CRIM 101': { code: 'CRIM 101', title: 'Introduction to Criminology', units: 3, instructor: 'Prof. V. Roa', department: 'Criminal Justice' },
  'CRIM 102': { code: 'CRIM 102', title: 'Criminal Justice System', units: 3, instructor: 'Prof. V. Roa', department: 'Criminal Justice' },
  'CRIM 201': { code: 'CRIM 201', title: 'Criminal Law & Procedure', units: 3, instructor: 'Atty. P. Gomez', department: 'Criminal Justice' },
  'LAW 101': { code: 'LAW 101', title: 'Philippine Constitution', units: 3, instructor: 'Atty. P. Gomez', department: 'Criminal Justice' },
  'MATH 101': { code: 'MATH 101', title: 'Mathematics in the Modern World', units: 3, instructor: 'Prof. R. Fuentes', department: 'Arts & Sciences' },
  'GE 101': { code: 'GE 101', title: 'Understanding the Self', units: 3, instructor: 'Prof. I. Suarez', department: 'Arts & Sciences' },
  'FIL 101': { code: 'FIL 101', title: 'Kontekstwalisadong Komunikasyon', units: 3, instructor: 'Prof. M. Dizon', department: 'Arts & Sciences' },
  'PE 1': { code: 'PE 1', title: 'Physical Fitness & Wellness', units: 2, instructor: 'Prof. J. Bacalso', department: 'Arts & Sciences' },
  'NSTP 1': { code: 'NSTP 1', title: 'National Service Training Program', units: 3, instructor: 'Prof. R. Padilla', department: 'Arts & Sciences' },
}

const schedules = [
  'MWF · 8:00–9:00 AM',
  'MWF · 9:10–10:10 AM',
  'TTh · 10:20–11:40 AM',
  'MWF · 1:00–2:00 PM',
  'TTh · 2:00–3:20 PM',
  'Sat · 8:00–11:00 AM',
]
const rooms = ['Room 201', 'Room 204', 'Lab 3', 'Room 310', 'Auditorium', 'Room 105']
const sections = ['A', 'B', 'C', 'D']

interface Seed {
  first: string
  middle: string
  last: string
  program: string
  year: string
  status: Student['status']
  scholarship: string
  units: number
  gpa: number
  balance: number
  gender: 'F' | 'M'
}

const seeds: Seed[] = [
  { first: 'Maria Clara', middle: 'Dizon', last: 'Santos', program: 'BSCS', year: '3rd Year', status: 'Enrolled', scholarship: "Dean's Lister", units: 18, gpa: 1.42, balance: 0, gender: 'F' },
  { first: 'Juan Miguel', middle: 'Reyes', last: 'Dela Cruz', program: 'BSIT', year: '2nd Year', status: 'Enrolled', scholarship: 'CHED TES', units: 18, gpa: 2.05, balance: 12450, gender: 'M' },
  { first: 'Andrea Nicole', middle: 'Lim', last: 'Reyes', program: 'BSN', year: '4th Year', status: 'Graduating', scholarship: 'None', units: 15, gpa: 1.68, balance: 8750, gender: 'F' },
  { first: 'Paolo Gabriel', middle: 'Cruz', last: 'Garcia', program: 'BSA', year: '1st Year', status: 'Enrolled', scholarship: 'None', units: 21, gpa: 2.31, balance: 18600, gender: 'M' },
  { first: 'Bea Kristine', middle: 'Uy', last: 'Mendoza', program: 'BSBA', year: '3rd Year', status: 'Enrolled', scholarship: 'STUFAP', units: 18, gpa: 1.89, balance: 0, gender: 'F' },
  { first: 'Nathan James', middle: 'Ramos', last: 'Villanueva', program: 'BSED', year: '2nd Year', status: 'Unregistered', scholarship: 'None', units: 0, gpa: 2.44, balance: 0, gender: 'M' },
  { first: 'Sofia Isabel', middle: 'Go', last: 'Ramos', program: 'BSCS', year: '4th Year', status: 'Graduating', scholarship: 'DOST', units: 15, gpa: 1.25, balance: 0, gender: 'F' },
  { first: 'Gabriel Luis', middle: 'Tan', last: 'Aquino', program: 'BSCRIM', year: '1st Year', status: 'Enrolled', scholarship: 'None', units: 18, gpa: 2.12, balance: 9750, gender: 'M' },
  { first: 'Hannah Grace', middle: 'Ong', last: 'Lim', program: 'BSN', year: '2nd Year', status: 'Enrolled', scholarship: "Dean's Lister", units: 18, gpa: 1.55, balance: 4300, gender: 'F' },
  { first: 'Miguel Antonio', middle: 'Sy', last: 'Torres', program: 'BSIT', year: '3rd Year', status: 'On leave', scholarship: 'None', units: 0, gpa: 2.67, balance: 5600, gender: 'M' },
  { first: 'Angela Marie', middle: 'Bautista', last: 'Flores', program: 'BEED', year: '4th Year', status: 'Graduating', scholarship: 'CHED TES', units: 15, gpa: 1.74, balance: 6200, gender: 'F' },
  { first: 'Rafael Jose', middle: 'Navarro', last: 'Diaz', program: 'BSA', year: '2nd Year', status: 'Enrolled', scholarship: 'None', units: 18, gpa: 2.28, balance: 13800, gender: 'M' },
  { first: 'Patricia Anne', middle: 'Cheng', last: 'Bautista', program: 'BSBA', year: '1st Year', status: 'Unregistered', scholarship: 'None', units: 0, gpa: 0, balance: 0, gender: 'F' },
  { first: 'Daniel Christian', middle: 'Reyes', last: 'Ong', program: 'BSCS', year: '2nd Year', status: 'Enrolled', scholarship: 'STUFAP', units: 18, gpa: 1.96, balance: 0, gender: 'M' },
  { first: 'Isabella Rose', middle: 'Tan', last: 'Tan', program: 'BSN', year: '3rd Year', status: 'Enrolled', scholarship: 'None', units: 18, gpa: 2.0, balance: 7600, gender: 'F' },
  { first: 'Mark Angelo', middle: 'Gomez', last: 'Diaz', program: 'BSED', year: '1st Year', status: 'Enrolled', scholarship: 'None', units: 21, gpa: 2.17, balance: 11200, gender: 'M' },
]

const feeSum = 4780

export function computeAssessment(units: number, program: string): number {
  if (units === 0) return 0
  return units * 685 + feeSum + (programInfo[program]?.lab ?? 1800)
}

export const students: Student[] = seeds.map((seed, index) => {
  const info = programInfo[seed.program]
  const assessmentTotal = computeAssessment(seed.units, seed.program)
  const amountPaid = Math.max(0, assessmentTotal - seed.balance)
  const id = `202${index % 5}-${String(1045 + index * 37).padStart(4, '0')}`
  const month = String(8 + (index % 2)).padStart(2, '0')
  const day = String(4 + (index % 18)).padStart(2, '0')
  return {
    id,
    firstName: seed.first,
    middleName: seed.middle,
    lastName: seed.last,
    program: seed.program,
    programName: info.name,
    college: info.college,
    year: seed.year,
    status: seed.status,
    scholarship: seed.scholarship,
    email: `${seed.first.toLowerCase().replace(/[^a-z]+/g, '.')}.${seed.last.toLowerCase()}@spc.edu.ph`,
    phone: `0917 ${String(200 + index).padStart(3, '0')} ${String(4100 + index * 13).padStart(4, '0')}`,
    address: `Iligan City, Lanao del Norte`,
    birthDate: `200${1 + (index % 5)}-${month}-${day}`,
    gender: seed.gender,
    units: seed.units,
    gpa: seed.gpa,
    assessmentTotal,
    amountPaid,
    balance: seed.balance,
    adviser: ['Prof. A. Salazar', 'Prof. L. Villamor', 'Prof. E. Lim', 'Prof. N. Alonto'][index % 4],
    enrolledAt: `2026-08-${String(1 + (index % 20)).padStart(2, '0')}`,
  }
})

export const enrollments: Enrollment[] = students.flatMap((student, studentIndex) => {
  if (student.units === 0) return []
  const info = programInfo[student.program]
  const codes = [...info.core, 'GE 101', 'FIL 101', 'PE 1', 'NSTP 1']
  const target = Math.max(1, Math.round(student.units / 3))
  return codes.slice(0, Math.min(target, codes.length)).map((code, index) => {
    const subject = catalog[code]
    const withGrade = studentIndex === 0 || studentIndex === 4 || studentIndex === 8
    return {
      studentId: student.id,
      code,
      title: subject.title,
      units: subject.units,
      section: sections[(studentIndex + index) % sections.length],
      schedule: schedules[(studentIndex + index) % schedules.length],
      room: rooms[(studentIndex + index) % rooms.length],
      instructor: subject.instructor,
      status: 'Enrolled',
      prelim: withGrade ? ['1.25', '1.50', '1.75', '2.00'][index % 4] : undefined,
      midterm: withGrade ? ['1.25', '1.50', '1.75', '2.00'][(index + 1) % 4] : undefined,
      prefinal: withGrade ? ['1.25', '1.50', '1.75', '2.00'][(index + 2) % 4] : undefined,
    }
  })
})

export const subjects: Subject[] = Object.values(catalog).map((subject, index) => ({
  ...subject,
  section: sections[index % sections.length],
  schedule: schedules[index % schedules.length],
  room: rooms[index % rooms.length],
}))

const cashiers = ['A. Ramirez', 'J. Pelaez', 'M. Abella']
const seedPayments: Payment[] = []
let orSeed = 41021

for (const [index, student] of students.entries()) {
  if (student.amountPaid <= 0) continue
  const firstAmount = Math.round(student.amountPaid * 0.6)
  const secondAmount = student.amountPaid - firstAmount
  seedPayments.push({
    id: `pay-${index}-a`,
    orno: makeOrno(orSeed++),
    studentId: student.id,
    studentName: fullName(student),
    date: student.enrolledAt,
    amount: firstAmount,
    paycode: 'REG',
    fund: 'Trust Fund',
    cashier: cashiers[index % cashiers.length],
    status: 'Posted',
  })
  if (secondAmount > 0) {
    const isToday = [1, 3, 7, 11, 14].includes(index)
    seedPayments.push({
      id: `pay-${index}-b`,
      orno: makeOrno(orSeed++),
      studentId: student.id,
      studentName: fullName(student),
      date: isToday ? todayIso() : `2026-09-${String(2 + (index % 24)).padStart(2, '0')}`,
      amount: secondAmount,
      paycode: 'TUI',
      fund: 'Trust Fund',
      cashier: cashiers[(index + 1) % cashiers.length],
      status: 'Posted',
    })
  }
}

export const payments: Payment[] = seedPayments.sort((a, b) => b.date.localeCompare(a.date))

export const activities: Activity[] = [
  { id: 'a1', title: 'Payment posted', detail: 'OR-2026-41045 · Juan Miguel Dela Cruz · ₱4,980.00', time: '2 min ago', tone: 'green' },
  { id: 'a2', title: 'COR created', detail: 'Maria Clara Santos · 18 units · 3rd Year BSCS', time: '18 min ago', tone: 'maroon' },
  { id: 'a3', title: 'Grade sheet submitted', detail: 'CS 201 · Section A · Prof. J. Abellanosa', time: '41 min ago', tone: 'amber' },
  { id: 'a4', title: 'New student record', detail: 'Mark Angelo Diaz · BSED · 1st Year', time: '1 hr ago', tone: 'neutral' },
  { id: 'a5', title: 'Scholarship updated', detail: 'Hannah Grace Lim · Dean’s Lister', time: '2 hrs ago', tone: 'green' },
  { id: 'a6', title: 'COR removed', detail: 'Patricia Anne Bautista · 1st Year BSBA', time: '3 hrs ago', tone: 'neutral' },
]

export const offerings: Offering[] = [
  { code: 'CS 201', title: 'Data Structures & Algorithms', section: 'A', schedule: 'MWF · 9:10–10:10 AM', room: 'Lab 3', instructor: 'Prof. J. Abellanosa', capacity: 40, enrolled: 37, program: 'BSCS', units: 3 },
  { code: 'CS 201', title: 'Data Structures & Algorithms', section: 'B', schedule: 'TTh · 10:20–11:40 AM', room: 'Room 204', instructor: 'Prof. J. Abellanosa', capacity: 40, enrolled: 40, program: 'BSCS', units: 3 },
  { code: 'IT 201', title: 'Database Management Systems', section: 'A', schedule: 'MWF · 1:00–2:00 PM', room: 'Lab 2', instructor: 'Prof. R. Cabahug', capacity: 35, enrolled: 31, program: 'BSIT', units: 3 },
  { code: 'NUR 201', title: 'Community Health Nursing', section: 'A', schedule: 'TTh · 2:00–3:20 PM', room: 'Room 310', instructor: 'Prof. T. Manalo', capacity: 30, enrolled: 28, program: 'BSN', units: 3 },
  { code: 'ACC 102', title: 'Managerial Accounting', section: 'B', schedule: 'MWF · 8:00–9:00 AM', room: 'Room 201', instructor: 'Prof. E. Lim', capacity: 45, enrolled: 39, program: 'BSA', units: 3 },
  { code: 'EDU 202', title: 'Assessment of Learning', section: 'A', schedule: 'Sat · 8:00–11:00 AM', room: 'Room 105', instructor: 'Prof. G. Mercado', capacity: 35, enrolled: 25, program: 'BSED', units: 3 },
  { code: 'CRIM 201', title: 'Criminal Law & Procedure', section: 'A', schedule: 'TTh · 10:20–11:40 AM', room: 'Room 310', instructor: 'Atty. P. Gomez', capacity: 40, enrolled: 34, program: 'BSCRIM', units: 3 },
  { code: 'GE 101', title: 'Understanding the Self', section: 'C', schedule: 'MWF · 1:00–2:00 PM', room: 'Room 105', instructor: 'Prof. I. Suarez', capacity: 50, enrolled: 48, program: 'All programs', units: 3 },
]

export const faculty: FacultyMember[] = [
  { id: 'EMP-1042', name: 'Prof. Justino Abellanosa', department: 'Computer Studies', load: 21, subjects: 4, status: 'Complete' },
  { id: 'EMP-1088', name: 'Prof. Lourdes Villamor', department: 'Nursing', load: 18, subjects: 3, status: 'Complete' },
  { id: 'EMP-1121', name: 'Prof. Eduardo Lim', department: 'Accountancy', load: 24, subjects: 5, status: 'Overload' },
  { id: 'EMP-1096', name: 'Prof. Nilda Alonto', department: 'Education', load: 15, subjects: 3, status: 'Pending' },
  { id: 'EMP-1174', name: 'Atty. Paolo Gomez', department: 'Criminal Justice', load: 18, subjects: 3, status: 'Complete' },
  { id: 'EMP-1149', name: 'Prof. Grace Mercado', department: 'Education', load: 12, subjects: 2, status: 'Pending' },
]

export const reports: ReportDef[] = [
  { id: 'r1', name: 'Certificate of Registration', description: 'Print a student’s current COR with subjects, schedule, and fees.', category: 'Registration', updated: 'Today' },
  { id: 'r2', name: 'Class List', description: 'Official class list by subject, section, and term.', category: 'Registration', updated: 'Today' },
  { id: 'r3', name: 'List of Students', description: 'Filterable student master list by program, year, and status.', category: 'Registration', updated: 'Yesterday' },
  { id: 'r4', name: 'Enrolment Report', description: 'Enrolment count and breakdown for the current term.', category: 'Registration', updated: 'Yesterday' },
  { id: 'r5', name: 'Students with Balance', description: 'Accounts with an outstanding balance, grouped by program.', category: 'Cashier', updated: 'Today' },
  { id: 'r6', name: 'Report of Collections', description: 'Daily and period collections by fund, paycode, and cashier.', category: 'Cashier', updated: 'Today' },
  { id: 'r7', name: 'Statement of Account', description: 'Assessment, payments, and running balance for one student.', category: 'Cashier', updated: 'Yesterday' },
  { id: 'r8', name: 'Summary of Collections', description: 'Consolidated collection summary with signatories.', category: 'Cashier', updated: '2 days ago' },
  { id: 'r9', name: 'Official Receipt', description: 'Reprint an official receipt by OR number.', category: 'Cashier', updated: 'Today' },
  { id: 'r10', name: 'Transcript of Records', description: 'Complete academic record with grades and units.', category: 'Academic', updated: 'Yesterday' },
  { id: 'r11', name: 'Report of Grades', description: 'Grade sheet by subject, section, and faculty.', category: 'Academic', updated: 'Today' },
  { id: 'r12', name: 'Dean’s List', description: 'Qualified students ranked by term GPA.', category: 'Academic', updated: '2 days ago' },
  { id: 'r13', name: 'GPA / Status Report', description: 'Term and cumulative GPA with academic status.', category: 'Academic', updated: '3 days ago' },
  { id: 'r14', name: 'Evaluation Record', description: 'Student evaluation record for transfer or graduation.', category: 'Academic', updated: 'Last week' },
  { id: 'r15', name: 'CHED Form E5', description: 'Faculty profile report for CHED submission.', category: 'CHED', updated: 'Last week' },
  { id: 'r16', name: 'CHED Form BC', description: 'Program and enrolment profile for CHED.', category: 'CHED', updated: 'Last week' },
  { id: 'r17', name: 'List of Graduates', description: 'Candidates for graduation by program and term.', category: 'CHED', updated: '2 weeks ago' },
  { id: 'r18', name: 'Promotional Report', description: 'Promotion and retention summary by year level.', category: 'CHED', updated: '2 weeks ago' },
  { id: 'r19', name: 'Teaching Load Summary', description: 'Faculty teaching load with subject assignments.', category: 'Administration', updated: 'Yesterday' },
  { id: 'r20', name: 'Individual Faculty Load', description: 'Detailed load sheet for one faculty member.', category: 'Administration', updated: 'Yesterday' },
  { id: 'r21', name: 'Room Utilization', description: 'Room usage by day, time, and section.', category: 'Administration', updated: 'Last week' },
  { id: 'r22', name: 'Logon History', description: 'User access history for audit purposes.', category: 'Administration', updated: 'Today' },
]

export const getEnrollments = (studentId: string): Enrollment[] =>
  enrollments.filter((entry) => entry.studentId === studentId)

export const getPayments = (studentId: string): Payment[] =>
  payments.filter((entry) => entry.studentId === studentId)
