import Dragon from '../models/Dragon.model.js';
import City from '../models/City.model.js';
import { DRAGON_DATA } from '../services/gameData.service.js';
import logger from '../utils/logger.js';

const DRAGON_EXP_FOR_LEVEL = (level) => Math.floor(1000 * Math.pow(level, 1.8));
const REVIVE_COST_DRAGON_ENERGY = 500;
const REVIVE_DURATION_MS = 24 * 3600 * 1000;

// GET /api/v1/dragons  — get player dragons
export const getDragons = async (req, res, next) => {
  try {
    const dragons = await Dragon.find({ player_id: req.user.id });
    const now = new Date();

    // Auto-complete revives/heals
    for (const d of dragons) {
      if (d.status === 'dead' && d.revive_at && d.revive_at <= now) {
        d.status = 'idle';
        d.hp_current = Math.floor(d.hp_max * 0.5);
        d.revive_at = null;
        await d.save();
      }
      if (d.status === 'healing' && d.heal_at && d.heal_at <= now) {
        d.status = 'idle';
        d.hp_current = d.hp_max;
        d.heal_at = null;
        await d.save();
      }
    }

    const data = Object.entries(DRAGON_DATA).map(([type, config]) => {
      const owned = dragons.find(d => d.dragon_type === type);
      return {
        type, config,
        owned: owned ? {
          id: owned._id,
          level: owned.level,
          exp: owned.exp,
          exp_to_next: DRAGON_EXP_FOR_LEVEL(owned.level),
          hp_current: owned.hp_current,
          hp_max: owned.hp_max,
          status: owned.status,
          revive_at: owned.revive_at,
          heal_at: owned.heal_at,
        } : null,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/dragons/hatch — hatch a dragon (requires egg + dragon_energy)
export const hatchDragon = async (req, res, next) => {
  try {
    const { dragon_type } = req.body;
    const config = DRAGON_DATA[dragon_type];
    if (!config) return res.status(400).json({ success: false, error: 'Unknown dragon type' });

    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    const dragonLair = city.buildings.find(b => b.type === 'dragon_lair');
    if (!dragonLair || dragonLair.level < 1) {
      return res.status(400).json({ success: false, error: 'Dragon Lair required (Lv 1+)' });
    }
    if (city.city_hall_level < config.unlockLevel) {
      return res.status(400).json({ success: false, error: `Requires City Hall level ${config.unlockLevel}` });
    }

    const HATCH_COST = 500;
    if ((city.resources.dragon_energy || 0) < HATCH_COST) {
      return res.status(400).json({ success: false, error: `Need ${HATCH_COST} Dragon Energy to hatch` });
    }

    const existing = await Dragon.findOne({ player_id: req.user.id, dragon_type });
    if (existing) return res.status(400).json({ success: false, error: 'Dragon already hatched' });

    city.resources.dragon_energy -= HATCH_COST;
    await city.save();

    const dragon = await Dragon.create({
      player_id: req.user.id,
      dragon_type,
      hp_current: config.baseHp,
      hp_max: config.baseHp,
    });

    logger.info(`Dragon hatched: ${dragon_type} for player ${req.user.id}`);
    res.status(201).json({ success: true, message: `${config.name} hatched!`, data: dragon });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/dragons/levelup — add EXP to dragon
export const levelUpDragon = async (req, res, next) => {
  try {
    const { dragon_type, exp } = req.body;

    const dragon = await Dragon.findOne({ player_id: req.user.id, dragon_type });
    if (!dragon) return res.status(404).json({ success: false, error: 'Dragon not found' });

    const city = await City.findOne({ player_id: req.user.id });
    const energyCost = Math.ceil(exp / 10);
    if (!city || (city.resources.dragon_energy || 0) < energyCost) {
      return res.status(400).json({ success: false, error: `Need ${energyCost} Dragon Energy` });
    }

    city.resources.dragon_energy -= energyCost;
    await city.save();

    dragon.exp += exp;
    while (dragon.level < 50 && dragon.exp >= DRAGON_EXP_FOR_LEVEL(dragon.level)) {
      dragon.exp -= DRAGON_EXP_FOR_LEVEL(dragon.level);
      dragon.level += 1;
      // HP scales with level
      const newHpMax = Math.floor(DRAGON_DATA[dragon_type].baseHp * (1 + dragon.level * 0.02));
      dragon.hp_max = newHpMax;
    }

    await dragon.save();
    res.json({ success: true, data: { level: dragon.level, exp: dragon.exp, exp_to_next: DRAGON_EXP_FOR_LEVEL(dragon.level), hp_max: dragon.hp_max } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/dragons/heal — start healing a wounded dragon
export const healDragon = async (req, res, next) => {
  try {
    const { dragon_type } = req.body;
    const dragon = await Dragon.findOne({ player_id: req.user.id, dragon_type });
    if (!dragon) return res.status(404).json({ success: false, error: 'Dragon not found' });
    if (dragon.status === 'dead') return res.status(400).json({ success: false, error: 'Dragon is dead — use revive' });
    if (dragon.hp_current >= dragon.hp_max) return res.status(400).json({ success: false, error: 'Dragon is at full HP' });

    const city = await City.findOne({ player_id: req.user.id });
    const healCost = Math.ceil((dragon.hp_max - dragon.hp_current) / 100);
    if (!city || (city.resources.dragon_energy || 0) < healCost) {
      return res.status(400).json({ success: false, error: `Need ${healCost} Dragon Energy to heal` });
    }

    const healDuration = Math.ceil((dragon.hp_max - dragon.hp_current) / 100) * 60 * 1000;
    city.resources.dragon_energy -= healCost;
    await city.save();

    dragon.status = 'healing';
    dragon.heal_at = new Date(Date.now() + healDuration);
    await dragon.save();

    res.json({ success: true, data: { status: 'healing', heal_at: dragon.heal_at, energy_cost: healCost } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/dragons/deploy
export const deployDragon = async (req, res, next) => {
  try {
    const { dragon_type } = req.body;
    const dragon = await Dragon.findOne({ player_id: req.user.id, dragon_type });
    if (!dragon) return res.status(404).json({ success: false, error: 'Dragon not found' });
    if (dragon.status !== 'idle') return res.status(400).json({ success: false, error: `Dragon is ${dragon.status}` });

    dragon.status = 'deployed';
    await dragon.save();
    res.json({ success: true, data: { status: 'deployed' } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/dragons/recall
export const recallDragon = async (req, res, next) => {
  try {
    const { dragon_type } = req.body;
    const dragon = await Dragon.findOne({ player_id: req.user.id, dragon_type });
    if (!dragon) return res.status(404).json({ success: false, error: 'Dragon not found' });
    if (dragon.status !== 'deployed') return res.status(400).json({ success: false, error: 'Dragon is not deployed' });

    dragon.status = 'idle';
    await dragon.save();
    res.json({ success: true, data: { status: 'idle' } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/dragons/revive
export const reviveDragon = async (req, res, next) => {
  try {
    const { dragon_type } = req.body;
    const dragon = await Dragon.findOne({ player_id: req.user.id, dragon_type });
    if (!dragon || dragon.status !== 'dead') {
      return res.status(400).json({ success: false, error: 'Dragon is not dead' });
    }

    const city = await City.findOne({ player_id: req.user.id });
    if (!city || (city.resources.dragon_energy || 0) < REVIVE_COST_DRAGON_ENERGY) {
      return res.status(400).json({ success: false, error: `Need ${REVIVE_COST_DRAGON_ENERGY} Dragon Energy to revive` });
    }

    city.resources.dragon_energy -= REVIVE_COST_DRAGON_ENERGY;
    await city.save();

    dragon.status = 'dead';
    dragon.revive_at = new Date(Date.now() + REVIVE_DURATION_MS);
    await dragon.save();

    res.json({ success: true, data: { revive_at: dragon.revive_at, energy_cost: REVIVE_COST_DRAGON_ENERGY } });
  } catch (error) {
    next(error);
  }
};
