import mongoose from 'mongoose';

const combatReportSchema = new mongoose.Schema({
  attacker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  defender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attacker_troops: mongoose.Schema.Types.Mixed,
  defender_troops: mongoose.Schema.Types.Mixed,
  result: { type: String, enum: ['attacker_win', 'defender_win', 'draw'], required: true },
  loot: {
    food: { type: Number, default: 0 },
    wood: { type: Number, default: 0 },
    iron: { type: Number, default: 0 },
    gems: { type: Number, default: 0 }
  },
  location: { x: Number, y: Number },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('CombatReport', combatReportSchema);
