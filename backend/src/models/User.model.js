import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email:       { type: String, required: true, unique: true, lowercase: true },
  username:    { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  displayName: String,
  avatar:      String,
  alliance_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Alliance' },
  level:       { type: Number, default: 1 },
  xp:          { type: Number, default: 0 },
  gems:        { type: Number, default: 50 },

  // GDD game fields
  city_hall_level: { type: Number, default: 1, min: 1, max: 30 },
  faction:         { type: String, enum: ['elf','goblin','demon','fairy', null], default: null },
  vip_level:       { type: Number, default: 0, min: 0, max: 10 },
  battle_medals:   { type: Number, default: 0 },
  alliance_points: { type: Number, default: 0 },
  hero_tokens:     { type: Number, default: 0 },
  tournament_crowns: { type: Number, default: 0 },
  war_points:      { type: Number, default: 0 },

  tech_bonuses: {
    infantry_atk:        { type: Number, default: 0 },
    archer_atk:          { type: Number, default: 0 },
    cavalry_atk:         { type: Number, default: 0 },
    siege_atk:           { type: Number, default: 0 },
    troop_def:           { type: Number, default: 0 },
    troop_hp:            { type: Number, default: 0 },
    march_speed:         { type: Number, default: 0 },
    march_queue:         { type: Number, default: 2 },
    food_prod:           { type: Number, default: 0 },
    gold_prod:           { type: Number, default: 0 },
    wood_prod:           { type: Number, default: 0 },
    stone_prod:          { type: Number, default: 0 },
    mana_regen:          { type: Number, default: 0 },
    spell_dmg:           { type: Number, default: 0 },
    ship_atk:            { type: Number, default: 0 },
    ship_hp:             { type: Number, default: 0 },
    dragon_exp:          { type: Number, default: 0 },
    dragon_hp:           { type: Number, default: 0 },
    dragon_skill_dmg:    { type: Number, default: 0 },
    resource_protection: { type: Number, default: 0 },
  },

  active_spells: [{
    spell_id:   String,
    expires_at: Date,
    effect:     mongoose.Schema.Types.Mixed,
  }],
  spell_cooldowns: { type: Map, of: Date, default: {} },

  stats: {
    gamesPlayed:  { type: Number, default: 0 },
    wins:         { type: Number, default: 0 },
    losses:       { type: Number, default: 0 },
    totalScore:   { type: Number, default: 0 },
    battlesWon:   { type: Number, default: 0 },
    beastsKilled: { type: Number, default: 0 },
  },
  createdAt:   { type: Date, default: Date.now },
  lastLoginAt: Date,
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);