import mongoose from 'mongoose';

const heroSchema = new mongoose.Schema({
  player_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  template_id:     { type: String, required: true },
  level:           { type: Number, default: 1, min: 1, max: 100 },
  exp:             { type: Number, default: 0 },
  stars:           { type: Number, default: 0, min: 0, max: 5 },
  shards:          { type: Number, default: 0 },
  is_unlocked:     { type: Boolean, default: false },
  equipment: {
    weapon:  { type: String, default: null },
    armor:   { type: String, default: null },
    helmet:  { type: String, default: null },
    ring:    { type: String, default: null },
    amulet:  { type: String, default: null },
    boots:   { type: String, default: null },
  },
  skill_levels: { type: Map, of: Number, default: {} },
  active_skill_cds: { type: Map, of: Date, default: {} },
  status: { type: String, enum: ['idle','deployed','duel','healing'], default: 'idle' },
});

heroSchema.index({ player_id: 1 });
heroSchema.index({ player_id: 1, template_id: 1 }, { unique: true });

export default mongoose.model('Hero', heroSchema);
