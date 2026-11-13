import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { api } from '../lib/api.js'
import {
  BarList,
  ColumnChart,
  Donut,
  ErrorNote,
  SectionCard,
} from '../components/ui.jsx'

function Insight({ icon, label, value, hint, tone }) {
  return (
    <div className={`insight-card tone-${tone}`}>
      <span className="insight-card__icon">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <span className="insight-card__label">{label}</span>
        <strong className="insight-card__value">{value}</strong>
        <span className="insight-card__hint">{hint}</span>
      </div>
    </div>
  )
}

export default function Analytics({ refreshKey }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError('')
    api('/api/overview')
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

  const stats = data?.stats
  const dataset = data?.dataset
  const filterCounts = data?.filterCounts || []
  const locationCounts = data?.locationCounts || []
  const primarySearchCounts = data?.primarySearchCounts || []
  const buckets = data?.postedBuckets || []
  const searchStatus = dataset?.searches || []

  const topTrack = filterCounts[0]
  const topLocation = locationCounts[0]
  const topPrimary = primarySearchCounts[0]
  const freshNow = buckets.slice(0, 2).reduce((sum, item) => sum + item.count, 0)
  const freshShare = stats?.total ? Math.round((freshNow / stats.total) * 100) : 0
  const collected = searchStatus.filter((item) => item.results_collected).length
  const coverage = searchStatus.length ? Math.round((collected / searchStatus.length) * 100) : 0

  return (
    <div className="page">
      <div className="insight-grid">
        <Insight
          icon="target"
          tone="violet"
          label="Top hiring track"
          value={topTrack ? topTrack.name : '—'}
          hint={topTrack ? `${topTrack.count} listings matched` : 'Awaiting data'}
        />
        <Insight
          icon="mapPin"
          tone="cyan"
          label="Strongest location"
          value={topLocation ? topLocation.name : '—'}
          hint={topLocation ? `${topLocation.count} listings` : 'Awaiting data'}
        />
        <Insight
          icon="layers"
          tone="green"
          label="Top primary search"
          value={topPrimary ? topPrimary.name : '—'}
          hint={topPrimary ? `${topPrimary.count} listings` : 'Awaiting data'}
        />
        <Insight
          icon="zap"
          tone="amber"
          label="Fresh in last 3 hours"
          value={`${freshShare}%`}
          hint={`${freshNow} of ${stats?.total ?? 0} listings`}
        />
      </div>

      <div className="chart-grid">
        <SectionCard
          title="Role track distribution"
          hint="How the dataset spreads across the requested search tracks"
          icon="layers"
          className="span-7"
        >
          {data ? <BarList items={filterCounts} /> : <div className="skeleton skeleton--block" />}
        </SectionCard>

        <SectionCard title="Primary search mix" hint="The search each listing was primarily found in" icon="layers" className="span-5">
          {data ? (
            <Donut items={primarySearchCounts} centerValue={stats?.total ?? 0} centerLabel="listings" />
          ) : (
            <div className="skeleton skeleton--block" />
          )}
        </SectionCard>

        <SectionCard title="Location concentration" hint="Top cities by listing volume" icon="mapPin" className="span-5">
          {data ? <BarList items={locationCounts} limit={8} /> : <div className="skeleton skeleton--block" />}
        </SectionCard>

        <SectionCard title="Posting freshness curve" hint="Listings grouped by age at collection time" icon="clock" className="span-7">
          {data ? <ColumnChart items={buckets} /> : <div className="skeleton skeleton--block" />}
        </SectionCard>
      </div>

      <SectionCard
        title="Search coverage"
        hint="Outcome of each LinkedIn search that fed the dataset"
        icon="target"
        action={
          <span className={`status-pill ${coverage === 100 ? 'status-pill--ok' : 'status-pill--warn'}`}>
            {collected}/{searchStatus.length || 0} collected · {coverage}%
          </span>
        }
      >
        <div className="coverage-bar">
          <span style={{ width: `${coverage}%` }} />
        </div>

        <div className="coverage-grid">
          {searchStatus.map((item) => {
            const isCollected = Boolean(item.results_collected)
            return (
              <div className={`coverage-card ${isCollected ? 'is-ok' : 'is-warn'}`} key={item.keyword}>
                <div className="coverage-card__head">
                  <strong>{item.keyword}</strong>
                  <span className={`status-pill ${isCollected ? 'status-pill--ok' : 'status-pill--warn'}`}>
                    {isCollected ? (
                      <>
                        <Icon name="check" size={12} /> collected
                      </>
                    ) : (
                      <>
                        <Icon name="alert" size={12} /> not collected
                      </>
                    )}
                  </span>
                </div>
                <div className="coverage-card__stats">
                  <span>
                    <strong>{item.visible_card_count ?? 0}</strong> cards visible
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="Dataset notes" hint="Scope and matching rules behind the numbers" icon="database">
        <div className="note-stack">
          <div className="note-card">
            <span className="note-card__icon">
              <Icon name="sparkles" size={17} />
            </span>
            <div>
              <strong>Posting time note</strong>
              <p>{dataset?.posting_time_note || 'No note recorded.'}</p>
            </div>
          </div>
          <div className="note-card">
            <span className="note-card__icon">
              <Icon name="alert" size={17} />
            </span>
            <div>
              <strong>Collection scope</strong>
              <p>{dataset?.scope_note || 'No scope note recorded.'}</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
