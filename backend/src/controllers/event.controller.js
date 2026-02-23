import Event from '../models/Event.model.js';
import Alliance from '../models/Alliance.model.js';
import logger from '../utils/logger.js';

// Get all events
export const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .sort({ start_time: -1 })
      .limit(20);
    
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

// Get upcoming events
export const getUpcomingEvents = async (req, res, next) => {
  try {
    const events = await Event.find({
      status: 'upcoming',
      start_time: { $gte: new Date() }
    })
    .sort({ start_time: 1 });
    
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

// Get active events
export const getActiveEvents = async (req, res, next) => {
  try {
    const events = await Event.find({
      status: 'active',
      start_time: { $lte: new Date() },
      end_time: { $gte: new Date() }
    });
    
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

// Get event details
export const getEventDetails = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants.user_id', 'username displayName')
      .populate('participants.alliance_id', 'name tag');
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// Join event
export const joinEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    if (event.status !== 'upcoming' && event.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Event registration closed' });
    }
    
    // Check if already registered
    const alreadyRegistered = event.participants.some(
      p => p.user_id && p.user_id.toString() === req.user.userId
    );
    
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, error: 'Already registered' });
    }
    
    event.participants.push({
      user_id: req.user.userId,
      score: 0
    });
    
    await event.save();
    
    logger.info(`User ${req.user.userId} joined event ${event.name}`);
    res.json({ success: true, message: 'Joined event', data: event });
  } catch (error) {
    next(error);
  }
};

// Get event rankings
export const getEventRankings = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants.user_id', 'username displayName avatar')
      .populate('participants.alliance_id', 'name tag');
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    const rankings = event.participants
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
    
    res.json({ success: true, data: rankings });
  } catch (error) {
    next(error);
  }
};

// Claim event rewards
export const claimRewards = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    if (event.status !== 'ended') {
      return res.status(400).json({ success: false, error: 'Event not ended yet' });
    }
    
    const participant = event.participants.find(
      p => p.user_id && p.user_id.toString() === req.user.userId
    );
    
    if (!participant) {
      return res.status(404).json({ success: false, error: 'Not a participant' });
    }
    
    // Calculate rewards based on ranking
    const rewards = {
      food: 5000,
      wood: 3000,
      iron: 2000,
      gems: 100
    };
    
    res.json({ 
      success: true, 
      message: 'Rewards claimed',
      data: rewards 
    });
  } catch (error) {
    next(error);
  }
};

// Create event (admin)
export const createEvent = async (req, res, next) => {
  try {
    const { name, type, start_time, end_time, settings, rewards } = req.body;
    
    const event = await Event.create({
      name,
      type,
      start_time,
      end_time,
      settings,
      rewards,
      status: 'upcoming'
    });
    
    logger.info(`Event created: ${name}`);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// Get capital war status
export const getCapitalWar = async (req, res, next) => {
  try {
    const capitalWar = await Event.findOne({
      type: 'capital_war',
      status: { $in: ['upcoming', 'active'] }
    })
    .populate('participants.alliance_id', 'name tag power');
    
    res.json({ 
      success: true, 
      data: capitalWar || { message: 'No active capital war' }
    });
  } catch (error) {
    next(error);
  }
};

// Get server war status
export const getServerWar = async (req, res, next) => {
  try {
    const serverWar = await Event.findOne({
      type: 'server_war',
      status: { $in: ['upcoming', 'active'] }
    });
    
    res.json({ 
      success: true, 
      data: serverWar || { message: 'No active server war' }
    });
  } catch (error) {
    next(error);
  }
};

// Submit event score
export const submitScore = async (req, res, next) => {
  try {
    const { score } = req.body;
    const event = await Event.findById(req.params.id);
    
    if (!event || event.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Event not active' });
    }
    
    const participant = event.participants.find(
      p => p.user_id && p.user_id.toString() === req.user.userId
    );
    
    if (!participant) {
      return res.status(404).json({ success: false, error: 'Not a participant' });
    }
    
    participant.score += score;
    await event.save();
    
    res.json({ success: true, data: { score: participant.score } });
  } catch (error) {
    next(error);
  }
};
