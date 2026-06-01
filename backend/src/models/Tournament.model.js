import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  format:       { type: String, enum: ['3v3','5v5'], required: true },
  season:       { type: Number, default: 1 },
  week:         { type: Number, default: 1 },
  status:       { type: String, enum: ['signup','active','finals','ended'], default: 'signup' },
  signup_end:   Date,
  battles_end:  Date,
  finals_end:   Date,
  teams: [{
    team_id:    { type: String, required: true },
    player_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hero_ids:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hero' }],
    division:   { type: String, enum: ['bronze','silver','gold','platinum','diamond','legend'], default: 'bronze' },
    tier:       { type: Number, default: 1, min: 1, max: 5 },
    wins:       { type: Number, default: 0 },
    losses:     { type: Number, default: 0 },
    war_points: { type: Number, default: 0 },
    crowns:     { type: Number, default: 0 },
    rank:       Number,
  }],
  matches: [{
    round:          Number,
    team_a_id:      String,
    team_b_id:      String,
    winner_team_id: String,
    log:            mongoose.Schema.Types.Mixed,
    played_at:      Date,
  }],
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model('Tournament', tournamentSchema);
