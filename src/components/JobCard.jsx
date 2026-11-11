import Icon from './Icon.jsx'
import { avatarColors, initials } from '../lib/api.js'

export default function JobCard({ job, onOpen, index = 0 }) {
  const fresh = job.posted_hours != null && job.posted_hours <= 3
  const filters = job.matched_filters || []

  return (
    <article className="job-card" style={{ '--delay': `${Math.min(index, 8) * 45}ms` }}>
      <div className="job-card__top">
        <span className="job-avatar" style={avatarColors(job.company)}>
          {initials(job.company)}
        </span>
        <span className={`posted-pill ${fresh ? 'posted-pill--fresh' : ''}`}>
          <Icon name="clock" size={13} /> {job.posted || '—'}
        </span>
      </div>

      <h3 className="job-card__title">{job.title}</h3>
      <p className="job-card__company">{job.company}</p>

      <p className="job-meta">
        <Icon name="mapPin" size={14} />
        <span>{job.location || 'Location not listed'}</span>
      </p>

      <div className="tag-row">
        {filters.slice(0, 3).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
        {filters.length > 3 ? <span className="tag tag--muted">+{filters.length - 3}</span> : null}
      </div>

      <div className="job-card__foot">
        <span className="evidence-badge">
          <Icon name="graduation" size={13} /> {job.fresher_title_evidence || 'Fresher'}
        </span>
        <button className="btn btn--soft btn--sm" onClick={() => onOpen(job)}>
          Details <Icon name="chevronRight" size={15} />
        </button>
      </div>
    </article>
  )
}
