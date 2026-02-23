import mongoose from 'mongoose';

const sceneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  mode: { type: String, enum: ['2d', '3d'], default: '2d' },
  backgroundColor: { type: String, default: '#87CEEB' },
  objects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GameObject' }],
  settings: {
    gravity: { x: Number, y: Number },
    physics: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Scene', sceneSchema);
