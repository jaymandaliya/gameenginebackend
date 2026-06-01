import mongoose from 'mongoose';

const capitalWarSchema = new mongoose.Schema({
  server_id:        { type: String, default: 'server_1' },
  season:           { type: Number, default: 1 },
  status:           { type: String, enum: ['declaration','march','battle','ended'], default: 'declaration' },
  declaration_end:  Date,
  march_end:        Date,
  battle_end:       Date,
  holding_alliance: { type: mongoose.Schema.Types.ObjectId, ref: 'Alliance', default: null },
  capital_wall_hp:  { type: Number, default: 1000000 },
  capital_wall_hp_max: { type: Number, default: 1000000 },
  troops_on_capital: [{
    alliance_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Alliance' },
    player_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    troop_count:  Number,
    arrived_at:   Date,
  }],
  war_point_log: [{
    player_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    alliance_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Alliance' },
    action:        String,
    points:        Number,
    at:            { type: Date, default: Date.now },
  }],
  declarations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alliance' }],
  created_at: { type: Date, default: Date.now },
});

capitalWarSchema.index({ server_id: 1, status: 1 });

export default mongoose.model('CapitalWar', capitalWarSchema);
