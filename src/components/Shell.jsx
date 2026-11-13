import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api, formatDate, initials, avatarColors } from '../lib/api.js'
import Overview from '../pages/Overview.jsx'
import Jobs from '../pages/Jobs.jsx'
import Analytics from '../pages/Analytics.jsx'
import Dataset from '../pages/Dataset.jsx'
import JobDrawer from './JobDrawer.jsx'

const NAV = [
  { id: 'overview', label: 'Overview', icon: 'grid', caption: 'Market snapshot' },
  { id: 'jobs', label: 'Job listings', icon: 'briefcase', caption: 'All collected roles' },
  { id: 'analytics', label: 'Analytics', icon: 'chart', caption: 'Role & location insight' },
  { id: 'dataset', label: 'Dataset', icon: 'database', caption: 'Source & coverage' },
]

const TITLES = {
  overview: { title: 'Overview', sub: "A calm read on today's fresher market." },
  jobs: { title: 'Job listings', sub: 'Browse and filter every collected role.' },
  analytics: { title: 'Analytics', sub: 'Role, location and freshness breakdowns.' },
  dataset: { title: 'Dataset & coverage', sub: 'Provenance, filters and search status.' },
}

export default function Shell() {
  const { user, logout } = useAuth()
  const [page, setPage] = useState('overview')
  const [refreshKey, setRefreshKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeJob, setActiveJob] = useState(null)
  const [search, setSearch] = useState('')
  const [jobSeed, setJobSeed] = useState({ q: '', key: 0 })
  const [dataset, setDataset] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const refreshTimer = useRef(null)

  useEffect(() => {
    let cancelled = false
    api('/api/dataset')
      .then((data) => {
        if (!cancelled) setDataset(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  useEffect(() => () => clearTimeout(refreshTimer.current), [])

  function navigate(nextPage) {
    setPage(nextPage)
    setSidebarOpen(false)
  }

  function handleSearch(event) {
    event.preventDefault()
    setJobSeed({ q: search.trim(), key: Date.now() })
    setPage('jobs')
    setSidebarOpen(false)
  }

  function handleRefresh() {
    setRefreshing(true)
    setRefreshKey((value) => value + 1)
    clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => setRefreshing(false), 900)
  }

  const meta = TITLES[page]
  const total = dataset?.total_listings ?? dataset?.result_count

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar__brand">
          <div className="brand">
            <span className="brand-mark">
              <Icon name="target" size={20} strokeWidth={2} />
            </span>
            <span className="brand-name">
              Job<span>Lens</span>
            </span>
          </div>
          <button className="icon-btn sidebar__close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <Icon name="x" size={18} />
          </button>
          <span className="sidebar__tag">Admin console</span>
        </div>

        <nav className="nav">
          <span className="nav__label">Workspace</span>
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav__item ${page === item.id ? 'is-active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <span className="nav__icon">
                <Icon name={item.icon} size={19} />
              </span>
              <span className="nav__text">
                <strong>{item.label}</strong>
                <small>{item.caption}</small>
              </span>
              {item.id === 'jobs' && total ? <span className="nav__badge">{total}</span> : null}
              {page === item.id ? <span className="nav__active-bar" /> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar__spacer" />

        <div className="dataset-card">
          <div className="dataset-card__head">
            <span className="dot dot--live" />
            <span>LinkedIn dataset</span>
          </div>
          <p className="dataset-card__value">{total ? `${total} listings` : 'Synced'}</p>
          <p className="dataset-card__meta">
            <Icon name="calendar" size={13} /> {formatDate(dataset?.collected_at)}
          </p>
          <div className="dataset-card__bar">
            <span style={{ width: dataset ? '100%' : '35%' }} />
          </div>
        </div>

        <div className="sidebar__user">
          <span className="user-avatar" style={avatarColors(user?.name || 'admin')}>
            {initials(user?.name || 'Administrator')}
          </span>
          <span className="user-meta">
            <strong>{user?.name || 'Administrator'}</strong>
            <small>{user?.role === 'admin' ? 'Super admin' : user?.role}</small>
          </span>
          <button className="icon-btn" onClick={logout} title="Sign out" aria-label="Sign out">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      {sidebarOpen ? <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} /> : null}

      <div className="main">
        <div className={`refresh-line ${refreshing ? 'is-active' : ''}`} />
        <header className="topbar">
          <div className="topbar__left">
            <button className="icon-btn topbar__menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Icon name="menu" size={20} />
            </button>
            <div>
              <h1>{meta.title}</h1>
              <p>{meta.sub}</p>
            </div>
          </div>

          <div className="topbar__right">
            <span className="live-chip topbar__live">
              <span className="dot dot--live" /> Live
            </span>
            <form className="topbar__search" onSubmit={handleSearch}>
              <Icon name="search" size={17} />
              <input
                type="search"
                placeholder="Search roles, companies…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>↵</kbd>
            </form>
            <button
              className={`btn btn--ghost btn--icon ${refreshing ? 'is-spinning' : ''}`}
              onClick={handleRefresh}
              title="Refresh data"
            >
              <Icon name="refresh" size={17} />
            </button>
            <div className="topbar__user">
              <span className="user-avatar user-avatar--sm" style={avatarColors(user?.name || 'admin')}>
                {initials(user?.name || 'Administrator')}
              </span>
              <div>
                <strong>{user?.name || 'Administrator'}</strong>
                <small>{user?.email || user?.username || 'admin'}</small>
              </div>
            </div>
          </div>
        </header>

        <main className="content" key={page}>
          {page === 'overview' ? (
            <Overview refreshKey={refreshKey} onOpenJob={setActiveJob} onNavigate={navigate} />
          ) : null}
          {page === 'jobs' ? (
            <Jobs refreshKey={refreshKey} seed={jobSeed} onOpenJob={setActiveJob} />
          ) : null}
          {page === 'analytics' ? <Analytics refreshKey={refreshKey} /> : null}
          {page === 'dataset' ? <Dataset refreshKey={refreshKey} /> : null}
        </main>

        <footer className="app-footer">
          <span className="app-footer__item">
            <span className="dot dot--live" /> MongoDB synced
          </span>
          <span className="app-footer__item">
            <Icon name="database" size={13} /> {total ?? '—'} listings stored
          </span>
          <span className="app-footer__spacer" />
          <span className="app-footer__item app-footer__brand">
            JobLens Admin <span>v1.0</span>
          </span>
        </footer>
      </div>

      <JobDrawer job={activeJob} onClose={() => setActiveJob(null)} />
    </div>
  )
}
