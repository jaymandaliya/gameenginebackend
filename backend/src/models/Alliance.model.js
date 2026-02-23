import mongoose from 'mongoose';

const allianceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  tag: { type: String, required: true, unique: true, maxLength: 5 },
  description: String,
  leader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  officers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  level: { type: Number, default: 1 },
  max_members: { type: Number, default: 30 },
  power: { type: Number, default: 0 },
  buffs: {
    attack_bonus: { type: Number, default: 0 },
    defense_bonus: { type: Number, default: 0 },
    production_bonus: { type: Number, default: 0 }
  },
  territory: [{
    x: Number,
    y: Number,
    captured_at: Date
  }],
  settings: {
    join_type: { type: String, enum: ['open', 'approval', 'closed'], default: 'open' },
    min_castle_level: { type: Number, default: 1 }
  },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Alliance', allianceSchema);
