import City from '../models/City.model.js';
import User from '../models/User.model.js';
import { CITY_HALL_REQUIREMENTS, BEGINNER_SHIELD_MS, RESOURCE_BASE_RATES } from '../services/gameData.service.js';
import logger from '../utils/logger.js';

// Helper: compute pending resources since last tick
const computeResourceTick = (city) => {
  const now = Date.now();
  const lastTick = new Date(city.last_resource_tick).getTime();
  const elapsedHrs = (now - lastTick) / 3600000;
  if (elapsedHrs < 0.016) return; // skip if < 1 min

  for (const [resType, config] of Object.entries(RESOURCE_BASE_RATES)) {
    const building = city.buildings.find(b => b.type === config.buildingType);
    if (!building) continue;
    const rate = config.perLevel * building.level;
    city.resources[resType] = (city.resources[resType] || 0) + Math.floor(rate * elapsedHrs);
  }

  // Cap storage
  const chLevel = city.city_hall_level;
  const cap = 50000 * Math.pow(1.5, chLevel - 1);
  for (const key of Object.keys(city.resources)) {
    if (key !== 'gems') city.resources[key] = Math.min(city.resources[key], Math.floor(cap));
  }

  city.last_resource_tick = new Date();
};

// GET /api/v1/city  — get current player's city
export const getCity = async (req, res, next) => {
  try {
    let city = await City.findOne({ player_id: req.user.id });

    if (!city) {
      // Auto-create city on first access
      const x = Math.floor(Math.random() * 3000);
      const y = Math.floor(Math.random() * 3000);
      city = await City.create({
        player_id: req.user.id,
        map_x: x, map_y: y,
        beginner_shield_until: new Date(Date.now() + BEGINNER_SHIELD_MS),
        buildings: [
          { type: 'goldmine', level: 1 },
          { type: 'farm', level: 1 },
          { type: 'lumber_mill', level: 1 },
          { type: 'quarry', level: 1 },
          { type: 'barracks', level: 1 },
          { type: 'wall', level: 1 },
        ],
      });
    }

    computeResourceTick(city);
    // Update shield status
    if (city.beginner_shield_until && new Date() > city.beginner_shield_until) {
      city.is_shielded = false;
    }
    await city.save();

    res.json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/city/map?x1=&y1=&x2=&y2= — get cities in area
export const getCitiesInArea = async (req, res, next) => {
  try {
    const { x1 = 0, y1 = 0, x2 = 100, y2 = 100 } = req.query;
    const cities = await City.find({
      map_x: { $gte: Number(x1), $lte: Number(x2) },
      map_y: { $gte: Number(y1), $lte: Number(y2) },
    }).select('player_id name map_x map_y city_hall_level power_score is_shielded').limit(200);

    res.json({ success: true, data: cities });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/city/building/upgrade  — upgrade a building
export const upgradeBuilding = async (req, res, next) => {
  try {
    const { building_type } = req.body;
    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    computeResourceTick(city);

    let building = city.buildings.find(b => b.type === building_type);
    if (!building) {
      city.buildings.push({ type: building_type, level: 0 });
      building = city.buildings[city.buildings.length - 1];
    }

    if (building.upgrading_until && new Date() < building.upgrading_until) {
      return res.status(400).json({ success: false, error: 'Building already upgrading' });
    }

    const nextLevel = building.level + 1;
    const upgradeCost = { gold: 500 * Math.pow(2, nextLevel - 1), food: 200 * Math.pow(1.8, nextLevel - 1) };
    const upgradeTime = 60 * Math.pow(2, nextLevel - 1) * 1000; // ms

    // Check resources
    if (city.resources.gold < upgradeCost.gold) {
      return res.status(400).json({ success: false, error: 'Insufficient gold' });
    }

    city.resources.gold -= Math.floor(upgradeCost.gold);
    city.resources.food -= Math.floor(Math.min(city.resources.food, upgradeCost.food));

    building.upgrading_until = new Date(Date.now() + upgradeTime);

    await city.save();

    logger.info(`Building upgrade: ${building_type} → Lv${nextLevel} for player ${req.user.id}`);

    res.json({
      success: true,
      message: `${building_type} upgrading to level ${nextLevel}`,
      data: { building_type, next_level: nextLevel, finish_at: building.upgrading_until, cost: upgradeCost },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/city/building/collect — collect a completed building upgrade
export const collectBuildingUpgrade = async (req, res, next) => {
  try {
    const { building_type } = req.body;
    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    const building = city.buildings.find(b => b.type === building_type);
    if (!building) return res.status(404).json({ success: false, error: 'Building not found' });
    if (!building.upgrading_until) return res.status(400).json({ success: false, error: 'No upgrade in progress' });
    if (new Date() < building.upgrading_until) {
      return res.status(400).json({ success: false, error: 'Upgrade not complete yet' });
    }

    building.level += 1;
    building.upgrading_until = null;

    // Sync special buildings to city fields
    if (building_type === 'wall') city.wall_level = building.level;
    if (building_type === 'city_hall') {
      city.city_hall_level = building.level;
      await User.findByIdAndUpdate(req.user.id, { city_hall_level: building.level });
    }

    city.power_score += building.level * 100;
    await city.save();

    res.json({ success: true, data: { building_type, new_level: building.level } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/city/speedup — apply speedup item to building
export const applySpeedup = async (req, res, next) => {
  try {
    const { building_type, speedup_ms } = req.body;
    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    const building = city.buildings.find(b => b.type === building_type);
    if (!building || !building.upgrading_until) {
      return res.status(400).json({ success: false, error: 'No upgrade in progress' });
    }

    const newFinishAt = new Date(building.upgrading_until.getTime() - speedup_ms);
    building.upgrading_until = newFinishAt < new Date() ? new Date() : newFinishAt;

    await city.save();
    res.json({ success: true, data: { building_type, new_finish_at: building.upgrading_until } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/city/resources — get current resources with live tick
export const getCityResources = async (req, res, next) => {
  try {
    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    computeResourceTick(city);
    await city.save();

    // Compute production rates for UI
    const rates = {};
    for (const [resType, config] of Object.entries(RESOURCE_BASE_RATES)) {
      const building = city.buildings.find(b => b.type === config.buildingType);
      rates[resType] = building ? config.perLevel * building.level : 0;
    }

    res.json({ success: true, data: { resources: city.resources, rates_per_hr: rates } });
  } catch (error) {
    next(error);
  }
};
