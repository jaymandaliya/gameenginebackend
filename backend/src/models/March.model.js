import mongoose from 'mongoose';

const marchSchema = new mongoose.Schema({
  player_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:           { type: String, enum: ['attack','reinforce','gather','trade','rally','beast_raid'], required: true },
  target_player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  target_x:       Number,
  target_y:       Number,
  target_ref_id:  String,
  troops: {
    archer:   { type: Map, of: Number, default: {} },
    infantry: { type: Map, of: Number, default: {} },
    cavalry:  { type: Map, of: Number, default: {} },
    siege:    { type: Map, of: Number, default: {} },
  },
  hero_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Hero', default: null },
  dragon_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Dragon', default: null },
  depart_at:      { type: Date, default: Date.now },
  arrive_at:      Date,
  return_at:      Date,
  status:         { type: String, enum: ['marching','at_target','returning','recalled','completed'], default: 'marching' },
  is_rally:       { type: Boolean, default: false },
  rally_leader_march_id: { type: mongoose.Schema.Types.ObjectId, ref: 'March', default: null },
  loot:           { type: mongoose.Schema.Types.Mixed, default: null },
});

marchSchema.index({ player_id: 1, status: 1 });
marchSchema.index({ arrive_at: 1, status: 1 });

export default mongoose.model('March', marchSchema);
