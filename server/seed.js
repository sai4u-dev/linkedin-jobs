import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import { Job } from './models/Job.js'
import { Dataset } from './models/Dataset.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TIMEZONE = 'Asia/Kolkata'
const TIMEZONE_OFFSET = '+05:30'
const SOURCE_FILES = ['todaytimeanddate.json', 'freshers.json']

function readSource(file) {
  const sourcePath = path.resolve(__dirname, '..', file)
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`)
  }
  return JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
}

function parsePostedHours(posted) {
  if (!posted) return null
  const match = String(posted).match(/(\d+)\s*(minute|hour|day|week)/i)
  if (!match) return null
  const value = Number(match[1])
  const unit = match[2].toLowerCase()
  const factor = { minute: 1 / 60, hour: 1, day: 24, week: 168 }[unit]
  return Math.round(value * factor * 100) / 100
}

function parsePostedAt(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function deriveDateString(value) {
  const date = parsePostedAt(value)
  if (!date) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type) => parts.find((part) => part.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

function parsePostedDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00${TIMEZONE_OFFSET}`)
  return Number.isNaN(date.getTime()) ? null : date
}

function deriveLocation(location) {
  const parts = String(location || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  return {
    city: parts[0] || 'Unknown',
    region: parts[1] || parts[0] || 'Unknown',
  }
}

function normalizeListing(listing, sourceFile) {
  const matchedSearches = listing.matched_searches || []
  const postedAtApprox = listing.posted_at_approx || ''
  const postedAt = parsePostedAt(postedAtApprox)
  const postedDateApprox = listing.posted_date_approx || deriveDateString(postedAtApprox)
  const postedDate = parsePostedDate(postedDateApprox)
  const { city, region } = deriveLocation(listing.location)
  const isFresher = Boolean(listing.role_type)
  const fallbackSearch = isFresher ? 'Fresher openings' : ''

  return {
    title: listing.title,
    company: listing.company,
    location: listing.location,
    posted_time: listing.posted_time || '',
    posted_at: postedAt,
    posted_date: postedDate,
    posted_at_approx: postedAtApprox,
    posted_date_approx: postedDateApprox,
    posted_hours: parsePostedHours(listing.posted_time),
    job_url: listing.job_url,
    apply_link: listing.apply_link || listing.job_url,
    matched_searches: matchedSearches,
    positions_by_search: listing.positions_by_search || {},
    search_keyword: listing.search_keyword || matchedSearches[0] || fallbackSearch,
    position_in_search: listing.position_in_search ?? null,
    data_source: listing.data_source || (isFresher ? sourceFile : ''),
    listing_type: isFresher ? 'fresher' : 'job',
    role_type: listing.role_type || '',
    duration: listing.duration || '',
    stipend: listing.stipend || '',
    eligibility: listing.eligibility || '',
    experience_requirement: listing.experience_requirement || '',
    eligibility_basis: listing.eligibility_basis || '',
    eligibility_evidence: listing.eligibility_evidence || [],
    workplace: listing.workplace || '',
    source_search: listing.source_search || '',
    posted_time_note: listing.posted_time_note || '',
    city,
    region,
    primary_search: matchedSearches[0] || listing.search_keyword || fallbackSearch || 'Unclassified',
    order: listing.order ?? 0,
  }
}

function buildDataset(raw, file, importedCount) {
  if (file === 'freshers.json') {
    return {
      key: 'freshers',
      collected_at: raw.created_at || '',
      collected_date: deriveDateString(raw.created_at),
      timezone: raw.timezone || '',
      filters: raw.filter_criteria || {},
      source_reference: file,
      posting_time_note: '',
      searches: (raw.sources || []).map((source) => ({
        keyword: source.page_title || source.description || 'Source',
        source_url: source.url || '',
        page_title: source.page_title || '',
        visible_card_count: source.visible_first_page_cards || 0,
        results_collected: true,
        collected_at: raw.created_at || '',
      })),
      result_count: importedCount,
      scope_note: raw.eligibility_note || '',
      source_file: file,
      seeded_at: new Date(),
    }
  }

  return {
    key: 'default',
    collected_at: raw.collected_at || '',
    collected_date: raw.collected_date || '',
    timezone: raw.timezone || '',
    filters: raw.filters || {},
    source_reference: raw.source_reference || '',
    posting_time_note: raw.posting_time_note || '',
    searches: raw.searches || [],
    result_count: raw.result_count ?? importedCount,
    scope_note: raw.scope_note || '',
    source_file: file,
    seeded_at: new Date(),
  }
}

async function run() {
  const sources = SOURCE_FILES.map((file) => ({ file, raw: readSource(file) }))
  const byUrl = new Map()
  const importedByFile = new Map()

  for (const { file, raw } of sources) {
    const listings = Array.isArray(raw.listings) ? raw.listings : []
    for (const listing of listings) {
      const doc = normalizeListing(listing, file)
      if (!doc.posted_at || !doc.posted_date || !doc.posted_date_approx) continue
      if (!byUrl.has(doc.job_url)) {
        byUrl.set(doc.job_url, doc)
        importedByFile.set(file, (importedByFile.get(file) || 0) + 1)
      }
    }
  }

  const docs = [...byUrl.values()].map((doc, index) =>
    doc.order > 0 ? doc : { ...doc, order: index + 1 }
  )

  await connectDb()
  console.log('Connected to MongoDB')

  await Promise.all([Job.deleteMany({}), Dataset.deleteMany({})])

  if (docs.length) {
    await Job.insertMany(docs, { ordered: true })
  }

  await Dataset.insertMany(
    sources.map(({ file, raw }) => buildDataset(raw, file, importedByFile.get(file) || 0))
  )

  console.log(`Seeded ${docs.length} listings across ${sources.length} sources into MongoDB`)
  console.log(`Skipped ${sources.reduce((sum, { raw }) => sum + (raw.listings?.length || 0), 0) - docs.length} invalid/duplicate rows`)
  console.log(`Database: ${mongoose.connection.name}`)

  await mongoose.disconnect()
}

run().catch(async (error) => {
  console.error('Seed failed:', error.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
