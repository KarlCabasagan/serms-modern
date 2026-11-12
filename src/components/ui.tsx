import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Info, X } from 'lucide-react'
import { classNames } from '../lib/format'
import type { ToastMessage } from '../types'

export function Avatar({
  name,
  size = 'sm',
  gold = false,
}: {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  gold?: boolean
}) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase()
  return (
    <span
      className={classNames('avatar', `avatar--${size}`, gold && 'avatar--gold')}
      aria-hidden="true"
    >
      {letters}
    </span>
  )
}

const badgeTone: Record<string, string> = {
  Enrolled: 'enrolled',
  Posted: 'posted',
  Complete: 'complete',
  Unregistered: 'unregistered',
  Pending: 'pending',
  Graduating: 'graduating',
  'On leave': 'onleave',
  Dropped: 'dropped',
  Cancelled: 'cancelled',
  Refunded: 'refunded',
  Overload: 'overload',
  Info: 'info',
  Neutral: 'neutral',
}

export function Badge({
  children,
  tone,
  noDot = false,
}: {
  children: ReactNode
  tone?: string
  noDot?: boolean
}) {
  const key = tone ?? String(children)
  return (
    <span className={classNames('badge', `badge--${badgeTone[key] ?? 'neutral'}`, noDot && 'badge--no-dot')}>
      {children}
    </span>
  )
}

export function Modal({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  onClose,
  size = 'default',
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  size?: 'default' | 'wide' | 'sm'
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => focusable()[0]?.focus())

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      previous?.focus?.()
    }
  }, [])

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={classNames('modal', size === 'wide' && 'modal--wide', size === 'sm' && 'modal--sm')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <div className="modal__head">
          <div>
            {eyebrow && <div className="modal__eyebrow">{eyebrow}</div>}
            <h2 className="modal__title" id={titleId}>
              {title}
            </h2>
            {subtitle && <p className="modal__sub">{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={17} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Toast({ message, onClose }: { message: ToastMessage; onClose: () => void }) {
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const timer = window.setTimeout(() => closeRef.current(), 4800)
    return () => window.clearTimeout(timer)
  }, [message.id])

  return (
    <div
      className={classNames('toast', message.tone && `toast--${message.tone}`)}
      role="status"
      aria-live="polite"
    >
      <span className="toast__icon">
        {message.tone === 'warning' ? <Info size={15} /> : <CheckCircle2 size={15} />}
      </span>
      <div className="toast__copy">
        <div className="toast__title">{message.title}</div>
        {message.detail && <div className="toast__detail">{message.detail}</div>}
      </div>
      <button className="toast__close" onClick={onClose} aria-label="Dismiss notification">
        <X size={13} />
      </button>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function InfoStrip({ children }: { children: ReactNode }) {
  return (
    <div className="info-strip">
      <Info size={14} />
      <div>{children}</div>
    </div>
  )
}
