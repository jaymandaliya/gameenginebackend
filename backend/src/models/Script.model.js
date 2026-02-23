import mongoose from 'mongoose';

const scriptSchema = new mongoose.Schema({
  name: { type: String, required: true },
  objectId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameObject' },
  sceneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scene' },
  nodes: { type: Array, default: [] },
  connections: { type: Array, default: [] },
  variables: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  strict: false
});

export default mongoose.model('Script', scriptSchema);
