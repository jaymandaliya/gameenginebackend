import mongoose from 'mongoose';

const sessionPlayerSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true },
    id: { type: String },
    username: { type: String, required: true },
    ready: { type: Boolean, default: false },
    connected: { type: Boolean, default: true },
    ping: { type: Number, default: 20 },
  },
  { _id: false }
);

const multiplayerSessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    hostId: { type: String, required: true, index: true },
    hostName: { type: String, required: true },
    gameMode: { type: String, enum: ['pve', 'pvp', 'coop'], default: 'pvp' },
    maxPlayers: { type: Number, default: 4 },
    players: { type: [sessionPlayerSchema], default: [] },
    status: {
      type: String,
      enum: ['waiting', 'starting', 'active', 'ended'],
      default: 'waiting',
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('MultiplayerSession', multiplayerSessionSchema);
