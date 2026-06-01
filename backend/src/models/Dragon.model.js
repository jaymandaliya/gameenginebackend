import mongoose from 'mongoose';

const dragonSchema = new mongoose.Schema({
  player_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dragon_type:  { type: String, enum: ['emberstrike','tideclaw','stormbeak','venomfang','voidwing'], required: true },
  level:        { type: Number, default: 1, min: 1, max: 50 },
  exp:          { type: Number, default: 0 },
  hp_current:   { type: Number, default: 8000 },
  hp_max:       { type: Number, default: 8000 },
  status:       { type: String, enum: ['idle','deployed','healing','dead'], default: 'idle' },
  revive_at:    Date,
  heal_at:      Date,
  primary_skill_level:    { type: Number, default: 1, min: 1, max: 5 },
  secondary_skill_level:  { type: Number, default: 1, min: 1, max: 5 },
});

dragonSchema.index({ player_id: 1 });
dragonSchema.index({ player_id: 1, dragon_type: 1 }, { unique: true });

export default mongoose.model('Dragon', dragonSchema);
