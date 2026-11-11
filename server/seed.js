import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import { Job } from './models/Job.js'
import { Dataset } from './models/Dataset.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.resolve(__dirname, '..', 'lob_listing.json')

function parsePostedHours(posted) {
  if (!posted) return null
  const match = String(posted).match(/(\d+)\s*(minute|hour|day|week)/i)
  if (!match) return null
  const value = Number(match[1])
  const unit = match[2].toLowerCase()
  const factor = { minute: 1 / 60, hour: 1, day: 24, week: 168 }[unit]
  return Math.round(value * factor * 100) / 100
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
    return {
      title: listing.title,
      company: listing.company,
      location: listing.location,
      posted: listing.posted,
      job_url: listing.job_url,
      fresher_title_evidence: listing.fresher_title_evidence || '',
      matched_filters: listing.matched_filters || [],
      positions_by_filter: listing.positions_by_filter || {},
      order: listing.order ?? 0,
      apply_link: listing.apply_link || listing.job_url,
      posted_hours: parsePostedHours(listing.posted),
      city,
      region,
      primary_filter: (listing.matched_filters || [])[0] || 'Unclassified',
    }
  })

  if (docs.length) {
    await Job.insertMany(docs, { ordered: true })
  }

  await Dataset.create({
    key: 'default',
    collected_at: raw.collected_at || '',
    filters: raw.filters || {},
    fresher_match_rule: raw.fresher_match_rule || '',
    search_status: raw.search_status || [],
    result_count: raw.result_count ?? docs.length,
    scope_note: raw.scope_note || '',
    source_file: 'lob_listing.json',
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
