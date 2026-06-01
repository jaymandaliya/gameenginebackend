import mongoose from 'mongoose';

const shipSchema = new mongoose.Schema({
  player_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ship_type:   { type: String, enum: ['fishing_boat','war_canoe','galleon','warship','ironclad','dreadnought'], required: true },
  count:       { type: Number, default: 0, min: 0 },
  hp_bonus:    { type: Number, default: 0 },
  atk_bonus:   { type: Number, default: 0 },
  status:      { type: String, enum: ['idle','sailing','trading','combat'], default: 'idle' },
  trade_routes: [{
    destination_player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cargo_type:   String,
    cargo_amount: Number,
    depart_at:    Date,
    arrive_at:    Date,
    return_at:    Date,
    status:       { type: String, enum: ['outbound','returning','complete'], default: 'outbound' },
  }],
});

shipSchema.index({ player_id: 1 });

export default mongoose.model('Ship', shipSchema);
