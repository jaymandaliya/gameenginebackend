import Hero from '../models/Hero.model.js';
import City from '../models/City.model.js';
import { HERO_TEMPLATES } from '../services/gameData.service.js';
import logger from '../utils/logger.js';

const EXP_PER_LEVEL = (level) => Math.floor(100 * Math.pow(level, 1.8));

// GET /api/v1/heroes  — get player hero roster
export const getHeroes = async (req, res, next) => {
  try {
    const heroes = await Hero.find({ player_id: req.user.id });
    const roster = HERO_TEMPLATES.map(template => {
      const owned = heroes.find(h => h.template_id === template.id);
      return {
        template,
        owned: owned ? {
          id: owned._id,
          level: owned.level,
          exp: owned.exp,
          exp_to_next: EXP_PER_LEVEL(owned.level),
          stars: owned.stars,
          shards: owned.shards,
          is_unlocked: owned.is_unlocked,
          equipment: owned.equipment,
          status: owned.status,
        } : { shards: 0, is_unlocked: false },
      };
    });

    res.json({ success: true, data: roster });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/heroes/shards/add — add shards to a hero
export const addShards = async (req, res, next) => {
  try {
    const { template_id, shards } = req.body;
    const template = HERO_TEMPLATES.find(t => t.id === template_id);
    if (!template) return res.status(404).json({ success: false, error: 'Hero template not found' });

    let hero = await Hero.findOne({ player_id: req.user.id, template_id });
    if (!hero) {
      hero = await Hero.create({ player_id: req.user.id, template_id, shards: 0 });
    }

    hero.shards += shards;

    // Auto-unlock
    if (!hero.is_unlocked && hero.shards >= template.shardsRequired) {
      hero.is_unlocked = true;
      logger.info(`Hero unlocked: ${template.name} for player ${req.user.id}`);
    }

    await hero.save();
    res.json({ success: true, data: { template_id, shards: hero.shards, is_unlocked: hero.is_unlocked } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/heroes/levelup — add EXP to a hero
export const levelUpHero = async (req, res, next) => {
  try {
    const { template_id, exp } = req.body;
    const hero = await Hero.findOne({ player_id: req.user.id, template_id, is_unlocked: true });
    if (!hero) return res.status(404).json({ success: false, error: 'Hero not found or locked' });

    const template = HERO_TEMPLATES.find(t => t.id === template_id);
    const maxLevel = template?.tier === 'legendary' ? 100 : template?.tier === 'elite' ? 80 : 60;

    hero.exp += exp;

    // Level-up loop
    let leveled = false;
    while (hero.level < maxLevel && hero.exp >= EXP_PER_LEVEL(hero.level)) {
      hero.exp -= EXP_PER_LEVEL(hero.level);
      hero.level += 1;
      leveled = true;
    }

    await hero.save();
    res.json({ success: true, data: { level: hero.level, exp: hero.exp, leveled, exp_to_next: EXP_PER_LEVEL(hero.level) } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/heroes/starup — spend shards to star up
export const starUp = async (req, res, next) => {
  try {
    const { template_id } = req.body;
    const template = HERO_TEMPLATES.find(t => t.id === template_id);
    if (!template) return res.status(404).json({ success: false, error: 'Hero template not found' });

    const hero = await Hero.findOne({ player_id: req.user.id, template_id, is_unlocked: true });
    if (!hero) return res.status(404).json({ success: false, error: 'Hero not found or locked' });

    if (hero.level < (hero.stars === 0 ? template.shardsRequired * 2 : 20 * hero.stars)) {
      return res.status(400).json({ success: false, error: 'Hero must be max level for current stars' });
    }
    if (hero.stars >= 5) return res.status(400).json({ success: false, error: 'Already at 5 stars' });

    const shardsNeeded = template.shardsRequired * (hero.stars + 1);
    if (hero.shards < shardsNeeded) {
      return res.status(400).json({ success: false, error: `Need ${shardsNeeded} shards to star up` });
    }

    hero.shards -= shardsNeeded;
    hero.stars += 1;
    await hero.save();

    res.json({ success: true, message: `${template.name} is now ${hero.stars}★`, data: { stars: hero.stars, shards_remaining: hero.shards } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/heroes/equip — equip an item to hero slot
export const equipItem = async (req, res, next) => {
  try {
    const { template_id, slot, item_id } = req.body;
    const validSlots = ['weapon','armor','helmet','ring','amulet','boots'];
    if (!validSlots.includes(slot)) {
      return res.status(400).json({ success: false, error: `Invalid slot. Valid: ${validSlots.join(', ')}` });
    }

    const hero = await Hero.findOne({ player_id: req.user.id, template_id, is_unlocked: true });
    if (!hero) return res.status(404).json({ success: false, error: 'Hero not found' });

    hero.equipment[slot] = item_id;
    await hero.save();

    res.json({ success: true, data: { slot, item_id, equipment: hero.equipment } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/heroes/templates — all hero templates
export const getTemplates = async (req, res, next) => {
  res.json({ success: true, data: HERO_TEMPLATES });
};
