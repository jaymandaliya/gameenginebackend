import Mine from '../models/Mine.model.js';
import City from '../models/City.model.js';
import { MINE_CONFIGS } from '../services/gameData.service.js';
import logger from '../utils/logger.js';

const OCCUPATION_LIMIT_MS = 6 * 3600 * 1000; // 6 hours max per player per mine

// Seed world mines if none exist
const seedMines = async () => {
  const count = await Mine.countDocuments();
  if (count > 0) return;

  const mines = [];
  const positions = [
    // Borderlands contested mines
    { x: 1200, y: 1200, level: 3, resource_type: 'gold', zone: 'borderlands' },
    { x: 1300, y: 1100, level: 2, resource_type: 'stone', zone: 'borderlands' },
    { x: 1400, y: 1200, level: 4, resource_type: 'gold', zone: 'borderlands' },
    { x: 1500, y: 1300, level: 3, resource_type: 'dragon_energy', zone: 'borderlands' },
    { x: 1600, y: 1200, level: 2, resource_type: 'stone', zone: 'borderlands' },
    // Kingdom contested mines
    { x: 500, y: 500, level: 1, resource_type: 'gold', zone: 'kingdom_1' },
    { x: 600, y: 400, level: 1, resource_type: 'stone', zone: 'kingdom_1' },
    { x: 2500, y: 2500, level: 2, resource_type: 'gold', zone: 'kingdom_2' },
    // Abyss Rift high-level mines
    { x: 2000, y: 2000, level: 5, resource_type: 'dragon_energy', zone: 'abyss_rift' },
    { x: 2100, y: 1900, level: 5, resource_type: 'gold', zone: 'abyss_rift' },
  ];

  for (const pos of positions) {
    const config = MINE_CONFIGS[pos.level - 1];
    mines.push({ ...pos, guard_hp: config.guardStrength, guard_hp_max: config.guardStrength });
  }

  await Mine.insertMany(mines);
  logger.info(`Seeded ${mines.length} world mines`);
};

// GET /api/v1/mines  — get all world mines
export const getMines = async (req, res, next) => {
  try {
    await seedMines();
    const now = new Date();

    // Clear expired occupations
    await Mine.updateMany(
      { occupation_expires_at: { $lt: now }, occupant_id: { $ne: null } },
      { $set: { occupant_id: null, occupant_alliance: null, occupied_at: null, occupation_expires_at: null } }
    );

    const mines = await Mine.find()
      .populate('occupant_id', 'username displayName')
      .populate('occupant_alliance', 'name tag');

    const enriched = mines.map(m => {
      const config = MINE_CONFIGS[m.level - 1];
      return {
        id: m._id,
        map_x: m.map_x,
        map_y: m.map_y,
        level: m.level,
        resource_type: m.resource_type,
        zone: m.zone,
        rates: {
          gold_per_hr: config.goldPerHr,
          stone_per_hr: config.stonePerHr,
          dragon_energy_per_hr: config.dragonEnergyPerHr,
        },
        guard_hp: m.guard_hp,
        guard_hp_max: m.guard_hp_max,
        occupant: m.occupant_id,
        occupant_alliance: m.occupant_alliance,
        occupied_at: m.occupied_at,
        occupation_expires_at: m.occupation_expires_at,
        is_mine: m.occupant_id?.toString() === req.user.id,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/mines/:id/occupy — capture/occupy a mine
export const occupyMine = async (req, res, next) => {
  try {
    const mine = await Mine.findById(req.params.id);
    if (!mine) return res.status(404).json({ success: false, error: 'Mine not found' });

    // Check active occupation limit
    const activeCount = await Mine.countDocuments({ occupant_id: req.user.id, occupation_expires_at: { $gt: new Date() } });
    if (activeCount >= 3) {
      return res.status(400).json({ success: false, error: 'Max 3 mines occupied simultaneously' });
    }

    if (mine.guard_hp > 0) {
      return res.status(400).json({ success: false, error: `Mine has guards (HP: ${mine.guard_hp}). Attack first.` });
    }

    if (mine.occupant_id?.toString() === req.user.id) {
      return res.status(400).json({ success: false, error: 'You already occupy this mine' });
    }

    mine.occupant_id = req.user.id;
    mine.occupied_at = new Date();
    mine.occupation_expires_at = new Date(Date.now() + OCCUPATION_LIMIT_MS);
    mine.last_harvest = new Date();
    await mine.save();

    res.json({ success: true, message: 'Mine occupied', data: { mine_id: mine._id, expires_at: mine.occupation_expires_at } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/mines/:id/attack — attack mine guards
export const attackMineGuards = async (req, res, next) => {
  try {
    const mine = await Mine.findById(req.params.id);
    if (!mine) return res.status(404).json({ success: false, error: 'Mine not found' });

    const { damage } = req.body; // simplified: client sends computed damage
    const actualDamage = Math.min(mine.guard_hp, damage || 500);
    mine.guard_hp = Math.max(0, mine.guard_hp - actualDamage);

    if (mine.guard_hp === 0) {
      mine.occupant_id = null;
      mine.occupied_at = null;
      mine.occupation_expires_at = null;
    }

    await mine.save();

    res.json({
      success: true,
      data: {
        guard_hp_remaining: mine.guard_hp,
        guards_defeated: mine.guard_hp === 0,
        damage_dealt: actualDamage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/mines/:id/harvest — collect resources from occupied mine
export const harvestMine = async (req, res, next) => {
  try {
    const mine = await Mine.findById(req.params.id);
    if (!mine) return res.status(404).json({ success: false, error: 'Mine not found' });

    if (mine.occupant_id?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You do not occupy this mine' });
    }

    const now = new Date();
    const elapsedHrs = (now - new Date(mine.last_harvest)) / 3600000;
    const config = MINE_CONFIGS[mine.level - 1];

    const harvest = {
      gold:          Math.floor(config.goldPerHr * elapsedHrs),
      stone:         Math.floor(config.stonePerHr * elapsedHrs),
      dragon_energy: Math.floor(config.dragonEnergyPerHr * elapsedHrs),
    };

    // Add to city resources
    const city = await City.findOne({ player_id: req.user.id });
    if (city) {
      city.resources.gold          = (city.resources.gold || 0) + harvest.gold;
      city.resources.stone         = (city.resources.stone || 0) + harvest.stone;
      city.resources.dragon_energy = (city.resources.dragon_energy || 0) + harvest.dragon_energy;
      await city.save();
    }

    mine.last_harvest = now;
    await mine.save();

    res.json({ success: true, data: harvest });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/mines/:id/vacate
export const vacateMine = async (req, res, next) => {
  try {
    const mine = await Mine.findById(req.params.id);
    if (!mine) return res.status(404).json({ success: false, error: 'Mine not found' });

    if (mine.occupant_id?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You do not occupy this mine' });
    }

    mine.occupant_id = null;
    mine.occupant_alliance = null;
    mine.occupied_at = null;
    mine.occupation_expires_at = null;
    await mine.save();

    res.json({ success: true, message: 'Vacated mine' });
  } catch (error) {
    next(error);
  }
};
