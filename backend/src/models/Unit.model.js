import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  unit_type:  { type: String, enum: ['archer','infantry','cavalry','siege'], required: true },
  tier:       { type: Number, min: 1, max: 5, required: true },
  count:      { type: Number, default: 0, min: 0 },
  wounded:    { type: Number, default: 0, min: 0 },
  status:     { type: String, enum: ['idle','training','marching','garrisoned','healing'], default: 'idle' },
  training_queue: [{
    count:        Number,
    finish_at:    Date,
    started_at:   { type: Date, default: Date.now },
  }],
});

unitSchema.index({ player_id: 1 });
unitSchema.index({ player_id: 1, unit_type: 1, tier: 1 }, { unique: true });

export default mongoose.model('Unit', unitSchema);
