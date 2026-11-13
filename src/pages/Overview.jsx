import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { api, formatDate } from '../lib/api.js'
import {
  BarList,
  ColumnChart,
  Donut,
  ErrorNote,
  SectionCard,
  StatCard,
  SkeletonCards,
  EmptyState,
} from '../components/ui.jsx'
import JobCard from '../components/JobCard.jsx'

export default function Overview({ refreshKey, onOpenJob, onNavigate }) {
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
  const coverage = data
    ? Math.round((data.searchSummary.collected / Math.max(1, data.searchSummary.total)) * 100)
    : 0

  return (
    <div className="page">
      <section className="pulse-card">
        <div className="pulse-card__body">
          <p className="eyebrow">
            <span className="dot dot--live" /> Market pulse · {dataset?.filters?.posted_within || 'Past 24 hours'}
          </p>
          <h2>
            {stats ? (
              <>
                <span className="gradient-text">{stats.total} live roles</span> across{' '}
                {stats.companies} companies.
              </>
            ) : (
              <span className="skeleton skeleton--line" />
            )}
          </h2>
          <p className="pulse-card__lede">
            Collected {formatDate(dataset?.collected_at)} for {dataset?.filters?.location || 'India'} ·{' '}
            {dataset?.filters?.posted_within || 'Past 24 hours'} · {dataset?.searches?.length ?? 0} search tracks.
            Browse role tracks, freshness and search coverage in one place.
          </p>
          <div className="pulse-card__chips">
            {stats ? (
              <>
                <span className="glass-chip">
                  <Icon name="layers" size={14} /> {stats.filters} role tracks
                </span>
                <span className="glass-chip">
                  <Icon name="zap" size={14} /> {stats.multiFilter} dual-track roles
                </span>
                <span className="glass-chip">
                  <Icon name="clock" size={14} /> {stats.avgHours}h average freshness
                </span>
              </>
            ) : null}
          </div>
          <div className="pulse-card__actions">
            <button className="btn btn--primary" onClick={() => onNavigate('jobs')}>
              Browse listings <Icon name="arrowUpRight" size={16} />
            </button>
            <button className="btn btn--ghost" onClick={() => onNavigate('analytics')}>
              <Icon name="chart" size={16} /> View analytics
            </button>
          </div>
        </div>

        <div className="pulse-card__ring">
          <div
            className="ring"
            style={{
              background: `conic-gradient(#7c6cff 0 ${coverage}%, rgba(255,255,255,0.07) ${coverage}% 100%)`,
            }}
          >
            <div className="ring__inner">
              <strong>{coverage}%</strong>
              <span>search coverage</span>
            </div>
          </div>
          <p>
            {data ? `${data.searchSummary.collected} of ${data.searchSummary.total}` : '—'} searches returned results
          </p>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard
          icon="briefcase"
          tone="violet"
          label="Total listings"
          value={stats ? stats.total : '—'}
          foot={stats ? `${stats.filters} role tracks captured` : ''}
          loading={!stats}
        />
        <StatCard
          icon="building"
          tone="cyan"
          label="Hiring companies"
          value={stats ? stats.companies : '—'}
          foot="Unique companies in dataset"
          loading={!stats}
        />
        <StatCard
          icon="zap"
          tone="green"
          label="Avg. freshness"
          value={stats ? `${stats.avgHours}h` : '—'}
          foot={stats ? `Newest listing ${stats.latestPostedHours ?? '—'}h ago` : ''}
          loading={!stats}
        />
        <StatCard
          icon="target"
          tone="amber"
          label="Dual-track roles"
          value={stats ? stats.multiFilter : '—'}
          foot="Listed under 2+ search tracks"
          loading={!stats}
        />
      </div>

      <div className="chart-grid">
        <SectionCard
          title="Listings by role track"
          hint="Counted across every matched search filter"
          icon="layers"
          className="span-7"
        >
          {data ? <BarList items={data.filterCounts} /> : <div className="skeleton skeleton--block" />}
        </SectionCard>

        <SectionCard title="Posting freshness" hint="How recently each role was posted" icon="clock" className="span-5">
          {data ? <ColumnChart items={data.postedBuckets} /> : <div className="skeleton skeleton--block" />}
        </SectionCard>

        <SectionCard title="Top locations" hint="Cities with the most listings" icon="mapPin" className="span-5">
          {data ? <BarList items={data.locationCounts} /> : <div className="skeleton skeleton--block" />}
        </SectionCard>

        <SectionCard
          title="Primary search track"
          hint="How listings are distributed across the primary search they were found in"
          icon="layers"
          className="span-7"
        >
          {data ? (
            <Donut
              items={data.primarySearchCounts}
              centerValue={stats?.total ?? 0}
              centerLabel="listings"
            />
          ) : (
            <div className="skeleton skeleton--block" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Fresh on the board"
        hint="Most recently posted roles in the dataset"
        icon="sparkles"
        action={
          <button className="btn btn--ghost btn--sm" onClick={() => onNavigate('jobs')}>
            View all <Icon name="chevronRight" size={15} />
          </button>
        }
      >
        {!data ? (
          <SkeletonCards count={3} />
        ) : data.recent.length ? (
          <div className="job-grid job-grid--three">
            {data.recent.slice(0, 3).map((job, index) => (
              <JobCard job={job} onOpen={onOpenJob} index={index} key={job._id} />
            ))}
          </div>
        ) : (
          <EmptyState title="No listings yet" text="Run the seed script to load the dataset." />
        )}
      </SectionCard>
    </div>
  )
}
