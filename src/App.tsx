import { useEffect, useMemo, useState } from 'react'
import {
  activities as demoActivities,
  currentTerm,
  demoFacultyProfile,
  enrollments as demoEnrollments,
  faculty,
  offerings,
  payments as demoPayments,
  students as demoStudents,
} from './data/mock'
import type { Enrollment, FacultyProfile, NavKey, Payment, Role, Student, Term, ToastMessage } from './types'
import { canAccess, AppShell } from './components/AppShell'
import CommandPalette from './components/CommandPalette'
import { PaymentDialog, ReceiptDialog } from './components/PaymentDialog'
import { Toast } from './components/ui'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Students from './screens/Students'
import StudentWorkspace from './screens/StudentWorkspace'
import Registration from './screens/Registration'
import Cashier from './screens/Cashier'
import Academics from './screens/Academics'
import FacultyClasses from './screens/FacultyClasses'
import Reports from './screens/Reports'
import Administration from './screens/Administration'
import { formatMoney, fullName, todayIso } from './lib/format'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState<Role>('Registrar')
  const [nav, setNav] = useState<NavKey>('dashboard')
  const [term, setTerm] = useState<Term>(currentTerm)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>(demoStudents)
  const [enrollments, setEnrollments] = useState<Enrollment[]>(demoEnrollments)
  const [payments, setPayments] = useState<Payment[]>(demoPayments)
  const [liveMode, setLiveMode] = useState(false)
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null)
  const [liveStats, setLiveStats] = useState<{
    students: number
    enrolled: number
    unregistered: number
    balance: number
    collected: number
  } | null>(null)
  const [liveAssessmentLines, setLiveAssessmentLines] = useState<
    Record<string, Array<{ code: string; label: string; amount: number }>>
  >({})
  const [assessmentLoading, setAssessmentLoading] = useState<Record<string, boolean>>({})
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null)
  const [receipt, setReceipt] = useState<{ payment: Payment; student: Student } | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  )

  function notify(title: string, detail?: string, tone: ToastMessage['tone'] = 'success') {
    setToast({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      detail,
      tone,
    })
  }

  function applyLive(result: Awaited<ReturnType<NonNullable<typeof window.serms>['live']['connect']>>) {
    if (!result.ok) return
    setStudents(result.students)
    setEnrollments(result.enrollments)
    setPayments(result.payments)
    setFacultyProfile(result.faculty ?? null)
    setTerm(result.term)
    setLiveStats(result.stats)
    setLiveAssessmentLines({})
    setAssessmentLoading({})
    setLiveMode(true)
    setNav('dashboard')
    setSelectedStudentId(null)
    notify(
      'Live records loaded',
      `${result.stats.students.toLocaleString()} students · ${result.term.label} · grade entry is confirmation-gated`,
      'neutral',
    )
  }

  async function loadLive(credentials: { username: string; password: string }) {
    if (!window.serms) {
      notify('Live records need the desktop app', 'Open SERMS Modern from the launcher, not a browser tab.', 'warning')
      return false
    }
    const result = await window.serms.live.connect(credentials)
    if (!result.ok) {
      notify('Live records unavailable', result.message, 'warning')
      return false
    }
    applyLive(result)
    return true
  }

  async function liveLogin(
    credentials: { username: string; password: string },
    nextRole: Role,
  ): Promise<{ ok: boolean; message?: string }> {
    if (!window.serms) {
      return {
        ok: false,
        message: 'Live sign-in is available in the desktop app. Use Open demo to review the interface.',
      }
    }
    try {
      const result = await window.serms.live.connect(credentials)
      if (!result.ok) return { ok: false, message: result.message }
      applyLive(result)
      setRole(result.faculty && nextRole === 'Registrar' ? 'Faculty' : nextRole)
      setLoggedIn(true)
      return { ok: true }
    } catch {
      return { ok: false, message: 'The school server did not respond. Check the network and try again.' }
    }
  }

  function openDemo(nextRole: Role) {
    void window.serms?.live.disconnect()
    setStudents(demoStudents)
    setEnrollments(demoEnrollments)
    setPayments(demoPayments)
    setFacultyProfile(null)
    setTerm(currentTerm)
    setLiveStats(null)
    setLiveAssessmentLines({})
    setAssessmentLoading({})
    setLiveMode(false)
    setRole(nextRole)
    setNav('dashboard')
    setSelectedStudentId(null)
    setLoggedIn(true)
  }

  async function saveLiveGrades(
    rows: Array<{ studid: string; subjcode: string; prelim1: string; prelim2: string; prelim3: string; prelim4: string; remarks: string }>,
  ) {
    if (!liveMode || !window.serms) return false
    const result = await window.serms.live.saveGrades({
      sy: term.ay,
      sem: term.sem || '1',
      rows,
    })
    if (!result.ok) {
      notify('Grade save failed', result.message, 'warning')
      return false
    }
    const refreshed = await window.serms.live.refresh()
    if (refreshed.ok) {
      setStudents(refreshed.students)
      setEnrollments(refreshed.enrollments)
      setPayments(refreshed.payments)
      setTerm(refreshed.term)
      setLiveStats(refreshed.stats)
    }
    notify(
      'Grades saved to the school database',
      `${result.updated} row${result.updated === 1 ? '' : 's'} updated in srgb.registration.`,
      'neutral',
    )
    return true
  }

  async function exitLive() {
    await window.serms?.live.disconnect()
    setStudents(demoStudents)
    setEnrollments(demoEnrollments)
    setPayments(demoPayments)
    setFacultyProfile(null)
    setTerm(currentTerm)
    setLiveStats(null)
    setLiveAssessmentLines({})
    setAssessmentLoading({})
    setLiveMode(false)
    setNav('dashboard')
    setSelectedStudentId(null)
    setPaymentStudent(null)
    setReceipt(null)
    notify('Back to demo data', 'Live connection closed. No records were changed.', 'neutral')
  }

  function navigate(key: NavKey) {
    if (!canAccess(role, key)) {
      notify('Not available for this role', `Switch to a role with access to ${key}.`, 'warning')
      return
    }
    if (liveMode && key !== 'students' && key !== 'dashboard' && key !== 'cashier' && key !== 'classes') {
      notify('Live preview is limited', 'Only overview, students, classes, and the read-only cashier are available live.', 'warning')
      return
    }
    setNav(key)
    setSelectedStudentId(null)
  }

  async function loadAssessmentFor(id: string) {
    if (!liveMode || !window.serms || liveAssessmentLines[id]) return
    setAssessmentLoading((current) => ({ ...current, [id]: true }))
    const result = await window.serms.live.assessment(id)
    if (result.ok) {
      setLiveAssessmentLines((current) => ({ ...current, [id]: result.lines }))
    } else {
      notify('Assessment not loaded', result.message, 'warning')
    }
    setAssessmentLoading((current) => ({ ...current, [id]: false }))
  }

  function openStudent(id: string) {
    setSelectedStudentId(id)
    setNav('students')
    void loadAssessmentFor(id)
  }

  function openPayment(student: Student) {
    if (liveMode) {
      notify('Read-only live preview', 'Payment posting is disabled until the live write path is validated.', 'warning')
      return
    }
    setPaymentStudent(student)
  }

  function addStudent(student: Student) {
    if (liveMode) {
      notify('Read-only live preview', 'Adding students is disabled in the live preview.', 'warning')
      return
    }
    setStudents((current) => [student, ...current])
    notify('Student created', `${fullName(student)} · ${student.id}`)
  }

  function updateStudent(student: Student) {
    if (liveMode) {
      notify('Read-only live preview', 'Editing students is disabled in the live preview.', 'warning')
      return
    }
    setStudents((current) => current.map((item) => (item.id === student.id ? student : item)))
    notify('Student record updated', `${fullName(student)} · ${student.id}`)
  }

  function recordPayment(amount: number, paycode: string, fund: string) {
    if (liveMode) {
      notify('Read-only live preview', 'Payment posting is disabled until the live write path is validated.', 'warning')
      return
    }
    if (!paymentStudent) return
    const year = new Date().getFullYear()
    const orno = `OR-${year}-${String(48000 + payments.length)}`
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      orno,
      studentId: paymentStudent.id,
      studentName: fullName(paymentStudent),
      date: todayIso(),
      amount,
      paycode,
      fund,
      cashier: 'A. Ramirez',
      status: 'Posted',
    }
    const nextStudent: Student = {
      ...paymentStudent,
      amountPaid: paymentStudent.amountPaid + amount,
      balance: Math.max(0, paymentStudent.balance - amount),
    }
    setStudents((current) => current.map((student) => (student.id === nextStudent.id ? nextStudent : student)))
    setPayments((current) => [payment, ...current])
    setPaymentStudent(null)
    setReceipt({ payment, student: nextStudent })
    notify('Payment posted', `${orno} · ${formatMoney(amount)} received from ${fullName(nextStudent)}.`)
  }

  function signOut() {
    void window.serms?.live.disconnect()
    setLoggedIn(false)
    setRole('Registrar')
    setNav('dashboard')
    setTerm(currentTerm)
    setStudents(demoStudents)
    setEnrollments(demoEnrollments)
    setPayments(demoPayments)
    setFacultyProfile(null)
    setLiveMode(false)
    setLiveStats(null)
    setLiveAssessmentLines({})
    setAssessmentLoading({})
    setSelectedStudentId(null)
    setCommandOpen(false)
    setPaymentStudent(null)
    setReceipt(null)
  }

  function changeRole(nextRole: Role) {
    setRole(nextRole)
    if (!canAccess(nextRole, nav)) {
      setNav('dashboard')
      setSelectedStudentId(null)
    }
  }

  useEffect(() => {
    if (!loggedIn) return
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [loggedIn])

  if (!loggedIn) {
    return <Login onDemo={openDemo} onLiveLogin={liveLogin} />
  }

  return (
    <>
      <AppShell
        role={role}
        nav={nav}
        term={term}
        live={liveMode}
        userName={role === 'Faculty' ? facultyProfile?.name : undefined}
        userDesk={role === 'Faculty' ? facultyProfile?.department : undefined}
        onExitLive={exitLive}
        onNavigate={navigate}
        onSearch={() => setCommandOpen(true)}
        onRoleChange={changeRole}
        onSignOut={signOut}
        onTermClick={() => notify('Term selector', 'Only the active term is available in the sample workspace.', 'neutral')}
        onHelp={() => notify('Quick guide', 'Start with the student search. Every record, action, and document lives in the student workspace.', 'neutral')}
      >
        {nav === 'dashboard' && (
          <Dashboard
            role={role}
            term={term}
            live={liveMode}
            liveStats={liveStats}
            students={students}
            payments={payments}
            activities={demoActivities}
            onOpenStudent={openStudent}
            onNavigate={navigate}
            onSearch={() => setCommandOpen(true)}
            onPayment={openPayment}
            onToast={notify}
          />
        )}

        {nav === 'students' &&
          (selectedStudent ? (
            <StudentWorkspace
              key={selectedStudent.id}
              student={selectedStudent}
              enrollments={enrollments.filter((entry) => entry.studentId === selectedStudent.id)}
              payments={payments.filter((payment) => payment.studentId === selectedStudent.id)}
              term={term}
              readOnly={liveMode}
              canWriteGrades={
                !liveMode || role === 'Registrar' || role === 'Administrator' || role === 'Faculty'
              }
              assessmentLines={liveMode ? liveAssessmentLines[selectedStudent.id] : undefined}
              assessmentLoading={liveMode ? Boolean(assessmentLoading[selectedStudent.id]) : false}
              classStudents={liveMode ? students : undefined}
              classEnrollments={liveMode ? enrollments : undefined}
              onBack={() => setSelectedStudentId(null)}
              onPayment={openPayment}
              onUpdateStudent={updateStudent}
              onSaveLiveGrades={saveLiveGrades}
              onToast={notify}
            />
          ) : (
            <Students
              students={students}
              readOnly={liveMode}
              onOpenStudent={openStudent}
              onPayment={openPayment}
              onAddStudent={addStudent}
              onToast={notify}
            />
          ))}

        {nav === 'classes' && (
          <FacultyClasses
            faculty={facultyProfile ?? (!liveMode && role === 'Faculty' ? demoFacultyProfile : null)}
            live={liveMode}
            term={term}
            onOpenStudent={openStudent}
            onToast={notify}
          />
        )}

        {nav === 'registration' && (
          <Registration
            students={students}
            offerings={offerings}
            term={term}
            onOpenStudent={openStudent}
            onPayment={openPayment}
            onToast={notify}
          />
        )}

        {nav === 'cashier' && (
          <Cashier
            students={students}
            payments={payments}
            readOnly={liveMode}
            onPayment={openPayment}
            onOpenStudent={openStudent}
            onToast={notify}
          />
        )}

        {nav === 'academics' && (
          <Academics
            offerings={offerings}
            faculty={faculty}
            students={students}
            enrollments={enrollments}
            onOpenStudent={openStudent}
            onToast={notify}
          />
        )}

        {nav === 'reports' && <Reports onToast={notify} />}

        {nav === 'administration' && (
          <Administration term={term} onUseLive={loadLive} onToast={notify} />
        )}
      </AppShell>

      <CommandPalette
        open={commandOpen}
        students={students}
        payments={payments}
        live={liveMode}
        onClose={() => setCommandOpen(false)}
        onStudent={(id) => {
          openStudent(id)
          setCommandOpen(false)
        }}
        onNavigate={(key) => {
          navigate(key)
          setCommandOpen(false)
        }}
        onAction={(action) => {
          if (action === 'payment') {
            const student = students.find((item) => item.balance > 0) ?? students[0]
            if (student) openPayment(student)
          } else {
            navigate('reports')
          }
        }}
      />

      <PaymentDialog
        open={Boolean(paymentStudent)}
        student={paymentStudent}
        term={term}
        readOnly={liveMode}
        onClose={() => setPaymentStudent(null)}
        onSubmit={recordPayment}
        onToast={notify}
      />

      <ReceiptDialog
        payment={receipt?.payment ?? null}
        student={receipt?.student ?? null}
        onClose={() => setReceipt(null)}
        onToast={notify}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  )
}
