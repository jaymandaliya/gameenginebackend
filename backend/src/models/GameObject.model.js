import mongoose from 'mongoose';

const gameObjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sceneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scene', required: true },
  type: { type: String, enum: ['sprite', 'text', 'shape', 'tilemap', 'model', 'light', 'camera'], default: 'sprite' },
  position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
  rotation: { type: Number, default: 0 },
  scale: { x: { type: Number, default: 1 }, y: { type: Number, default: 1 } },
  transform2d: {
    position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
    rotation: { type: Number, default: 0 },
    scale: { x: { type: Number, default: 1 }, y: { type: Number, default: 1 } },
  },
  transform3d: {
    position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 }, z: { type: Number, default: 0 } },
    rotation: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 }, z: { type: Number, default: 0 } },
    scale: { x: { type: Number, default: 1 }, y: { type: Number, default: 1 }, z: { type: Number, default: 1 } },
  },
  visible: { type: Boolean, default: true },
  locked: { type: Boolean, default: false },
  layer: { type: Number, default: 0 },
  children: { type: [String], default: [] },
  parentId: { type: String },
  properties: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  strict: false
});

export default mongoose.model('GameObject', gameObjectSchema);
