import { useState } from 'react'
import Icon from './Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err.message || 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <section className="login-visual">
        <div className="orb orb--one" />
        <div className="orb orb--two" />
        <div className="orb orb--three" />
        <div className="grid-glow" />

        <div className="login-visual__inner">
          <div className="brand brand--lg">
            <span className="brand-mark">
              <Icon name="target" size={24} strokeWidth={2} />
            </span>
            <span className="brand-name">
              Job<span>Lens</span>
            </span>
          </div>

          <div className="login-headline">
            <p className="eyebrow">
              <Icon name="sparkles" size={14} /> Fresher hiring intelligence
            </p>
            <h1>
              Every fresher role,
              <br />
              <span className="gradient-text">in one clear view.</span>
            </h1>
            <p className="login-lede">
              A private admin console for the LinkedIn job dataset — explore role tracks,
              companies, freshness and search coverage without the noise.
            </p>
          </div>

          <ul className="feature-list">
            <li>
              <span className="feature-icon">
                <Icon name="layers" size={17} />
              </span>
              <div>
                <strong>Live dataset mirror</strong>
                <span>MongoDB seeded 1:1 from the collected JSON</span>
              </div>
            </li>
            <li>
              <span className="feature-icon">
                <Icon name="chart" size={17} />
              </span>
              <div>
                <strong>Role &amp; freshness analytics</strong>
                <span>See which tracks and locations are moving fastest</span>
              </div>
            </li>
            <li>
              <span className="feature-icon">
                <Icon name="lock" size={17} />
              </span>
              <div>
                <strong>Admin-only access</strong>
                <span>Signed sessions with protected API routes</span>
              </div>
            </li>
          </ul>

          <div className="login-chips">
            <span className="glass-chip">
              <Icon name="briefcase" size={15} /> 45 listings
            </span>
            <span className="glass-chip">
              <Icon name="building" size={15} /> 29 companies
            </span>
            <span className="glass-chip">
              <Icon name="clock" size={15} /> Past 24 hours
            </span>
          </div>

          <div className="login-preview">
            <div className="login-preview__head">
              <span>
                <Icon name="zap" size={13} /> Collection snapshot
              </span>
              <span className="live-chip live-chip--sm">
                <span className="dot dot--live" /> Live
              </span>
            </div>
            <div className="login-preview__grid">
              <div>
                <strong>45</strong>
                <span>Roles</span>
              </div>
              <div>
                <strong>29</strong>
                <span>Companies</span>
              </div>
              <div>
                <strong>6</strong>
                <span>Tracks</span>
              </div>
              <div>
                <strong>75%</strong>
                <span>Coverage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card__head">
            <span className="lock-badge">
              <Icon name="lock" size={18} />
            </span>
            <h2>Admin sign in</h2>
            <p>Use your administrator credentials to open the console.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="field">
              <span className="field__label">Username</span>
              <span className="input-wrap">
                <Icon name="user" size={18} className="input-icon" />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </span>
            </label>

            <label className="field">
              <span className="field__label">Password</span>
              <span className="input-wrap">
                <Icon name="lock" size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </span>
            </label>

            {error ? (
              <div className="form-error" role="alert">
                <Icon name="alert" size={16} /> {error}
              </div>
            ) : null}

            <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Signing in…
                </>
              ) : (
                <>
                  Open dashboard <Icon name="arrowUpRight" size={18} />
                </>
              )}
            </button>
          </form>

          <div className="credential-hint">
            <div className="credential-hint__icon">
              <Icon name="sparkles" size={16} />
            </div>
            <div>
              <strong>Demo credentials</strong>
              <p>
                Username <code>admin</code> · Password <code>admin123</code>
              </p>
            </div>
          </div>

          <p className="login-foot">
            <Icon name="lock" size={13} /> Protected console · session expires in 12 hours
          </p>
        </div>
      </section>
    </div>
  )
}
