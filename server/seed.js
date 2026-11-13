import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import { Job } from './models/Job.js'
import { Dataset } from './models/Dataset.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.resolve(__dirname, '..', 'todaytimeanddate.json')
const TIMEZONE_OFFSET = '+05:30'

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

async function run() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`)
  }

  const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
  const listings = Array.isArray(raw.listings) ? raw.listings : []

  await connectDb()
  console.log('Connected to MongoDB')

  await Promise.all([Job.deleteMany({}), Dataset.deleteMany({})])

  const docs = listings.map((listing) => {
    const { city, region } = deriveLocation(listing.location)
    const matchedSearches = listing.matched_searches || []
    return {
      title: listing.title,
      company: listing.company,
      location: listing.location,
      posted_time: listing.posted_time || '',
      posted_at: parsePostedAt(listing.posted_at_approx),
      posted_date: parsePostedDate(listing.posted_date_approx),
      posted_at_approx: listing.posted_at_approx || '',
      posted_date_approx: listing.posted_date_approx || '',
      posted_hours: parsePostedHours(listing.posted_time),
      job_url: listing.job_url,
      apply_link: listing.apply_link || listing.job_url,
      matched_searches: matchedSearches,
      positions_by_search: listing.positions_by_search || {},
      search_keyword: listing.search_keyword || matchedSearches[0] || '',
      position_in_search: listing.position_in_search ?? null,
      data_source: listing.data_source || '',
      city,
      region,
      primary_search: matchedSearches[0] || listing.search_keyword || 'Unclassified',
      order: listing.order ?? 0,
    }
  })

  if (docs.length) {
    await Job.insertMany(docs, { ordered: true })
  }

  await Dataset.create({
    key: 'default',
    collected_at: raw.collected_at || '',
    collected_date: raw.collected_date || '',
    timezone: raw.timezone || '',
    filters: raw.filters || {},
    source_reference: raw.source_reference || '',
    posting_time_note: raw.posting_time_note || '',
    searches: raw.searches || [],
    result_count: raw.result_count ?? docs.length,
    scope_note: raw.scope_note || '',
    source_file: path.basename(sourcePath),
    seeded_at: new Date(),
  })

  console.log(`Seeded ${docs.length} listings and 1 dataset into MongoDB`)
  console.log(`Database: ${mongoose.connection.name}`)

  await mongoose.disconnect()
}

run().catch(async (error) => {
  console.error('Seed failed:', error.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
