import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, Wifi, UserRound } from 'lucide-react'
import { roles, type Role } from '../types'
import { classNames } from '../lib/format'

export default function Login({
  onDemo,
  onLiveLogin,
}: {
  onDemo: (role: Role) => void
  onLiveLogin: (
    credentials: { username: string; password: string },
    role: Role,
  ) => Promise<{ ok: boolean; message?: string }>
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>('Registrar')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter your username and password to continue.')
      return
    }
    if (!window.serms) {
      setError('Live sign-in is available in the desktop app. Use Open demo to review the interface.')
      return
    }
    setError('')
    setLoading(true)
    const result = await onLiveLogin({ username, password }, role)
    setLoading(false)
    if (!result.ok) {
      setError(result.message || 'The school server could not sign you in.')
    }
  }

  function demo() {
    setError('')
    onDemo(role)
  }

  return (
    <main className="login">
      <section className="login__story" aria-label="About SERMS Modern">
        <div className="login__brand">
          <img src="./spc-logo.jpg" alt="St. Peter's College seal" />
          <div>
            <div className="login__school">St. Peter’s College</div>
            <div className="login__place">Iligan City</div>
          </div>
        </div>

        <div className="login__story-inner">
          <div className="login__kicker">Student Enrolment & Records</div>
          <h1 className="login__title">
            Every record,
            <br />
            in its <em>right place.</em>
          </h1>
          <p className="login__lede">
            A calmer, clearer way to enrol students, assess fees, collect payments, and keep
            academic records moving.
          </p>

          <div className="login__features">
            <div className="login__feature">
              <span>
                <ShieldCheck size={13} />
              </span>
              <div>
                <strong>One student record.</strong> Enrollment, assessment, payments, and grades
                in one workspace.
              </div>
            </div>
            <div className="login__feature">
              <span>
                <UserRound size={13} />
              </span>
              <div>
                <strong>Built around the desk.</strong> Fewer screens, faster lookups, and clear
                next steps for every role.
              </div>
            </div>
            <div className="login__feature">
              <span>
                <Wifi size={13} />
              </span>
              <div>
                <strong>School network only.</strong> Live records stay on the campus PostgreSQL
                server, exactly as they do today.
              </div>
            </div>
          </div>
        </div>

        <div className="login__story-footer">
          <span>Student Enrolment and Records Management System</span>
          <span>3.0 · Modern front end</span>
        </div>
      </section>

      <section className="login__panel">
        <div className="login__form-wrap">
          <div className="login__eyebrow">Welcome back</div>
          <h2 className="login__form-title">Sign in to SERMS</h2>
          <p className="login__form-sub">
            Use your school account. The demo workspace is available below for reviewing the new
            interface.
          </p>

          <div className="login__network">
            <Wifi size={15} />
            <div>
              <strong>Live data requires the school network.</strong>
              <br />
              This preview runs on sample records and does not change the database.
            </div>
          </div>

          <form className="login__form" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="username">Username</label>
              <div className="input-wrap">
                <UserRound size={15} />
                <input
                  id="username"
                  className="input"
                  autoComplete="username"
                  placeholder="e.g. registrar"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    setError('')
                  }}
                  aria-invalid={error ? true : undefined}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <LockKeyhole size={15} />
                <input
                  id="password"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  aria-invalid={error ? true : undefined}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  className="icon-button"
                  style={{ position: 'absolute', right: 2, width: 34, height: 34 }}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="login__row">
              <label className="login__remember">
                <input type="checkbox" defaultChecked />
                Keep me signed in
              </label>
              <button type="button" className="login__link" onClick={() => setError('Password resets are handled by the system administrator.')}>
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <button className="btn btn--primary btn--lg login__submit" type="submit" disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : null}
              {loading ? 'Connecting…' : 'Sign in to school records'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="login__demo">
            <div>
              <p>
                <strong>Just reviewing the design?</strong>
                Open the sample workspace with a role of your choice.
              </p>
              <div className="login__role-select" role="group" aria-label="Demo role">
                {roles.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={classNames('login__role')}
                    aria-pressed={role === item}
                    onClick={() => setRole(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="btn btn--secondary login__demo-btn" onClick={demo}>
              Open demo
              <ArrowRight size={14} />
            </button>
          </div>

          <p className="login__copyright">
            © {new Date().getFullYear()} St. Peter’s College · Iligan City. Sample data only.
            <br />
            Based on SERMS 3.0.2.11.
          </p>
        </div>
      </section>
    </main>
  )
}
