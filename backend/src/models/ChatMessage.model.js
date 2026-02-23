import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  channel: { type: String, required: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, maxLength: 500 },
  alliance_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Alliance' },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('ChatMessage', chatMessageSchema);
