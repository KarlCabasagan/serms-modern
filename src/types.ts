export type Role = 'Registrar' | 'Cashier' | 'Faculty' | 'Accounting' | 'Administrator'

export const roles: Role[] = ['Registrar', 'Cashier', 'Faculty', 'Accounting', 'Administrator']

export type NavKey =
  | 'dashboard'
  | 'students'
  | 'registration'
  | 'cashier'
  | 'academics'
  | 'reports'
  | 'administration'

export type StudentStatus = 'Enrolled' | 'Unregistered' | 'Graduating' | 'On leave'

export interface Student {
  id: string
  firstName: string
  middleName: string
  lastName: string
  suffix?: string
  program: string
  programName: string
  college: string
  year: string
  status: StudentStatus
  scholarship: string
  email: string
  phone: string
  address: string
  birthDate: string
  gender: 'F' | 'M'
  units: number
  gpa: number
  assessmentTotal: number
  amountPaid: number
  balance: number
  adviser: string
  enrolledAt: string
}

export interface Subject {
  code: string
  title: string
  units: number
  schedule: string
  room: string
  instructor: string
  section: string
  department: string
}

export interface Enrollment {
  studentId: string
  code: string
  title: string
  units: number
  section: string
  schedule: string
  room: string
  instructor: string
  status: 'Enrolled' | 'Completed' | 'Dropped'
  prelim?: string
  midterm?: string
  prefinal?: string
  final?: string
  grade?: string
  remark?: string
}

export interface Payment {
  id: string
  orno: string
  studentId: string
  studentName: string
  date: string
  amount: number
  paycode: string
  fund: string
  cashier: string
  status: 'Posted' | 'Cancelled' | 'Refunded'
}

export interface FeeLine {
  label: string
  amount: number
  note?: string
}

export interface Activity {
  id: string
  title: string
  detail: string
  time: string
  tone: 'maroon' | 'green' | 'amber' | 'neutral'
}

export interface ReportDef {
  id: string
  name: string
  description: string
  category: 'Registration' | 'Cashier' | 'Academic' | 'CHED' | 'Administration'
  updated: string
}

export interface Offering {
  code: string
  title: string
  section: string
  schedule: string
  room: string
  instructor: string
  capacity: number
  enrolled: number
  program: string
  units: number
}

export interface FacultyMember {
  id: string
  name: string
  department: string
  load: number
  subjects: number
  status: 'Complete' | 'Pending' | 'Overload'
}

export interface Term {
  ay: string
  semester: string
  label: string
  sem?: string
}

export interface ToastMessage {
  id: string
  title: string
  detail?: string
  tone?: 'success' | 'neutral' | 'warning'
}
