import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  ReceiptText,
  Search,
  Settings2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import type { NavKey, Payment, Role, Student } from '../types'
import { formatDate, formatMoney, fullName } from '../lib/format'
import { canAccess } from './AppShell'

interface CommandPaletteProps {
  open: boolean
  students: Student[]
  payments: Payment[]
  role: Role
  live?: boolean
  onClose: () => void
  onStudent: (id: string) => void
  onNavigate: (key: NavKey) => void
  onAction: (action: 'payment' | 'reports') => void
}

const pageItems: Array<{ key: NavKey; label: string; meta: string }> = [
  { key: 'dashboard', label: 'Overview', meta: 'Today at a glance' },
  { key: 'students', label: 'Students', meta: 'Search student records' },
  { key: 'classes', label: 'My Classes', meta: 'Assigned subjects and rosters' },
  { key: 'registration', label: 'Registration', meta: 'Subject offering, advising, COR' },
  { key: 'cashier', label: 'Cashier', meta: 'Payments and collections' },
  { key: 'academics', label: 'Academics', meta: 'Grades and faculty load' },
  { key: 'reports', label: 'Reports', meta: 'Official documents and lists' },
  { key: 'administration', label: 'Administration', meta: 'Terms, fees, access' },
]

export default function CommandPalette({
  open,
  students,
  payments,
  role,
  live = false,
  onClose,
  onStudent,
  onNavigate,
  onAction,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => inputRef.current?.focus())
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const q = query.trim().toLowerCase()
  const matchedStudents = useMemo(() => {
    if (!q) return students.slice(0, 3)
    return students
      .filter((student) => {
        const haystack = `${fullName(student)} ${student.id} ${student.programName} ${student.program}`.toLowerCase()
        return haystack.includes(q)
      })
      .slice(0, 5)
  }, [q, students])

  const matchedPayments = useMemo(() => {
    if (!q) return []
    return payments
      .filter((payment) =>
        `${payment.orno} ${payment.studentName} ${payment.studentId} ${payment.paycode}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 4)
  }, [q, payments])

  const matchedPages = useMemo(() => {
    const available = pageItems
      .filter((item) => canAccess(role, item.key))
      .filter(
        (item) =>
          !live ||
          item.key === 'dashboard' ||
          item.key === 'students' ||
          item.key === 'cashier' ||
          item.key === 'classes',
      )
    if (!q) return available.slice(0, 4)
    return available.filter((item) => `${item.label} ${item.meta}`.toLowerCase().includes(q)).slice(0, 4)
  }, [q, live, role])

  const actions = useMemo(() => {
    const all = [
      {
        id: 'payment',
        label: 'Record a payment',
        meta: 'Open the cashier payment form',
        icon: CreditCard,
      },
      {
        id: 'reports',
        label: 'Generate a report',
        meta: 'Browse official reports',
        icon: FileText,
      },
    ] as const
    const available = live ? [] : all
    if (!q) return available
    return available.filter((item) => `${item.label} ${item.meta}`.toLowerCase().includes(q))
  }, [q, live])

  const total =
    matchedStudents.length + matchedPayments.length + matchedPages.length + actions.length

  useEffect(() => {
    setActive(0)
  }, [q])

  if (!open) return null

  function select(index: number) {
    if (index < matchedStudents.length) {
      onStudent(matchedStudents[index].id)
      onClose()
      return
    }
    const paymentIndex = index - matchedStudents.length
    if (paymentIndex < matchedPayments.length) {
      onStudent(matchedPayments[paymentIndex].studentId)
      onClose()
      return
    }
    const pageIndex = paymentIndex - matchedPayments.length
    if (pageIndex < matchedPages.length) {
      onNavigate(matchedPages[pageIndex].key)
      onClose()
      return
    }
    const action = actions[pageIndex - matchedPages.length]
    if (action) {
      onAction(action.id)
      onClose()
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((value) => (total === 0 ? 0 : (value + 1) % total))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((value) => (total === 0 ? 0 : (value - 1 + total) % total))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (total > 0) select(active)
    }
  }

  return createPortal(
    <div
      className="modal-backdrop command-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="command" role="dialog" aria-modal="true" aria-label="Search SERMS">
        <div className="command__input-wrap">
          <Search size={18} />
          <input
            ref={inputRef}
            className="command__input"
            placeholder="Search students, OR numbers, pages, or actions…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search students, OR numbers, pages, or actions"
            aria-controls="command-results"
          />
          <span className="command__esc">ESC</span>
        </div>

        <div className="command__results" id="command-results">
          {total === 0 && <div className="command__empty">No matches for “{query}”.</div>}

          {matchedStudents.length > 0 && (
            <>
              <div className="command__group-label">Students</div>
              {matchedStudents.map((student, index) => {
                const itemIndex = index
                return (
                  <button
                    key={student.id}
                    className={`command__item ${active === itemIndex ? 'command__item--active' : ''}`}
                    onMouseEnter={() => setActive(itemIndex)}
                    onClick={() => select(itemIndex)}
                  >
                    <span className="command__item-icon">
                      <UserRound size={14} />
                    </span>
                    <span className="command__item-copy">
                      <span className="command__item-title">{fullName(student)}</span>
                      <span className="command__item-meta">
                        {student.id} · {student.programName} · {student.year}
                      </span>
                    </span>
                    <ArrowRight size={13} color="#a39789" />
                  </button>
                )
              })}
            </>
          )}

          {matchedPayments.length > 0 && (
            <>
              <div className="command__group-label">Receipts</div>
              {matchedPayments.map((payment, index) => {
                const itemIndex = matchedStudents.length + index
                return (
                  <button
                    key={payment.id}
                    className={`command__item ${active === itemIndex ? 'command__item--active' : ''}`}
                    onMouseEnter={() => setActive(itemIndex)}
                    onClick={() => select(itemIndex)}
                  >
                    <span className="command__item-icon">
                      <ReceiptText size={14} />
                    </span>
                    <span className="command__item-copy">
                      <span className="command__item-title">
                        {payment.orno} · {payment.studentName}
                      </span>
                      <span className="command__item-meta">
                        {formatDate(payment.date)} · {payment.paycode} · {formatMoney(payment.amount)}
                      </span>
                    </span>
                    <ArrowRight size={13} color="#a39789" />
                  </button>
                )
              })}
            </>
          )}

          {matchedPages.length > 0 && (
            <>
              <div className="command__group-label">Go to</div>
              {matchedPages.map((page, index) => {
                const itemIndex = matchedStudents.length + matchedPayments.length + index
                const Icon =
                  page.key === 'dashboard'
                    ? LayoutDashboard
                    : page.key === 'students'
                      ? UsersRound
                      : page.key === 'registration'
                        ? BookOpen
                        : page.key === 'cashier'
                          ? CreditCard
                          : page.key === 'classes'
                            ? BookOpen
                          : page.key === 'academics'
                            ? GraduationCap
                            : page.key === 'reports'
                              ? Library
                              : Settings2
                return (
                  <button
                    key={page.key}
                    className={`command__item ${active === itemIndex ? 'command__item--active' : ''}`}
                    onMouseEnter={() => setActive(itemIndex)}
                    onClick={() => select(itemIndex)}
                  >
                    <span className="command__item-icon">
                      <Icon size={14} />
                    </span>
                    <span className="command__item-copy">
                      <span className="command__item-title">{page.label}</span>
                      <span className="command__item-meta">{page.meta}</span>
                    </span>
                    <ArrowRight size={13} color="#a39789" />
                  </button>
                )
              })}
            </>
          )}

          {actions.length > 0 && (
            <>
              <div className="command__group-label">Actions</div>
              {actions.map((action, index) => {
                const itemIndex =
                  matchedStudents.length + matchedPayments.length + matchedPages.length + index
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    className={`command__item ${active === itemIndex ? 'command__item--active' : ''}`}
                    onMouseEnter={() => setActive(itemIndex)}
                    onClick={() => select(itemIndex)}
                  >
                    <span className="command__item-icon">
                      <Icon size={14} />
                    </span>
                    <span className="command__item-copy">
                      <span className="command__item-title">{action.label}</span>
                      <span className="command__item-meta">{action.meta}</span>
                    </span>
                    <ArrowRight size={13} color="#a39789" />
                  </button>
                )
              })}
            </>
          )}
        </div>

        <div className="command__footer">
          <span>
            <kbd>Up</kbd>
            <kbd>Down</kbd> to navigate
          </span>
          <span>
            <kbd>Enter</kbd> to open
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
