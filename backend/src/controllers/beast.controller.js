import Beast from '../models/Beast.model.js';
import City from '../models/City.model.js';
import User from '../models/User.model.js';
import CombatReport from '../models/CombatReport.model.js';
import { BEAST_DATA } from '../services/gameData.service.js';
import logger from '../utils/logger.js';

// Seed beasts if none exist
const seedBeasts = async () => {
  const count = await Beast.countDocuments();
  if (count > 0) return;

  const beasts = BEAST_DATA.map((b, i) => ({
    beast_id: b.id,
    name: b.name,
    level: b.level,
    map_x: 100 + i * 150,
    map_y: 200 + i * 100,
    hp_current: b.hp,
    hp_max: b.hp,
    atk: b.atk,
    zone: b.level <= 10 ? 'kingdom_1' : b.level <= 20 ? 'borderlands' : 'abyss_rift',
  }));

  await Beast.insertMany(beasts);
  logger.info(`Seeded ${beasts.length} world beasts`);
};

// Auto respawn beasts
const processRespawns = async () => {
  const deadBeasts = await Beast.find({ status: 'dead', respawn_at: { $lte: new Date() } });
  for (const b of deadBeasts) {
    const config = BEAST_DATA.find(d => d.id === b.beast_id);
    if (!config) continue;
    b.hp_current = config.hp;
    b.status = 'alive';
    b.respawn_at = null;
    b.damage_log = [];
    await b.save();
  }
};

// GET /api/v1/beasts  — get all world beasts
export const getBeasts = async (req, res, next) => {
  try {
    await seedBeasts();
    await processRespawns();

    const { zone, min_level, max_level } = req.query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (min_level || max_level) {
      filter.level = {};
      if (min_level) filter.level.$gte = Number(min_level);
      if (max_level) filter.level.$lte = Number(max_level);
    }

    const beasts = await Beast.find(filter);

    const data = beasts.map(b => {
      const config = BEAST_DATA.find(d => d.id === b.beast_id) || {};
      return {
        id: b._id,
        beast_id: b.beast_id,
        name: b.name,
        level: b.level,
        map_x: b.map_x,
        map_y: b.map_y,
        hp_current: b.hp_current,
        hp_max: b.hp_max,
        hp_pct: Math.round((b.hp_current / b.hp_max) * 100),
        status: b.status,
        respawn_at: b.respawn_at,
        zone: b.zone,
        possible_rewards: config.rewards || {},
        attackers: b.damage_log.length,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/beasts/:id/raid — attack a beast
export const raidBeast = async (req, res, next) => {
  try {
    await processRespawns();

    const beast = await Beast.findById(req.params.id);
    if (!beast) return res.status(404).json({ success: false, error: 'Beast not found' });
    if (beast.status === 'dead') {
      return res.status(400).json({ success: false, error: `Beast is dead. Respawns at ${beast.respawn_at}` });
    }

    const config = BEAST_DATA.find(d => d.id === beast.beast_id);
    if (!config) return res.status(500).json({ success: false, error: 'Beast config missing' });

    // Simple power check
    const { troop_power = 1000 } = req.body;
    const minPower = beast.level * 500;
    if (troop_power < minPower) {
      return res.status(400).json({ success: false, error: `Need at least ${minPower} troop power for this beast` });
    }

    // Compute damage based on troop_power vs beast level
    const damageDealt = Math.floor(troop_power * (1 + Math.random() * 0.3) * 0.5);
    const playerDamageReceived = Math.floor(beast.atk * (0.5 + Math.random() * 0.5));

    beast.hp_current = Math.max(0, beast.hp_current - damageDealt);

    // Log this player's damage
    const existingLog = beast.damage_log.find(l => l.player_id?.toString() === req.user.id);
    if (existingLog) {
      existingLog.damage_dealt += damageDealt;
    } else {
      beast.damage_log.push({ player_id: req.user.id, damage_dealt: damageDealt });
    }

    let rewards = null;
    let killed = false;

    if (beast.hp_current === 0) {
      // Beast killed — distribute rewards by damage share
      killed = true;
      beast.status = 'dead';
      const config_rewards = config.rewards || {};

      const respawnMin = config.respawnMin || 60;
      beast.respawn_at = new Date(Date.now() + respawnMin * 60 * 1000);

      // Check if current player did most damage
      const totalDamage = beast.damage_log.reduce((sum, l) => sum + l.damage_dealt, 0);
      const playerLog = beast.damage_log.find(l => l.player_id?.toString() === req.user.id);
      const playerShare = playerLog ? playerLog.damage_dealt / totalDamage : 0;

      // Top contributor and last hitter get bonus
      const isLastHitter = true;
      const isTopDamage = playerShare === Math.max(...beast.damage_log.map(l => l.damage_dealt / totalDamage));

      rewards = {};
      for (const [res, amt] of Object.entries(config_rewards)) {
        if (typeof amt === 'number') {
          let earned = Math.floor(amt * playerShare);
          if (isLastHitter) earned = Math.floor(earned * 1.2);
          if (isTopDamage) earned = Math.floor(earned * 1.1);
          rewards[res] = Math.max(1, earned);
        } else {
          rewards[res] = amt;
        }
      }

      // Add rewards to city
      const city = await City.findOne({ player_id: req.user.id });
      if (city) {
        for (const [res, amt] of Object.entries(rewards)) {
          if (typeof amt === 'number' && city.resources[res] !== undefined) {
            city.resources[res] += amt;
          }
        }
        await city.save();
      }

      // Update stats
      await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.beastsKilled': 1 } });

      // Create combat report
      await CombatReport.create({
        attacker_id: req.user.id,
        battle_type: 'beast_raid',
        result: 'attacker_win',
        loot: rewards,
        location: { x: beast.map_x, y: beast.map_y },
      });

      logger.info(`Beast killed: ${beast.name} (Lv${beast.level}) by player ${req.user.id}`);
    }

    await beast.save();

    res.json({
      success: true,
      data: {
        beast_id: beast._id,
        damage_dealt: damageDealt,
        damage_received: playerDamageReceived,
        beast_hp_remaining: beast.hp_current,
        killed,
        rewards,
        respawn_at: beast.respawn_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/beasts/data — beast stat table
export const getBeastData = async (req, res, next) => {
  res.json({ success: true, data: BEAST_DATA });
};
