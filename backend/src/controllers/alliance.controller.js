import Alliance from '../models/Alliance.model.js';
import User from '../models/User.model.js';
import logger from '../utils/logger.js';

// Create alliance
export const createAlliance = async (req, res, next) => {
  try {
    const { name, tag, description } = req.body;
    
    // Check if user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Check if user already in alliance
    if (user.alliance_id) {
      return res.status(400).json({ success: false, error: 'Already in an alliance' });
    }
    
    const alliance = await Alliance.create({
      name,
      tag,
      description,
      leader_id: req.user.id,
      members: [req.user.id]
    });
    
    user.alliance_id = alliance._id;
    await user.save();
    
    logger.info(`Alliance created: ${alliance.name}`);
    res.status(201).json({ success: true, data: alliance });
  } catch (error) {
    next(error);
  }
};

// Get all alliances
export const getAlliances = async (req, res, next) => {
  try {
    const alliances = await Alliance.find()
      .populate('leader_id', 'username displayName')
      .sort({ power: -1 })
      .limit(100);
    
    res.json({ success: true, data: alliances });
  } catch (error) {
    next(error);
  }
};

// Get alliance details
export const getAllianceDetails = async (req, res, next) => {
  try {
    const alliance = await Alliance.findById(req.params.id)
      .populate('leader_id', 'username displayName avatar')
      .populate('officers', 'username displayName avatar')
      .populate('members', 'username displayName avatar level');
    
    if (!alliance) {
      return res.status(404).json({ success: false, error: 'Alliance not found' });
    }
    
    res.json({ success: true, data: alliance });
  } catch (error) {
    next(error);
  }
};

// Join alliance
export const joinAlliance = async (req, res, next) => {
  try {
    const alliance = await Alliance.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!alliance) {
      return res.status(404).json({ success: false, error: 'Alliance not found' });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (user.alliance_id) {
      return res.status(400).json({ success: false, error: 'Already in an alliance' });
    }
    
    if (alliance.members.length >= alliance.max_members) {
      return res.status(400).json({ success: false, error: 'Alliance is full' });
    }
    
    if (alliance.settings.join_type === 'closed') {
      return res.status(400).json({ success: false, error: 'Alliance is closed' });
    }
    
    alliance.members.push(req.user.id);
    await alliance.save();
    
    user.alliance_id = alliance._id;
    await user.save();
    
    res.json({ success: true, message: 'Joined alliance', data: alliance });
  } catch (error) {
    next(error);
  }
};

// Leave alliance
export const leaveAlliance = async (req, res, next) => {
  try {
    const alliance = await Alliance.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!alliance) {
      return res.status(404).json({ success: false, error: 'Alliance not found' });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (alliance.leader_id.toString() === req.user.id) {
      return res.status(400).json({ success: false, error: 'Leader cannot leave. Transfer leadership first' });
    }
    
    alliance.members = alliance.members.filter(m => m.toString() !== req.user.id);
    await alliance.save();
    
    user.alliance_id = null;
    await user.save();
    
    res.json({ success: true, message: 'Left alliance' });
  } catch (error) {
    next(error);
  }
};

// Update alliance settings
export const updateAlliance = async (req, res, next) => {
  try {
    const alliance = await Alliance.findById(req.params.id);
    
    if (!alliance) {
      return res.status(404).json({ success: false, error: 'Alliance not found' });
    }
    
    if (alliance.leader_id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only leader can update alliance' });
    }
    
    const { description, settings } = req.body;
    
    if (description) alliance.description = description;
    if (settings) alliance.settings = { ...alliance.settings, ...settings };
    
    await alliance.save();
    
    res.json({ success: true, data: alliance });
  } catch (error) {
    next(error);
  }
};

// Purchase alliance buffs
export const purchaseBuffs = async (req, res, next) => {
  try {
    const alliance = await Alliance.findById(req.params.id);
    const { buff_type, duration } = req.body; // attack_bonus, defense_bonus, etc.
    
    if (!alliance) {
      return res.status(404).json({ success: false, error: 'Alliance not found' });
    }
    
    // Check if user is member
    if (!alliance.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Not a member of this alliance' });
    }
    
    // Cost calculation (simplified)
    const cost = 1000;
    
    // Apply buff
    alliance.buffs[buff_type] = (alliance.buffs[buff_type] || 0) + 5;
    await alliance.save();
    
    res.json({ success: true, message: 'Buff purchased', data: alliance.buffs });
  } catch (error) {
    next(error);
  }
};

// Get alliance members
export const getAllianceMembers = async (req, res, next) => {
  try {
    const alliance = await Alliance.findById(req.params.id)
      .populate('members', 'username displayName level power avatar');
    
    if (!alliance) {
      return res.status(404).json({ success: false, error: 'Alliance not found' });
    }
    
    res.json({ success: true, data: alliance.members });
  } catch (error) {
    next(error);
  }
};