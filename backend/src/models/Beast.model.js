import mongoose from 'mongoose';

const beastSchema = new mongoose.Schema({
  beast_id:       { type: String, required: true },
  name:           { type: String, required: true },
  level:          { type: Number, required: true },
  map_x:          { type: Number, required: true },
  map_y:          { type: Number, required: true },
  hp_current:     { type: Number, required: true },
  hp_max:         { type: Number, required: true },
  atk:            { type: Number, required: true },
  status:         { type: String, enum: ['alive','dead'], default: 'alive' },
  respawn_at:     Date,
  zone:           { type: String, default: 'kingdom_1' },
  damage_log: [{
    player_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    damage_dealt: Number,
    at:           { type: Date, default: Date.now },
  }],
});

beastSchema.index({ map_x: 1, map_y: 1 });
beastSchema.index({ status: 1, respawn_at: 1 });

export default mongoose.model('Beast', beastSchema);
