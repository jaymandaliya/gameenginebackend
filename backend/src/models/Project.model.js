import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  mode: { type: String, enum: ['2d', '3d', 'hybrid'], default: '2d' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail: String,
  settings: {
    resolution: { width: Number, height: Number },
    targetFPS: { type: Number, default: 60 },
    backgroundColor: { type: String, default: '#87CEEB' },
    enablePhysics: { type: Boolean, default: false },
    enableMultiplayer: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  sceneCount: { type: Number, default: 0 },
  assetCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Project', projectSchema);
