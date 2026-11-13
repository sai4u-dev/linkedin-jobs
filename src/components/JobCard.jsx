import Icon from './Icon.jsx'
import { avatarColors, formatRelativeTime, initials } from '../lib/api.js'
import { useNow } from '../lib/useNow.js'

export default function JobCard({ job, onOpen, index = 0 }) {
  const now = useNow()
  const postedAt = job.posted_at ? new Date(job.posted_at).getTime() : NaN
  const ageHours = Number.isNaN(postedAt) ? null : (now - postedAt) / 3600000
  const fresh = ageHours != null && ageHours >= 0 && ageHours <= 3
  const postedLabel = formatRelativeTime(job.posted_at, now) || job.posted_time || '—'
  const searches = job.matched_searches || []

  return (
    <article className="job-card" style={{ '--delay': `${Math.min(index, 8) * 45}ms` }}>
      <div className="job-card__top">
        <span className="job-avatar" style={avatarColors(job.company)}>
          {initials(job.company)}
        </span>
        <span
          className={`posted-pill ${fresh ? 'posted-pill--fresh' : ''}`}
          title={job.posted_at_approx || job.posted_at || ''}
        >
          <Icon name="clock" size={13} /> {postedLabel}
        </span>
      </div>

      <h3 className="job-card__title">{job.title}</h3>
      <p className="job-card__company">{job.company}</p>

      <p className="job-meta">
        <Icon name="mapPin" size={14} />
        <span>{job.location || 'Location not listed'}</span>
      </p>

      <div className="tag-row">
        {searches.slice(0, 3).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
        {searches.length > 3 ? <span className="tag tag--muted">+{searches.length - 3}</span> : null}
      </div>

      <div className="job-card__foot">
        <span className="evidence-badge">
          <Icon name="calendar" size={13} /> {job.posted_date_approx || 'Date unknown'}
        </span>
        <button className="btn btn--soft btn--sm" onClick={() => onOpen(job)}>
          Details <Icon name="chevronRight" size={15} />
        </button>
      </div>
    </article>
  )
}
