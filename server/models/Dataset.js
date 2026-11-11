import mongoose from 'mongoose'

const datasetSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    collected_at: { type: String, default: '' },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    fresher_match_rule: { type: String, default: '' },
    search_status: { type: [mongoose.Schema.Types.Mixed], default: [] },
    result_count: { type: Number, default: 0 },
    scope_note: { type: String, default: '' },
    source_file: { type: String, default: 'lob_listing.json' },
    seeded_at: { type: Date, default: Date.now },
  },
  { minimize: false }
)

export const Dataset = mongoose.model('Dataset', datasetSchema)
