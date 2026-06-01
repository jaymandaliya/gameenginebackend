import Unit from '../models/Unit.model.js';
import City from '../models/City.model.js';
import { UNIT_STATS, UNIT_UNLOCK_LEVELS } from '../services/gameData.service.js';
import logger from '../utils/logger.js';

// GET /api/v1/units  — get all player troops
export const getUnits = async (req, res, next) => {
  try {
    // Collect completed training queues
    const units = await Unit.find({ player_id: req.user.id });
    const now = new Date();

    for (const unit of units) {
      let changed = false;
      const remaining = [];
      for (const q of unit.training_queue) {
        if (q.finish_at <= now) {
          unit.count += q.count;
          changed = true;
        } else {
          remaining.push(q);
        }
      }
      if (changed) {
        unit.training_queue = remaining;
        await unit.save();
      }
    }

    const formatted = units.map(u => ({
      unit_type: u.unit_type,
      tier: u.tier,
      name: UNIT_STATS[u.unit_type]?.[u.tier]?.name || u.unit_type,
      count: u.count,
      wounded: u.wounded,
      status: u.status,
      training_queue: u.training_queue,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/units/stats — full unit stat table
export const getUnitStats = async (req, res, next) => {
  res.json({ success: true, data: UNIT_STATS });
};

// POST /api/v1/units/train — queue troop training
export const trainTroops = async (req, res, next) => {
  try {
    const { unit_type, tier, count } = req.body;

    if (!UNIT_STATS[unit_type]?.[tier]) {
      return res.status(400).json({ success: false, error: 'Invalid unit type or tier' });
    }

    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    const unlockLevel = UNIT_UNLOCK_LEVELS[unit_type]?.[tier] || 1;
    if (city.city_hall_level < unlockLevel) {
      return res.status(400).json({ success: false, error: `Requires City Hall level ${unlockLevel}` });
    }

    // Compute cost
    const stats = UNIT_STATS[unit_type][tier];
    const cost = {};
    for (const [res, amt] of Object.entries(stats.trainCost)) {
      cost[res] = amt * count;
    }

    // Check & deduct resources
    for (const [res, amt] of Object.entries(cost)) {
      if ((city.resources[res] || 0) < amt) {
        return res.status(400).json({ success: false, error: `Insufficient ${res}. Need ${amt}` });
      }
    }
    for (const [res, amt] of Object.entries(cost)) {
      city.resources[res] -= amt;
    }

    // Training time: 60s per unit × tier multiplier
    const trainTimeMsPerUnit = 60000 * Math.pow(1.8, tier - 1);
    const finishAt = new Date(Date.now() + trainTimeMsPerUnit * count);

    let unit = await Unit.findOne({ player_id: req.user.id, unit_type, tier });
    if (!unit) {
      unit = await Unit.create({ player_id: req.user.id, unit_type, tier, count: 0 });
    }

    unit.training_queue.push({ count, finish_at: finishAt, started_at: new Date() });
    await unit.save();
    await city.save();

    logger.info(`Training ${count}x ${unit_type} T${tier} for player ${req.user.id}`);

    res.json({
      success: true,
      message: `Training ${count} ${stats.name} (T${tier})`,
      data: { unit_type, tier, count, finish_at: finishAt, cost },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/units/heal — heal wounded troops
export const healTroops = async (req, res, next) => {
  try {
    const { unit_type, tier, count } = req.body;

    const unit = await Unit.findOne({ player_id: req.user.id, unit_type, tier });
    if (!unit || unit.wounded < count) {
      return res.status(400).json({ success: false, error: 'Not enough wounded troops' });
    }

    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    const hospital = city.buildings.find(b => b.type === 'hospital');
    const hospitalLevel = hospital?.level || 0;
    if (hospitalLevel === 0) {
      return res.status(400).json({ success: false, error: 'No Hospital built' });
    }

    // Heal cost: 30% of train cost
    const stats = UNIT_STATS[unit_type][tier];
    const healCost = {};
    for (const [res, amt] of Object.entries(stats.trainCost)) {
      healCost[res] = Math.floor(amt * count * 0.3);
    }
    for (const [res, amt] of Object.entries(healCost)) {
      if ((city.resources[res] || 0) < amt) {
        return res.status(400).json({ success: false, error: `Insufficient ${res} to heal` });
      }
    }
    for (const [res, amt] of Object.entries(healCost)) {
      city.resources[res] -= amt;
    }

    unit.wounded -= count;
    unit.count += count;
    await unit.save();
    await city.save();

    res.json({ success: true, message: `Healed ${count} ${stats.name}`, data: { unit_type, tier, count, healCost } });
  } catch (error) {
    next(error);
  }
};
