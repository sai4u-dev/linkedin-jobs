import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { api } from '../lib/api.js'
import { ErrorNote, EmptyState, SkeletonCards } from '../components/ui.jsx'
import JobCard from '../components/JobCard.jsx'

const SORTS = [
  { value: 'order', label: 'Collection order' },
  { value: 'recent', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest posting' },
  { value: 'company', label: 'Company A–Z' },
  { value: 'title', label: 'Title A–Z' },
]

const PAGE_SIZE = 9

export default function Jobs({ refreshKey, seed, onOpenJob }) {
  const [search, setSearch] = useState(seed?.q || '')
  const [debounced, setDebounced] = useState(seed?.q || '')
  const [filter, setFilter] = useState('')
  const [location, setLocation] = useState('')
  const [sort, setSort] = useState('order')
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (seed?.q !== undefined) {
      setSearch(seed.q)
      setDebounced(seed.q)
      setPage(1)
    }
  }, [seed?.key])

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      q: debounced,
      filter,
      location,
      sort,
      page: String(page),
      limit: String(PAGE_SIZE),
    })
    return params.toString()
  }, [debounced, filter, location, sort, page])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api(`/api/jobs?${queryString}`)
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [queryString, refreshKey, reload])

  const facets = data?.facets
  const activeCount = [filter, location, debounced].filter(Boolean).length

  function updateFilter(next) {
    setFilter((current) => (current === next ? '' : next))
    setPage(1)
  }

  function resetAll() {
    setSearch('')
    setDebounced('')
    setFilter('')
    setLocation('')
    setSort('order')
    setPage(1)
  }

  const pageNumbers = useMemo(() => {
    if (!data) return []
    const total = data.pages
    const windowSize = 5
    let start = Math.max(1, page - Math.floor(windowSize / 2))
    const end = Math.min(total, start + windowSize - 1)
    start = Math.max(1, end - windowSize + 1)
    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }, [data, page])

  if (error && !data) {
    return <ErrorNote message={error} onRetry={() => setReload((value) => value + 1)} />
  }

  return (
    <div className="page">
      <div className="toolbar-card">
        <div className="toolbar-row">
          <div className="search-field">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search by role, company or location…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            {search ? (
              <button
                className="input-action"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                aria-label="Clear search"
              >
                <Icon name="x" size={16} />
              </button>
            ) : null}
          </div>

          <div className="toolbar-selects">
            <label className="select">
              <Icon name="mapPin" size={16} />
              <select
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">All locations</option>
                {(facets?.locations || []).map((item) => (
                  <option value={item.name} key={item.name}>
                    {item.name} ({item.count})
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" size={14} />
            </label>

            <label className="select">
              <Icon name="filter" size={16} />
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                {SORTS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" size={14} />
            </label>
          </div>
        </div>

        <div className="chip-row">
          <button
            className={`chip ${!filter ? 'is-active' : ''}`}
            onClick={() => {
              setFilter('')
              setPage(1)
            }}
          >
            All tracks
          </button>
          {(facets?.filters || []).map((item) => (
            <button
              key={item.name}
              className={`chip ${filter === item.name ? 'is-active' : ''}`}
              onClick={() => updateFilter(item.name)}
            >
              {item.name} <span>{item.count}</span>
            </button>
          ))}
        </div>

        <div className="toolbar-foot">
          <p className="results-meta">
            {loading && !data ? (
              'Loading listings…'
            ) : data ? (
              <>
                Showing <strong>{data.total ? (data.page - 1) * data.limit + 1 : 0}</strong>–
                <strong>{Math.min(data.page * data.limit, data.total)}</strong> of{' '}
                <strong>{data.total}</strong> listings
                {activeCount ? <span className="results-meta__dot"> · {activeCount} filters active</span> : null}
              </>
            ) : null}
          </p>
          <div className="toolbar-actions">
            {activeCount ? (
              <button className="btn btn--ghost btn--sm" onClick={resetAll}>
                <Icon name="x" size={14} /> Clear filters
              </button>
            ) : null}
            <div className="view-toggle" role="group" aria-label="View mode">
              <button
                className={`view-toggle__btn ${view === 'grid' ? 'is-active' : ''}`}
                onClick={() => setView('grid')}
                aria-pressed={view === 'grid'}
                title="Card view"
              >
                <Icon name="grid" size={14} /> Cards
              </button>
              <button
                className={`view-toggle__btn ${view === 'table' ? 'is-active' : ''}`}
                onClick={() => setView('table')}
                aria-pressed={view === 'table'}
                title="Table view"
              >
                <Icon name="table" size={14} /> Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <SkeletonCards count={PAGE_SIZE} />
      ) : data?.items.length ? (
        <>
          {view === 'grid' ? (
            <div className={`job-grid ${loading ? 'is-refreshing' : ''}`}>
              {data.items.map((job, index) => (
                <JobCard job={job} onOpen={onOpenJob} index={index} key={job._id} />
              ))}
            </div>
          ) : (
            <div className={`card jobs-table-card ${loading ? 'is-refreshing' : ''}`}>
              <div className="table-wrap">
                <table className="data-table jobs-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Location</th>
                      <th>Posted</th>
                      <th>Matched tracks</th>
                      <th>Source</th>
                      <th className="num">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((job) => {
                      const searches = job.matched_searches || []
                      return (
                        <tr
                          key={job._id}
                          className="jobs-table__row"
                          onClick={() => onOpenJob(job)}
                        >
                          <td>
                            <strong className="jobs-table__title">{job.title}</strong>
                            <span className="jobs-table__sub">{job.company}</span>
                          </td>
                          <td>{job.location || '—'}</td>
                          <td>
                            <span>{job.posted_time || '—'}</span>
                            <span className="jobs-table__sub">{job.posted_date_approx || '—'}</span>
                          </td>
                          <td>
                            <div className="tag-row tag-row--tight">
                              {searches.slice(0, 2).map((search) => (
                                <span className="tag" key={search}>
                                  {search}
                                </span>
                              ))}
                              {searches.length > 2 ? (
                                <span className="tag tag--muted">+{searches.length - 2}</span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <span className="tag tag--accent">{job.data_source || 'live'}</span>
                          </td>
                          <td className="num">
                            <button
                              className="btn btn--soft btn--sm"
                              onClick={(event) => {
                                event.stopPropagation()
                                onOpenJob(job)
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.pages > 1 ? (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <Icon name="chevronLeft" size={16} /> Prev
              </button>
              {pageNumbers[0] > 1 ? <span className="page-ellipsis">…</span> : null}
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  className={`page-btn page-btn--num ${number === page ? 'is-active' : ''}`}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < data.pages ? <span className="page-ellipsis">…</span> : null}
              <button
                className="page-btn"
                disabled={page >= data.pages}
                onClick={() => setPage((value) => Math.min(data.pages, value + 1))}
              >
                Next <Icon name="chevronRight" size={16} />
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="card">
          <EmptyState
            icon="search"
            title="No listings match these filters"
            text="Try a different keyword, role track or location — or clear the filters to see the full dataset."
          />
        </div>
      )}
    </div>
  )
}
