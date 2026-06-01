import CapitalWar from '../models/CapitalWar.model.js';
import Alliance from '../models/Alliance.model.js';
import User from '../models/User.model.js';
import CombatReport from '../models/CombatReport.model.js';
import logger from '../utils/logger.js';

const WAR_PHASE_MS = {
  declaration: 3 * 24 * 3600 * 1000,
  march:       3 * 24 * 3600 * 1000,
  battle:      3 * 24 * 3600 * 1000,
};

// Get or create active Capital War
const getActiveWar = async () => {
  let war = await CapitalWar.findOne({ status: { $in: ['declaration','march','battle'] } });
  if (!war) {
    const decEnd   = new Date(Date.now() + WAR_PHASE_MS.declaration);
    const marchEnd = new Date(decEnd.getTime() + WAR_PHASE_MS.march);
    const battleEnd = new Date(marchEnd.getTime() + WAR_PHASE_MS.battle);
    war = await CapitalWar.create({
      status: 'declaration',
      declaration_end: decEnd,
      march_end: marchEnd,
      battle_end: battleEnd,
    });
  }
  return war;
};

// Auto-advance war phases
const advancePhase = async (war) => {
  const now = new Date();
  if (war.status === 'declaration' && now > war.declaration_end) {
    war.status = 'march';
    await war.save();
  } else if (war.status === 'march' && now > war.march_end) {
    war.status = 'battle';
    await war.save();
  } else if (war.status === 'battle' && now > war.battle_end) {
    // Resolve war — alliance with most troops on capital wins
    const troopTotals = {};
    for (const entry of war.troops_on_capital) {
      const aid = entry.alliance_id?.toString();
      if (aid) troopTotals[aid] = (troopTotals[aid] || 0) + (entry.troop_count || 0);
    }
    const winner = Object.entries(troopTotals).sort((a, b) => b[1] - a[1])[0];
    if (winner) {
      war.holding_alliance = winner[0];
      await Alliance.findByIdAndUpdate(winner[0], { $set: { 'buffs.attack_bonus': 20, 'buffs.defense_bonus': 20 } });
    }
    war.status = 'ended';
    await war.save();
  }
};

// GET /api/v1/capitalwar  — get current war status
export const getCapitalWar = async (req, res, next) => {
  try {
    const war = await getActiveWar();
    await advancePhase(war);

    const populated = await CapitalWar.findById(war._id)
      .populate('holding_alliance', 'name tag')
      .populate('declarations', 'name tag')
      .populate('troops_on_capital.player_id', 'username');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/capitalwar/declare — declare war (alliance leader/R4+ only)
export const declareWar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.alliance_id) return res.status(400).json({ success: false, error: 'Not in an alliance' });

    const alliance = await Alliance.findById(user.alliance_id);
    if (!alliance) return res.status(404).json({ success: false, error: 'Alliance not found' });
    if (alliance.leader_id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only alliance leader can declare Capital War' });
    }
    if (alliance.members.length < 20) {
      return res.status(400).json({ success: false, error: 'Need at least 20 alliance members to declare' });
    }

    const war = await getActiveWar();
    if (war.status !== 'declaration') {
      return res.status(400).json({ success: false, error: 'Declaration phase has ended' });
    }

    const alreadyDeclared = war.declarations.some(d => d.toString() === user.alliance_id.toString());
    if (alreadyDeclared) return res.status(400).json({ success: false, error: 'Alliance already declared' });

    war.declarations.push(user.alliance_id);
    await war.save();

    logger.info(`Capital War declaration: alliance ${alliance.name}`);
    res.json({ success: true, message: `${alliance.name} has declared for Capital War!` });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/capitalwar/march — march troops to capital
export const marchToCapital = async (req, res, next) => {
  try {
    const { troop_count = 1000 } = req.body;
    const user = await User.findById(req.user.id);
    if (!user?.alliance_id) return res.status(400).json({ success: false, error: 'Not in an alliance' });

    const war = await getActiveWar();
    await advancePhase(war);
    if (!['march','battle'].includes(war.status)) {
      return res.status(400).json({ success: false, error: 'Marching phase not active' });
    }

    // Check if already on capital
    const existing = war.troops_on_capital.find(e => e.player_id?.toString() === req.user.id);
    if (existing) {
      existing.troop_count += troop_count;
    } else {
      war.troops_on_capital.push({ alliance_id: user.alliance_id, player_id: req.user.id, troop_count, arrived_at: new Date() });
    }

    await war.save();
    res.json({ success: true, message: `Marching ${troop_count} troops to the Capital!` });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/capitalwar/attack — attack wall / enemy troops at capital
export const attackCapital = async (req, res, next) => {
  try {
    const { target_type, damage } = req.body; // target_type: 'wall' | 'troops'

    const war = await getActiveWar();
    await advancePhase(war);
    if (war.status !== 'battle') return res.status(400).json({ success: false, error: 'Battle phase not active' });

    const user = await User.findById(req.user.id);
    let warPointsEarned = 0;

    if (target_type === 'wall') {
      const wallDmg = Math.min(war.capital_wall_hp, damage || 10000);
      war.capital_wall_hp = Math.max(0, war.capital_wall_hp - wallDmg);
      const wallPctDestroyed = wallDmg / war.capital_wall_hp_max;
      warPointsEarned = Math.floor(wallPctDestroyed * 20000);
    } else {
      warPointsEarned = Math.floor((damage || 1000) / 1000) * 500;
    }

    // Log war points
    war.war_point_log.push({
      player_id: req.user.id,
      alliance_id: user.alliance_id,
      action: target_type === 'wall' ? 'destroy_wall' : 'kill_troops',
      points: warPointsEarned,
    });

    await war.save();

    // Update user war points
    await User.findByIdAndUpdate(req.user.id, { $inc: { war_points: warPointsEarned } });

    res.json({
      success: true,
      data: {
        wall_hp_remaining: war.capital_wall_hp,
        war_points_earned: warPointsEarned,
        wall_breached: war.capital_wall_hp === 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/capitalwar/leaderboard — war points ranking
export const getWarLeaderboard = async (req, res, next) => {
  try {
    const war = await getActiveWar();

    const totals = {};
    for (const log of war.war_point_log) {
      const pid = log.player_id?.toString();
      if (pid) totals[pid] = (totals[pid] || 0) + log.points;
    }

    const sorted = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    const populated = await User.find({ _id: { $in: sorted.map(e => e[0]) } }).select('username displayName');
    const usernameMap = Object.fromEntries(populated.map(u => [u._id.toString(), u.username]));

    const leaderboard = sorted.map(([pid, pts], i) => ({
      rank: i + 1,
      player_id: pid,
      username: usernameMap[pid] || 'Unknown',
      war_points: pts,
    }));

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};
