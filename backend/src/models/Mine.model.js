import mongoose from 'mongoose';

const mineSchema = new mongoose.Schema({
  map_x:       { type: Number, required: true },
  map_y:       { type: Number, required: true },
  level:       { type: Number, min: 1, max: 5, default: 1 },
  resource_type: { type: String, enum: ['gold','stone','dragon_energy'], default: 'gold' },
  occupant_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  occupant_alliance: { type: mongoose.Schema.Types.ObjectId, ref: 'Alliance', default: null },
  occupied_at:   Date,
  occupation_expires_at: Date,
  guard_hp:      { type: Number, default: 800 },
  guard_hp_max:  { type: Number, default: 800 },
  last_harvest:  { type: Date, default: Date.now },
  zone:          { type: String, default: 'borderlands' },
});

mineSchema.index({ map_x: 1, map_y: 1 }, { unique: true });
mineSchema.index({ occupant_id: 1 });

export default mongoose.model('Mine', mineSchema);
