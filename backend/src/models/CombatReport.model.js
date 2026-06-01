import mongoose from 'mongoose';

const combatReportSchema = new mongoose.Schema({
  attacker_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  defender_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  battle_type:    { type: String, enum: ['pvp','pve','boss','rally','capital_war','duel','beast_raid'], default: 'pvp' },
  attacker_troops: mongoose.Schema.Types.Mixed,
  defender_troops: mongoose.Schema.Types.Mixed,
  attacker_hero:   mongoose.Schema.Types.Mixed,
  defender_hero:   mongoose.Schema.Types.Mixed,
  attacker_dragon: mongoose.Schema.Types.Mixed,
  terrain_type:    String,
  wall_level:      { type: Number, default: 0 },
  result:         { type: String, enum: ['attacker_win','defender_win','draw'], required: true },
  rounds: [{
    round_number:      Number,
    attacker_dmg:      Number,
    defender_dmg:      Number,
    attacker_losses:   mongoose.Schema.Types.Mixed,
    defender_losses:   mongoose.Schema.Types.Mixed,
    dragon_skill_used: String,
    spell_used:        String,
  }],
  loot: {
    gold:          { type: Number, default: 0 },
    food:          { type: Number, default: 0 },
    wood:          { type: Number, default: 0 },
    stone:         { type: Number, default: 0 },
    mana:          { type: Number, default: 0 },
    dragon_energy: { type: Number, default: 0 },
    trade_goods:   { type: Number, default: 0 },
    gems:          { type: Number, default: 0 },
  },
  attacker_power_score: Number,
  defender_power_score: Number,
  location: { x: Number, y: Number },
  created_at: { type: Date, default: Date.now },
});

combatReportSchema.index({ attacker_id: 1, created_at: -1 });
combatReportSchema.index({ defender_id: 1, created_at: -1 });

export default mongoose.model('CombatReport', combatReportSchema);
