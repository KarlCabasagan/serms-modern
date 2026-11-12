import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Database,
  FileKey2,
  GraduationCap,
  KeyRound,
  Landmark,
  ListChecks,
  Loader2,
  LockKeyhole,
  PlugZap,
  ReceiptText,
  Server,
  Settings2,
  ShieldCheck,
  UsersRound,
  XCircle,
} from 'lucide-react'
import type { Term } from '../types'
import { Badge, InfoStrip, Modal } from '../components/ui'
import { PageHeader } from '../components/AppShell'

type ConnectionState = 'idle' | 'testing' | 'ok' | 'error'

export default function Administration({
  term,
  onUseLive,
  onToast,
}: {
  term: Term
  onUseLive: (credentials: { username: string; password: string }) => Promise<boolean>
  onToast: (title: string, detail?: string) => void
}) {
  const [connectionOpen, setConnectionOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [liveLoading, setLiveLoading] = useState(false)
  const [serverVersion, setServerVersion] = useState('')
  const [preview, setPreview] = useState<{ students: number; enrolled: number; term: { sy: string; sem: string } | null } | null>(null)
  const [appConfig, setAppConfig] = useState<{ host: string; port: number; database: string } | null>(null)

  useEffect(() => {
    let alive = true
    window.serms?.appInfo().then((info) => {
      if (alive && info.config) setAppConfig(info.config)
    })
    return () => {
      alive = false
    }
  }, [])

  async function testConnection() {
    if (!window.serms) {
      setConnectionState('error')
      setConnectionMessage('Open the packaged desktop app to test the school server connection.')
      return
    }
    setConnectionState('testing')
    setConnectionMessage('Connecting to the school PostgreSQL server…')
    setServerVersion('')
    setPreview(null)
    const result = await window.serms.testDatabase({ username, password })
    setConnectionState(result.ok ? 'ok' : 'error')
    setConnectionMessage(result.message)
    setServerVersion(result.serverVersion ?? '')
    setPreview(result.preview ?? null)
  }
  const cards = [
    { title: 'Academic term', description: 'School year, semester, enrollment locks, and grading dates.', icon: CalendarRange, status: `${term.ay} · ${term.semester}`, action: 'Manage term' },
    { title: 'Programs & curricula', description: 'Programs, majors, year levels, and subject requirements.', icon: GraduationCap, status: '42 programs · 8 colleges', action: 'Open programs' },
    { title: 'Fees & matrices', description: 'Tuition, miscellaneous, laboratory, and entrance fee matrices.', icon: Landmark, status: 'Active matrices for 2026–2027', action: 'Review fees' },
    { title: 'Users & roles', description: 'School accounts, desk assignments, and access per module.', icon: UsersRound, status: '206 accounts · 13 roles', action: 'Manage access' },
    { title: 'Receipt ranges', description: 'Official receipt series assigned to the cashier and the school.', icon: ReceiptText, status: 'SPC and cashier ranges', action: 'View ranges' },
    { title: 'Grade lock', description: 'Semester and subject locks that stop grade edits after submission.', icon: LockKeyhole, status: 'First semester open', action: 'Check locks' },
    { title: 'Audit trail', description: 'Registration, collection, and logon history for review.', icon: ListChecks, status: 'Available in the database phase', action: 'Open audit' },
    { title: 'Database connection', description: 'The live PostgreSQL server is reachable only on the school network.', icon: Database, status: 'Demo data · not connected', action: 'Connection details' },
    { title: 'Backups & recovery', description: 'Backup schedule and restore status for the school server.', icon: ShieldCheck, status: 'Managed by MIS', action: 'View policy' },
  ]

  return (
    <div className="page">
      <PageHeader
        eyebrow="System administration"
        title="Administration"
        subtitle="The settings that keep registration, cashiering, and academic records consistent."
        actions={
          <>
            <button className="btn btn--secondary" onClick={() => onToast('System settings', 'Settings are read from the school database in the live build.')}>
              <Settings2 size={14} />
              System settings
            </button>
            <button className="btn btn--primary" onClick={() => onToast('Add user', 'User creation opens when connected to the live server.')}>
              <UsersRound size={14} />
              Add user
            </button>
          </>
        }
      />

      <div className="info-strip mb-4" style={{ alignItems: 'center' }}>
        <ShieldCheck size={15} />
        <div style={{ flex: 1 }}>
          <strong>Same connection, no new upload service.</strong> The modern UI reads and writes the
          same PostgreSQL database as SERMS 3.0.2.11. Grades, assessments, and payments go directly
          to the school server; this app does not invent a separate API or sync step.
        </div>
        <button
          className="btn btn--secondary btn--sm"
          onClick={() => {
            setConnectionOpen(true)
            setConnectionState('idle')
            setConnectionMessage('')
          }}
        >
          <PlugZap size={12} />
          Test connection
        </button>
      </div>

      <div className="admin-grid">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article className="admin-card" key={card.title}>
              <div className="admin-card__top">
                <span className="admin-card__icon">
                  <Icon size={16} />
                </span>
                {card.title === 'Database connection' && <Badge tone="pending">Demo</Badge>}
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className="admin-card__foot">
                <span>{card.status}</span>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    if (card.title === 'Database connection') {
                      setConnectionOpen(true)
                      setConnectionState('idle')
                      setConnectionMessage('')
                    } else {
                      onToast(card.title, `${card.action} is planned for the live database phase.`)
                    }
                  }}
                >
                  {card.action}
                  <ArrowRight size={11} />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="detail-grid mt-4">
        <section className="card">
          <div className="card__head">
            <div>
              <h3>Active term</h3>
              <p>The term that controls registration and cashiering</p>
            </div>
            <CalendarRange size={16} color="#a9822e" />
          </div>
          <div className="card__body">
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-row__label">School year</span>
                <span className="detail-row__value detail-row__value--strong">{term.ay}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row__label">Semester</span>
                <span className="detail-row__value">{term.semester}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row__label">Registration</span>
                <span className="detail-row__value">
                  <Badge tone="enrolled">Open</Badge>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-row__label">Grade entry</span>
                <span className="detail-row__value">
                  <Badge tone="pending">Open until lock date</Badge>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-row__label">Assessment control</span>
                <span className="detail-row__value">Registrar and Accounting</span>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__head">
            <div>
              <h3>Access model</h3>
              <p>Roles that already exist in the database</p>
            </div>
            <KeyRound size={16} color="#a9822e" />
          </div>
          <div className="card__body">
            <div className="detail-list">
              {[
                ['Registrar', 'Students, COR, assessment, reports'],
                ['Cashier', 'Payments, receipts, collections'],
                ['Accounting', 'Assessment, collections, income reports'],
                ['Faculty', 'Grade sheets, class lists, load'],
                ['Administrator', 'Term, fees, users, locks'],
              ].map(([role, scope]) => (
                <div className="detail-row" key={role}>
                  <span className="detail-row__label">{role}</span>
                  <span className="detail-row__value">{scope}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card__footer">
            <span className="muted" style={{ fontSize: 10 }}>
              The live build maps these to the existing PostgreSQL roles.
            </span>
            <button className="section-heading__link" onClick={() => onToast('Role matrix', 'A full permissions matrix will be documented with the database phase.')}>
              View matrix
            </button>
          </div>
        </section>
      </div>

      <div className="mt-4">
        <InfoStrip>
          <FileKey2 size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: -2 }} />
          Student photos use the existing FTP photo store. The demo does not include photo uploads;
          the live build will keep the same destination and move the credentials into configuration.
        </InfoStrip>
      </div>

      {connectionOpen && (
        <Modal
          eyebrow="School network"
          title="School server connection"
          subtitle="Test the same PostgreSQL server used by the current SERMS. This does not switch the demo to live data."
          onClose={() => setConnectionOpen(false)}
          footer={
            <>
              <button className="btn btn--secondary" onClick={() => setConnectionOpen(false)}>
                Close
              </button>
              <button
                className="btn btn--secondary"
                onClick={testConnection}
                disabled={connectionState === 'testing' || !username || !password}
              >
                {connectionState === 'testing' ? <Loader2 size={14} className="spin" /> : <PlugZap size={14} />}
                Test connection
              </button>
              {connectionState === 'ok' && (
                <button
                  className="btn btn--primary"
                  disabled={liveLoading}
                  onClick={async () => {
                    setLiveLoading(true)
                    const opened = await onUseLive({ username, password })
                    setLiveLoading(false)
                    if (opened) setConnectionOpen(false)
                  }}
                >
                  {liveLoading ? <Loader2 size={14} className="spin" /> : <Database size={14} />}
                  Open live records
                </button>
              )}
            </>
          }
        >
          <div className="info-strip" style={{ marginBottom: 14 }}>
            <Server size={14} />
            <div>
              {appConfig ? (
                <>
                  <strong>{appConfig.database}</strong> at {appConfig.host}:{appConfig.port} · read
                  from <strong>srgb.ini</strong>
                </>
              ) : (
                <>No <strong>srgb.ini</strong> found. The packaged app expects it beside the executable.</>
              )}
            </div>
          </div>

          <div className="form-grid">
            <div className="form-grid form-grid--two">
              <div className="field">
                <label htmlFor="db-username">PostgreSQL username</label>
                <input
                  id="db-username"
                  className="input"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    setConnectionState('idle')
                  }}
                  placeholder="e.g. registrar"
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="db-password">Password</label>
                <input
                  id="db-password"
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setConnectionState('idle')
                  }}
                  placeholder="School account password"
                />
              </div>
            </div>

            {connectionState !== 'idle' && (
              <div
                className="info-strip"
                style={{
                  borderColor:
                    connectionState === 'ok'
                      ? '#cfe5d9'
                      : connectionState === 'error'
                        ? '#efcccc'
                        : undefined,
                  background:
                    connectionState === 'ok'
                      ? 'var(--green-bg)'
                      : connectionState === 'error'
                        ? 'var(--red-bg)'
                        : undefined,
                  color:
                    connectionState === 'ok'
                      ? 'var(--green)'
                      : connectionState === 'error'
                        ? 'var(--red)'
                        : undefined,
                }}
                role="status"
              >
                {connectionState === 'testing' ? (
                  <Loader2 size={14} className="spin" />
                ) : connectionState === 'ok' ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <XCircle size={14} />
                )}
                <div>
                  {connectionMessage}
                  {serverVersion && <div style={{ marginTop: 2, fontSize: 9.5 }}>{serverVersion}</div>}
                  {preview && (
                    <div style={{ marginTop: 4, fontSize: 10 }}>
                      {preview.students.toLocaleString()} student records ·{' '}
                      {preview.enrolled.toLocaleString()} enrolled
                      {preview.term
                        ? ` · SY ${preview.term.sy} · term ${preview.term.sem}`
                        : ' · no current term set'}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="field__hint">
              Credentials are used for this connection only and are not written to disk. The live
              preview is read-only: student lookup and inspection are enabled; posting payments,
              editing students, and saving grades are disabled.
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
