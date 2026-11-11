import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    posted: { type: String, default: '' },
    job_url: { type: String, required: true, unique: true },
    fresher_title_evidence: { type: String, default: '' },
    matched_filters: { type: [String], default: [] },
    positions_by_filter: { type: Map, of: Number, default: {} },
    order: { type: Number, default: 0 },
    apply_link: { type: String, default: '' },
    posted_hours: { type: Number, default: null },
    city: { type: String, default: '' },
    region: { type: String, default: '' },
    primary_filter: { type: String, default: '' },
  },
  { timestamps: true }
)

jobSchema.index({ title: 'text', company: 'text', location: 'text' })
jobSchema.index({ order: 1 })
jobSchema.index({ posted_hours: 1 })
jobSchema.index({ 'matched_filters': 1 })

export const Job = mongoose.model('Job', jobSchema)
