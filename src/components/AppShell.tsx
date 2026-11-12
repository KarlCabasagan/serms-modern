import { useState, type ReactNode } from 'react'
import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import type { NavKey, Role, Term } from '../types'
import { classNames } from '../lib/format'

interface NavItem {
  key: NavKey
  label: string
  icon: typeof LayoutDashboard
  hint: string
}

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Workspace',
    items: [
      { key: 'dashboard', label: 'Overview', icon: LayoutDashboard, hint: 'Today at a glance' },
      { key: 'students', label: 'Students', icon: UsersRound, hint: 'Search student records' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'registration', label: 'Registration', icon: ClipboardList, hint: 'Offering, advising, COR' },
      { key: 'cashier', label: 'Cashier', icon: CreditCard, hint: 'Payments and collections' },
      { key: 'academics', label: 'Academics', icon: GraduationCap, hint: 'Grades and faculty load' },
    ],
  },
  {
    label: 'Insights',
    items: [{ key: 'reports', label: 'Reports', icon: Library, hint: 'Official documents and lists' }],
  },
  {
    label: 'System',
    items: [
      { key: 'administration', label: 'Administration', icon: Settings2, hint: 'Terms, fees, access' },
    ],
  },
]

export const navLabels: Record<NavKey, string> = {
  dashboard: 'Overview',
  students: 'Students',
  registration: 'Registration',
  cashier: 'Cashier',
  academics: 'Academics',
  reports: 'Reports',
  administration: 'Administration',
}

const accessByRole: Record<Role, NavKey[]> = {
  Registrar: ['dashboard', 'students', 'registration', 'academics', 'reports'],
  Cashier: ['dashboard', 'students', 'cashier', 'reports'],
  Faculty: ['dashboard', 'students', 'academics', 'reports'],
  Accounting: ['dashboard', 'students', 'cashier', 'academics', 'reports'],
  Administrator: ['dashboard', 'students', 'registration', 'cashier', 'academics', 'reports', 'administration'],
}

export function canAccess(role: Role, key: NavKey): boolean {
  return accessByRole[role].includes(key)
}

const userForRole: Record<Role, { name: string; desk: string }> = {
  Registrar: { name: 'Clarita G.', desk: "Registrar's Office" },
  Cashier: { name: 'Ana R.', desk: 'Cashiering' },
  Faculty: { name: 'Prof. J. Abellanosa', desk: 'Computer Studies' },
  Accounting: { name: 'Mila A.', desk: 'Accounting' },
  Administrator: { name: 'System Admin', desk: 'Management Information Systems' },
}

export function AppShell({
  role,
  nav,
  term,
  live = false,
  children,
  onNavigate,
  onSearch,
  onRoleChange,
  onSignOut,
  onTermClick,
  onHelp,
  onExitLive,
}: {
  role: Role
  nav: NavKey
  term: Term
  live?: boolean
  children: ReactNode
  onNavigate: (key: NavKey) => void
  onSearch: () => void
  onRoleChange: (role: Role) => void
  onSignOut: () => void
  onTermClick: () => void
  onHelp: () => void
  onExitLive?: () => void
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const allowed = accessByRole[role].filter(
    (key) => !live || key === 'students' || key === 'dashboard' || key === 'cashier',
  )
  const user = userForRole[role]

  function go(key: NavKey) {
    onNavigate(key)
    setMobileOpen(false)
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {mobileOpen && (
        <div className="sidebar__scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside className={classNames('sidebar', mobileOpen && 'sidebar--open')} aria-label="Primary navigation">
        <div className="sidebar__brand">
          <img className="sidebar__logo" src="./spc-logo.jpg" alt="" />
          <div className="sidebar__brand-text">
            <div className="sidebar__name">SERMS</div>
            <div className="sidebar__sub">St. Peter’s College</div>
          </div>
        </div>

        <button className="sidebar__term" onClick={onTermClick} title="Change academic term">
          <span className="sidebar__term-icon">
            <CalendarDays size={15} />
          </span>
          <span className="sidebar__term-copy">
            <span className="sidebar__term-label">Active term</span>
            <span className="sidebar__term-value">{term.semester}</span>
            <span className="sidebar__term-year">AY {term.ay}</span>
          </span>
          <ChevronDown size={14} />
        </button>

        <nav className="sidebar__nav" aria-label="Sections">
          {navGroups.map((group) => {
            const items = group.items.filter((item) => allowed.includes(item.key))
            if (items.length === 0) return null
            return (
              <div key={group.label}>
                <div className="sidebar__section">{group.label}</div>
                <div className="sidebar__nav">
                  {items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.key}
                        className={classNames('nav-item', nav === item.key && 'nav-item--active')}
                        onClick={() => go(item.key)}
                        aria-current={nav === item.key ? 'page' : undefined}
                        title={item.hint}
                      >
                        <Icon size={17} strokeWidth={1.8} />
                        <span>{item.label}</span>
                        {item.key === 'students' && !live && (
                          <span className="nav-item__badge">1,331</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="sidebar__spacer" />

        <div className="sidebar__help">
          <div className="sidebar__help-title">
            <CircleHelp size={13} />
            A quieter way to work
          </div>
          <p>Every action is grouped around the student, so the record stays in view.</p>
          <button onClick={onHelp}>See the quick guide</button>
        </div>

        <div className="sidebar__user">
          <span className="avatar avatar--sm">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
          <div className="sidebar__user-copy">
            <div className="sidebar__user-name">{user.name}</div>
            <div className="sidebar__user-role">{user.desk}</div>
          </div>
          <button className="icon-button" onClick={onSignOut} title="Sign out" aria-label="Sign out" style={{ width: 30, height: 30 }}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button
            className="icon-button topbar__mobile"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div className="topbar__crumbs">
            <span>SERMS</span>
            <span aria-hidden="true">/</span>
            <span className="topbar__crumb-current">{navLabels[nav]}</span>
          </div>

          <div className="topbar__spacer" />

          <button className="topbar__search" onClick={onSearch} aria-label="Search students and actions">
            <Search size={15} />
            <span>Search students, OR, actions…</span>
            <kbd>Ctrl K</kbd>
          </button>

          <span className={classNames('topbar__status', live && 'topbar__status--live')}>
            {live ? 'Live · school data · dbspc' : 'Demo data · school network not connected'}
          </span>

          <div className="role-switch" title="Switch demo role">
            <ShieldCheck size={13} color="#8f6b1f" />
            <select
              aria-label="Demo role"
              value={role}
              onChange={(event) => onRoleChange(event.target.value as Role)}
            >
              {Object.keys(accessByRole).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button
            className="icon-button icon-button__dot icon-button--bordered"
            onClick={() => onHelp()}
            aria-label="Notifications"
            title="Notifications"
          >
            <BookOpenCheck size={16} />
          </button>

          <button className="icon-button" onClick={onSignOut} title="Sign out" aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </header>

        {live && (
          <div className="live-banner">
            <span className="live-banner__dot" />
            <div>
              <strong>Live school data.</strong> Student records, payments, and grades are real.
              Payment posting and student edits are disabled. Grade entry is available from the
              Grades tab and writes only after an explicit confirmation.
            </div>
            <button className="btn btn--secondary btn--sm" onClick={onExitLive}>
              Return to demo
            </button>
          </div>
        )}

        <main id="main-content">{children}</main>
      </div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string
  title: ReactNode
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="page-header">
      <div className="page-header__copy">
        <div className="page-header__eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function EmptyAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="btn btn--secondary btn--sm" onClick={onClick}>
      {label}
      <ArrowUpRight size={13} />
    </button>
  )
}
