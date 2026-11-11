import Icon from './Icon.jsx'

export const PALETTE = [
  '#7c6cff',
  '#22d3ee',
  '#34d399',
  '#fbbf24',
  '#f472b6',
  '#60a5fa',
  '#a78bfa',
  '#fb7185',
]

export function SectionCard({ title, hint, action, children, className = '', icon }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card__head">
          <div>
            <h2 className="card__title">
              {icon ? <Icon name={icon} size={16} /> : null}
              {title}
            </h2>
            {hint ? <p className="card__hint">{hint}</p> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ icon, label, value, foot, tone = 'violet', loading = false }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-card__top">
        <span className="stat-card__icon">
          <Icon name={icon} size={19} />
        </span>
        <span className="stat-card__glow" />
      </div>
      <div className="stat-card__value">{loading ? <span className="skeleton skeleton--value" /> : value}</div>
      <div className="stat-card__label">{label}</div>
      {foot ? <div className="stat-card__foot">{foot}</div> : null}
      <span className="stat-card__watermark" aria-hidden="true">
        <Icon name={icon} size={92} strokeWidth={1} />
      </span>
    </div>
  )
}

export function BarList({ items, emptyText = 'No data yet', limit }) {
  const list = limit ? items.slice(0, limit) : items
  const max = Math.max(1, ...list.map((item) => item.count))
  if (!list.length) return <p className="muted-note">{emptyText}</p>

  return (
    <div className="bar-list">
      {list.map((item, index) => (
        <div className="bar-row" key={item.name}>
          <div className="bar-row__meta">
            <span className="bar-row__name">
              <span className="dot" style={{ background: PALETTE[index % PALETTE.length] }} />
              {item.name}
            </span>
            <span className="bar-row__count">{item.count}</span>
          </div>
          <div className="bar-track">
            <span
              className="bar-fill"
              style={{
                width: `${Math.max(4, (item.count / max) * 100)}%`,
                background: `linear-gradient(90deg, ${PALETTE[index % PALETTE.length]}, ${PALETTE[(index + 1) % PALETTE.length]})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ColumnChart({ items }) {
  const max = Math.max(1, ...items.map((item) => item.count))
  return (
    <div className="column-chart">
      {items.map((item, index) => (
        <div className="column" key={item.label}>
          <span className="column__value">{item.count}</span>
          <div className="column__track">
            <span
              className="column__fill"
              style={{
                height: `${Math.max(6, (item.count / max) * 100)}%`,
                background: `linear-gradient(180deg, ${PALETTE[index % PALETTE.length]}, ${PALETTE[index % PALETTE.length]}33)`,
              }}
            />
          </div>
          <span className="column__label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function Donut({ items, centerValue, centerLabel }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1
  let cursor = 0
  const stops = items.map((item, index) => {
    const start = (cursor / total) * 100
    cursor += item.count
    const end = (cursor / total) * 100
    return `${PALETTE[index % PALETTE.length]} ${start}% ${end}%`
  })

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops.join(', ')})` }}>
        <div className="donut__center">
          <strong>{centerValue}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="legend">
        {items.map((item, index) => (
          <li key={item.name}>
            <span className="dot" style={{ background: PALETTE[index % PALETTE.length] }} />
            <span className="legend__name">{item.name}</span>
            <span className="legend__count">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ErrorNote({ message, onRetry }) {
  return (
    <div className="error-note">
      <Icon name="alert" size={18} />
      <div>
        <strong>Could not load data</strong>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button className="btn btn--ghost btn--sm" onClick={onRetry}>
          <Icon name="refresh" size={15} /> Retry
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', text, icon = 'inbox' }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={26} />
      </span>
      <strong>{title}</strong>
      {text ? <p>{text}</p> : null}
    </div>
  )
}

export function SkeletonCards({ count = 6 }) {
  return (
    <div className="job-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div className="job-card skeleton-card" key={index}>
          <div className="skeleton skeleton--row" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--short" />
          <div className="skeleton skeleton--tags" />
        </div>
      ))}
    </div>
  )
}
