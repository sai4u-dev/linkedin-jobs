import { useEffect } from 'react'
import Icon from './Icon.jsx'
import { avatarColors, initials } from '../lib/api.js'

function toObject(value) {
  if (!value) return {}
  if (value instanceof Map) return Object.fromEntries(value)
  return value
}

export default function JobDrawer({ job, onClose }) {
  useEffect(() => {
    if (!job) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [job, onClose])

  if (!job) return null

  const positions = Object.entries(toObject(job.positions_by_search))
  const maxPosition = Math.max(1, ...positions.map(([, value]) => Number(value) || 0))
  const searches = job.matched_searches || []

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <header className="drawer__head">
          <span className="drawer__eyebrow">
            <Icon name="briefcase" size={14} /> Listing #{job.order}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close details">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="drawer__body">
          <div className="drawer__hero">
            <span className="job-avatar job-avatar--lg" style={avatarColors(job.company)}>
              {initials(job.company)}
            </span>
            <div>
              <h2>{job.title}</h2>
              <p className="drawer__company">{job.company}</p>
            </div>
          </div>

          <div className="drawer__meta-grid">
            <div className="detail-tile">
              <Icon name="mapPin" size={16} />
              <span>Location</span>
              <strong>{job.location || '—'}</strong>
            </div>
            <div className="detail-tile">
              <Icon name="clock" size={16} />
              <span>Posted</span>
              <strong>{job.posted_time || '—'}</strong>
            </div>
            <div className="detail-tile">
              <Icon name="calendar" size={16} />
              <span>Posted date</span>
              <strong>{job.posted_date_approx || '—'}</strong>
            </div>
            <div className="detail-tile">
              <Icon name="layers" size={16} />
              <span>Matched tracks</span>
              <strong>{searches.length}</strong>
            </div>
          </div>

          <div className="drawer__actions">
            <a className="btn btn--primary" href={job.apply_link || job.job_url} target="_blank" rel="noreferrer">
              Apply on LinkedIn <Icon name="externalLink" size={16} />
            </a>
            <a className="btn btn--ghost" href={job.job_url} target="_blank" rel="noreferrer">
              <Icon name="link" size={16} /> Original
            </a>
          </div>

          <section className="drawer__section">
            <h3 className="drawer__section-title">Matched search tracks</h3>
            <div className="tag-row">
              {searches.length ? (
                searches.map((search) => (
                  <span className="tag tag--accent" key={search}>
                    {search}
                  </span>
                ))
              ) : (
                <span className="muted-note">No tracks recorded</span>
              )}
            </div>
          </section>

          <section className="drawer__section">
            <h3 className="drawer__section-title">Rank by search track</h3>
            <p className="drawer__section-hint">
              Position of this listing inside each LinkedIn search result page.
            </p>
            <div className="position-bars">
              {positions.map(([name, value]) => (
                <div className="position-row" key={name}>
                  <div className="position-row__meta">
                    <span>{name}</span>
                    <strong>#{value}</strong>
                  </div>
                  <div className="bar-track">
                    <span
                      className="bar-fill"
                      style={{ width: `${Math.max(6, (Number(value) / maxPosition) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="drawer__section">
            <h3 className="drawer__section-title">Links</h3>
            <a className="link-row" href={job.job_url} target="_blank" rel="noreferrer">
              <Icon name="link" size={15} />
              <span>{job.job_url}</span>
              <Icon name="arrowUpRight" size={15} />
            </a>
          </section>
        </div>
      </aside>
    </div>
  )
}
