import mongoose from 'mongoose';

const researchSchema = new mongoose.Schema({
  player_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  node_id:        { type: String, required: true },
  branch:         { type: String, enum: ['military','economy','magic','naval','dragon'], required: true },
  current_level:  { type: Number, default: 0 },
  in_progress:    { type: Boolean, default: false },
  start_at:       Date,
  finish_at:      Date,
  speedup_applied_ms: { type: Number, default: 0 },
});

researchSchema.index({ player_id: 1 });
researchSchema.index({ player_id: 1, node_id: 1 }, { unique: true });
researchSchema.index({ finish_at: 1, in_progress: 1 });

export default mongoose.model('Research', researchSchema);
