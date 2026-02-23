import CombatReport from '../models/CombatReport.model.js';
import GameObject from '../models/GameObject.model.js';
import User from '../models/User.model.js';
import logger from '../utils/logger.js';

// Calculate combat result
const calculateCombat = (attackerTroops, defenderTroops, attackerHero, defenderHero) => {
  let attackPower = 0;
  let defensePower = 0;
  
  // Calculate attack power
  for (const [type, data] of Object.entries(attackerTroops)) {
    attackPower += (data.count || 0) * (data.attack || 10);
  }
  
  // Add hero bonus
  if (attackerHero) {
    attackPower += attackerHero.properties.attack || 0;
  }
  
  // Calculate defense power
  for (const [type, data] of Object.entries(defenderTroops)) {
    defensePower += (data.count || 0) * (data.defense || 8);
  }
  
  // Add hero bonus
  if (defenderHero) {
    defensePower += defenderHero.properties.defense || 0;
  }
  
  // Add randomness (±10%)
  const randomFactor = 0.9 + (Math.random() * 0.2);
  attackPower *= randomFactor;
  
  // Determine winner
  if (attackPower > defensePower * 1.2) {
    return { result: 'attacker_win', attackerLosses: 0.2, defenderLosses: 0.5 };
  } else if (defensePower > attackPower * 1.2) {
    return { result: 'defender_win', attackerLosses: 0.6, defenderLosses: 0.1 };
  } else {
    return { result: 'draw', attackerLosses: 0.4, defenderLosses: 0.4 };
  }
};

// Attack player
export const attackPlayer = async (req, res, next) => {
  try {
    const { defender_id, troops, hero_id, location } = req.body;
    
    // Get attacker and defender
    const attacker = await User.findById(req.user.userId);
    const defender = await User.findById(defender_id);
    
    if (!defender) {
      return res.status(404).json({ success: false, error: 'Defender not found' });
    }
    
    // Get troops and heroes
    const attackerHero = hero_id ? await GameObject.findById(hero_id) : null;
    
    // Get defender troops (simplified - get from GameObjects)
    const defenderTroops = {
      swordsman: { count: 100, defense: 8 },
      archer: { count: 80, defense: 6 }
    };
    
    // Calculate combat
    const combatResult = calculateCombat(troops, defenderTroops, attackerHero, null);
    
    // Calculate loot
    const loot = {
      food: Math.floor(Math.random() * 1000) + 500,
      wood: Math.floor(Math.random() * 800) + 300,
      iron: Math.floor(Math.random() * 500) + 200,
      gems: Math.floor(Math.random() * 50) + 10
    };
    
    // Create combat report
    const report = await CombatReport.create({
      attacker_id: req.user.userId,
      defender_id,
      attacker_troops: troops,
      defender_troops: defenderTroops,
      result: combatResult.result,
      loot: combatResult.result === 'attacker_win' ? loot : { food: 0, wood: 0, iron: 0, gems: 0 },
      location
    });
    
    logger.info(`Combat: ${attacker.username} vs ${defender.username} - ${combatResult.result}`);
    
    res.json({
      success: true,
      data: {
        result: combatResult.result,
        report: report,
        loot: combatResult.result === 'attacker_win' ? loot : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get combat reports
export const getCombatReports = async (req, res, next) => {
  try {
    const reports = await CombatReport.find({
      $or: [
        { attacker_id: req.user.userId },
        { defender_id: req.user.userId }
      ]
    })
    .populate('attacker_id', 'username displayName')
    .populate('defender_id', 'username displayName')
    .sort({ created_at: -1 })
    .limit(50);
    
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

// Get active battles
export const getActiveBattles = async (req, res, next) => {
  try {
    // In real implementation, this would track ongoing marches
    const battles = [];
    
    res.json({ success: true, data: battles });
  } catch (error) {
    next(error);
  }
};

// Set defense formation
export const setDefense = async (req, res, next) => {
  try {
    const { formation } = req.body;
    
    // Store defense formation in user's GameObject
    const defenseSetup = await GameObject.create({
      name: 'Defense Formation',
      type: 'defense',
      userId: req.user.userId,
      properties: {
        formation,
        updated_at: new Date()
      }
    });
    
    res.json({ success: true, data: defenseSetup });
  } catch (error) {
    next(error);
  }
};

// Scout enemy
export const scoutEnemy = async (req, res, next) => {
  try {
    const { target_id } = req.body;
    
    const target = await User.findById(target_id);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Target not found' });
    }
    
    // Get target's troops (simplified)
    const scoutInfo = {
      username: target.username,
      castle_level: target.level || 1,
      estimated_power: Math.floor(Math.random() * 100000) + 50000,
      visible_troops: {
        swordsman: '???',
        archer: '???'
      },
      alliance: target.alliance_id
    };
    
    res.json({ success: true, data: scoutInfo });
  } catch (error) {
    next(error);
  }
};

// March troops
export const marchTroops = async (req, res, next) => {
  try {
    const { target_id, troops, action, march_time } = req.body; // action: attack/reinforce/gather
    
    // Create march record
    const march = await GameObject.create({
      name: 'March',
      type: 'march',
      userId: req.user.userId,
      properties: {
        target_id,
        troops,
        action,
        start_time: new Date(),
        arrival_time: new Date(Date.now() + (march_time || 60000)),
        status: 'marching'
      }
    });
    
    res.json({
      success: true,
      data: march,
      message: `Troops marching to target. ETA: ${march_time / 1000} seconds`
    });
  } catch (error) {
    next(error);
  }
};

// Recall troops
export const recallTroops = async (req, res, next) => {
  try {
    const { march_id } = req.body;
    
    const march = await GameObject.findById(march_id);
    
    if (!march || march.userId.toString() !== req.user.userId) {
      return res.status(404).json({ success: false, error: 'March not found' });
    }
    
    march.properties.status = 'recalled';
    await march.save();
    
    res.json({ success: true, message: 'Troops recalled' });
  } catch (error) {
    next(error);
  }
};

// Get formations
export const getFormations = async (req, res, next) => {
  try {
    const formations = [
      { id: 'offensive', name: 'Offensive', attack_bonus: 10, defense_penalty: -5 },
      { id: 'defensive', name: 'Defensive', attack_penalty: -5, defense_bonus: 15 },
      { id: 'balanced', name: 'Balanced', attack_bonus: 5, defense_bonus: 5 }
    ];
    
    res.json({ success: true, data: formations });
  } catch (error) {
    next(error);
  }
};

// Set formation
export const setFormation = async (req, res, next) => {
  try {
    const { formation_id } = req.body;
    
    // Store in user GameObject
    const formation = await GameObject.findOneAndUpdate(
      { userId: req.user.userId, type: 'formation' },
      { 
        name: 'Current Formation',
        type: 'formation',
        userId: req.user.userId,
        properties: { formation_id, updated_at: new Date() }
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, data: formation });
  } catch (error) {
    next(error);
  }
};

// Get combat history
export const getCombatHistory = async (req, res, next) => {
  try {
    const history = await CombatReport.find({
      $or: [
        { attacker_id: req.user.userId },
        { defender_id: req.user.userId }
      ]
    })
    .populate('attacker_id', 'username')
    .populate('defender_id', 'username')
    .sort({ created_at: -1 })
    .limit(100);
    
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
