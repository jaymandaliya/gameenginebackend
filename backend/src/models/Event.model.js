import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['capital_war', 'server_war', 'alliance_tournament', 'resource_event'], required: true },
  status: { type: String, enum: ['upcoming', 'active', 'ended'], default: 'upcoming' },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  participants: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    alliance_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Alliance' },
    score: { type: Number, default: 0 }
  }],
  rewards: mongoose.Schema.Types.Mixed,
  settings: mongoose.Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Event', eventSchema);
