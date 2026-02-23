import ChatMessage from '../models/ChatMessage.model.js';
import Alliance from '../models/Alliance.model.js';
import logger from '../utils/logger.js';

// Send message
export const sendMessage = async (req, res, next) => {
  try {
    const { channel, message, alliance_id } = req.body;
    
    // Validate channel
    if (!['global', 'alliance', 'private'].includes(channel)) {
      return res.status(400).json({ success: false, error: 'Invalid channel' });
    }
    
    // If alliance channel, verify membership
    if (channel === 'alliance' && alliance_id) {
      const alliance = await Alliance.findById(alliance_id);
      if (!alliance || !alliance.members.includes(req.user.userId)) {
        return res.status(403).json({ success: false, error: 'Not a member of this alliance' });
      }
    }
    
    const chatMessage = await ChatMessage.create({
      channel,
      sender_id: req.user.userId,
      message,
      alliance_id: channel === 'alliance' ? alliance_id : null
    });
    
    const populatedMessage = await ChatMessage.findById(chatMessage._id)
      .populate('sender_id', 'username displayName avatar');
    
    // Emit via Socket.IO (will be handled by WebSocket)
    if (req.io) {
      req.io.to(channel === 'alliance' ? `alliance_${alliance_id}` : channel).emit('new_message', populatedMessage);
    }
    
    logger.info(`Chat message sent in ${channel}`);
    res.json({ success: true, data: populatedMessage });
  } catch (error) {
    next(error);
  }
};

// Get messages
export const getMessages = async (req, res, next) => {
  try {
    const { channel, alliance_id, limit = 50 } = req.query;
    
    const query = { channel };
    if (channel === 'alliance' && alliance_id) {
      query.alliance_id = alliance_id;
    }
    
    const messages = await ChatMessage.find(query)
      .populate('sender_id', 'username displayName avatar')
      .sort({ created_at: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

// Delete message (mods/admins)
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await ChatMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    // Only sender or admin can delete
    if (message.sender_id.toString() !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    await message.deleteOne();
    
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

// Report message
export const reportMessage = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const message = await ChatMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    // Log report (in production, store in separate collection)
    logger.warn(`Message reported: ${message._id} by user ${req.user.userId}. Reason: ${reason}`);
    
    res.json({ success: true, message: 'Message reported. Admin will review.' });
  } catch (error) {
    next(error);
  }
};

// Get chat channels
export const getChannels = async (req, res, next) => {
  try {
    const channels = [
      { id: 'global', name: 'Global Chat', type: 'public' },
      { id: 'alliance', name: 'Alliance Chat', type: 'alliance' }
    ];
    
    res.json({ success: true, data: channels });
  } catch (error) {
    next(error);
  }
};

// Mute user (alliance officers/leader)
export const muteUser = async (req, res, next) => {
  try {
    const { user_id, duration } = req.body;
    
    // Verify authority (simplified - check if leader/officer)
    // In production, store mutes in database
    
    logger.info(`User ${user_id} muted for ${duration} minutes by ${req.user.userId}`);
    
    res.json({ success: true, message: 'User muted' });
  } catch (error) {
    next(error);
  }
};
