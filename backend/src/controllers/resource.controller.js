import City from '../models/City.model.js';
import User from '../models/User.model.js';
import { RESOURCE_BASE_RATES } from '../services/gameData.service.js';

// GET /api/v1/resources  — get player's city resources
export const getResources = async (req, res, next) => {
  try {
    const city = await City.findOne({ player_id: req.user.id });
    if (!city) {
      return res.json({ success: true, data: { gold: 0, food: 0, wood: 0, stone: 0, mana: 0, dragon_energy: 0, trade_goods: 0, gems: 0 } });
    }
    res.json({ success: true, data: city.resources });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/resources  — update resources (admin/system use)
export const updateResources = async (req, res, next) => {
  try {
    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    const allowed = ['gold','food','wood','stone','mana','dragon_energy','trade_goods','gems'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) city.resources[key] = Number(req.body[key]);
    }
    await city.save();
    res.json({ success: true, data: city.resources });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/resources/add
export const addResources = async (req, res, next) => {
  try {
    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    const allowed = ['gold','food','wood','stone','mana','dragon_energy','trade_goods','gems'];
    for (const key of allowed) {
      if (req.body[key]) city.resources[key] = (city.resources[key] || 0) + Number(req.body[key]);
    }
    await city.save();
    res.json({ success: true, data: city.resources });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/resources/spend
export const spendResources = async (req, res, next) => {
  try {
    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    const allowed = ['gold','food','wood','stone','mana','dragon_energy','trade_goods','gems'];

    // Check all have enough
    for (const key of allowed) {
      if (req.body[key] && (city.resources[key] || 0) < Number(req.body[key])) {
        return res.status(400).json({ success: false, error: `Insufficient ${key}. Have ${city.resources[key] || 0}, need ${req.body[key]}` });
      }
    }

    for (const key of allowed) {
      if (req.body[key]) city.resources[key] = (city.resources[key] || 0) - Number(req.body[key]);
    }
    await city.save();
    res.json({ success: true, data: city.resources });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/resources/rates — production rates
export const getResourceRates = async (req, res, next) => {
  try {
    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.json({ success: true, data: {} });

    const rates = {};
    for (const [resType, config] of Object.entries(RESOURCE_BASE_RATES)) {
      const building = city.buildings.find(b => b.type === config.buildingType);
      rates[resType] = { per_hr: building ? config.perLevel * building.level : 0, building: config.buildingType };
    }
    res.json({ success: true, data: rates });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/resources/leaderboard — top players by power
export const getLeaderboard = async (req, res, next) => {
  try {
    const cities = await City.find().sort({ power_score: -1 }).limit(50)
      .populate('player_id', 'username displayName level');

    res.json({
      success: true,
      data: cities.map((c, i) => ({
        rank:          i + 1,
        username:      c.player_id?.username,
        city_name:     c.name,
        city_hall_level: c.city_hall_level,
        power_score:   c.power_score,
        terrain:       c.terrain_type,
      })),
    });
  } catch (error) {
    next(error);
  }
};
