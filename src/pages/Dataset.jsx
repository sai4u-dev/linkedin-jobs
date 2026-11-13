import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { api, formatDate } from '../lib/api.js'
import { ErrorNote, SectionCard } from '../components/ui.jsx'

function MetaRow({ icon, label, value, mono }) {
  return (
    <div className="meta-row">
      <span className="meta-row__icon">
        <Icon name={icon} size={15} />
      </span>
      <span className="meta-row__label">{label}</span>
      <span className={`meta-row__value ${mono ? 'is-mono' : ''}`}>{value}</span>
    </div>
  )
}

export default function Dataset({ refreshKey }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError('')
    api('/api/dataset')
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey, reload])

  if (error && !data) {
    return <ErrorNote message={error} onRetry={() => setReload((value) => value + 1)} />
  }

  const filters = data?.filters || {}
  const searches = data?.searches || []
  const searchStatus = searches
  const collected = searchStatus.filter((item) => item.results_collected).length
  const coverage = searchStatus.length ? Math.round((collected / searchStatus.length) * 100) : 0
  const cards = searchStatus.reduce((sum, item) => sum + (item.visible_card_count || 0), 0)

  return (
    <div className="page">
      <div className="stat-grid">
        <div className="stat-card tone-violet">
          <div className="stat-card__top">
            <span className="stat-card__icon">
              <Icon name="database" size={19} />
            </span>
          </div>
          <div className="stat-card__value">{data?.result_count ?? '—'}</div>
          <div className="stat-card__label">Listings stored</div>
          <div className="stat-card__foot">Mirrored 1:1 in MongoDB</div>
        </div>
        <div className="stat-card tone-cyan">
          <div className="stat-card__top">
            <span className="stat-card__icon">
              <Icon name="search" size={19} />
            </span>
          </div>
          <div className="stat-card__value">{searchStatus.length || '—'}</div>
          <div className="stat-card__label">Searches executed</div>
          <div className="stat-card__foot">{collected} returned results</div>
        </div>
        <div className="stat-card tone-green">
          <div className="stat-card__top">
            <span className="stat-card__icon">
              <Icon name="target" size={19} />
            </span>
          </div>
          <div className="stat-card__value">{coverage}%</div>
          <div className="stat-card__label">Search coverage</div>
          <div className="stat-card__foot">Completed without timeouts</div>
        </div>
        <div className="stat-card tone-amber">
          <div className="stat-card__top">
            <span className="stat-card__icon">
              <Icon name="sparkles" size={19} />
            </span>
          </div>
          <div className="stat-card__value">{cards}</div>
          <div className="stat-card__label">Cards visible</div>
          <div className="stat-card__foot">Across all search result pages</div>
        </div>
      </div>

      <div className="chart-grid">
        <SectionCard title="Storage & provenance" hint="Where this data comes from" icon="database" className="span-5">
          <div className="meta-list">
            <MetaRow icon="calendar" label="Collected at" value={formatDate(data?.collected_at)} />
            <MetaRow icon="database" label="Seeded at" value={formatDate(data?.seeded_at)} />
            <MetaRow icon="layers" label="Source file" value={data?.source_file || '—'} mono />
            <MetaRow icon="briefcase" label="Records" value={`${data?.result_count ?? 0} listings`} />
            <MetaRow icon="target" label="Search records" value={`${searchStatus.length} searches`} />
            <MetaRow icon="link" label="Database" value="MongoDB · joblens" mono />
          </div>
          <div className="db-badge">
            <span className="dot dot--live" /> Connected to MongoDB
          </div>
        </SectionCard>

        <SectionCard title="Collection filters" hint="Parameters used for the LinkedIn scrape" icon="filter" className="span-7">
          <div className="filter-tiles">
            <div className="filter-tile">
              <span>Location</span>
              <strong>{filters.location || '—'}</strong>
            </div>
            <div className="filter-tile">
              <span>Posted within</span>
              <strong>{filters.posted_within || '—'}</strong>
            </div>
            <div className="filter-tile">
              <span>Timezone</span>
              <strong>{data?.timezone || '—'}</strong>
            </div>
            <div className="filter-tile">
              <span>Source reference</span>
              <strong>{data?.source_reference || '—'}</strong>
            </div>
          </div>
          <div className="filter-titles">
            <span className="filter-titles__label">Searches collected</span>
            <div className="tag-row">
              {searchStatus.map((search) => (
                <span className="tag tag--accent" key={search.keyword}>
                  {search.keyword}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Search status log"
        hint="Every filter run, its yield and any failure"
        icon="layers"
        action={<span className="muted-note">{searchStatus.length} records</span>}
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Search</th>
                <th>Status</th>
                <th className="num">Cards</th>
                <th>Collected at</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {searchStatus.map((item) => {
                const isCollected = Boolean(item.results_collected)
                return (
                  <tr key={item.keyword}>
                    <td>
                      <strong>{item.keyword}</strong>
                    </td>
                    <td>
                      <span className={`status-pill ${isCollected ? 'status-pill--ok' : 'status-pill--warn'}`}>
                        {isCollected ? <Icon name="check" size={12} /> : <Icon name="alert" size={12} />}
                        {isCollected ? 'collected' : 'not collected'}
                      </span>
                    </td>
                    <td className="num">{item.visible_card_count ?? '—'}</td>
                    <td>{item.collected_at || '—'}</td>
                    <td>
                      {item.source_url ? (
                        <a className="table-link" href={item.source_url} target="_blank" rel="noreferrer">
                          <Icon name="externalLink" size={14} /> LinkedIn
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Notes on this dataset" hint="Read before drawing conclusions" icon="alert">
        <div className="note-stack">
          <div className="note-card">
            <span className="note-card__icon">
              <Icon name="graduation" size={17} />
            </span>
            <div>
              <strong>Posting time note</strong>
              <p>{data?.posting_time_note || 'No note recorded.'}</p>
            </div>
          </div>
          <div className="note-card">
            <span className="note-card__icon">
              <Icon name="alert" size={17} />
            </span>
            <div>
              <strong>Collection scope</strong>
              <p>{data?.scope_note || 'No scope note recorded.'}</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
