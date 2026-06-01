import User from '../models/User.model.js';
import City from '../models/City.model.js';
import { FACTION_SPELLS, FACTION_PASSIVES } from '../services/gameData.service.js';
import logger from '../utils/logger.js';

// GET /api/v1/magic/factions  — available factions & their spells
export const getFactions = async (req, res, next) => {
  const factions = Object.entries(FACTION_SPELLS).map(([id, spells]) => ({
    id, passive: FACTION_PASSIVES[id], spells,
  }));
  res.json({ success: true, data: factions });
};

// POST /api/v1/magic/faction  — choose faction (permanent, CH 15+)
export const chooseFaction = async (req, res, next) => {
  try {
    const { faction } = req.body;
    if (!['elf','goblin','demon','fairy'].includes(faction)) {
      return res.status(400).json({ success: false, error: 'Invalid faction' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.faction) return res.status(400).json({ success: false, error: 'Faction already chosen — permanent choice' });

    const city = await City.findOne({ player_id: req.user.id });
    if (!city || city.city_hall_level < 15) {
      return res.status(400).json({ success: false, error: 'City Hall level 15 required to choose a faction' });
    }

    user.faction = faction;
    await user.save();

    logger.info(`Faction chosen: ${faction} by player ${req.user.id}`);
    res.json({ success: true, message: `You have joined the ${faction} faction!`, data: { faction, passive: FACTION_PASSIVES[faction] } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/magic/spells  — get player's available spells + cooldowns
export const getSpells = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (!user.faction) return res.status(400).json({ success: false, error: 'No faction chosen yet' });

    const spells = FACTION_SPELLS[user.faction] || [];
    const now = new Date();

    const enriched = spells.map(spell => {
      const cdUntil = user.spell_cooldowns?.get(spell.id);
      const onCooldown = cdUntil && cdUntil > now;
      return {
        ...spell,
        on_cooldown: onCooldown,
        cooldown_until: onCooldown ? cdUntil : null,
        cooldown_remaining_s: onCooldown ? Math.ceil((cdUntil - now) / 1000) : 0,
      };
    });

    const city = await City.findOne({ player_id: req.user.id });

    res.json({
      success: true,
      data: {
        faction: user.faction,
        passive: FACTION_PASSIVES[user.faction],
        spells: enriched,
        current_mana: city?.resources?.mana || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/magic/cast  — cast a spell
export const castSpell = async (req, res, next) => {
  try {
    const { spell_id, target_player_id } = req.body;

    const user = await User.findById(req.user.id);
    if (!user || !user.faction) {
      return res.status(400).json({ success: false, error: 'No faction chosen' });
    }

    const spells = FACTION_SPELLS[user.faction] || [];
    const spell = spells.find(s => s.id === spell_id);
    if (!spell) return res.status(404).json({ success: false, error: 'Spell not found for your faction' });

    const now = new Date();
    const cdUntil = user.spell_cooldowns?.get(spell.id);
    if (cdUntil && cdUntil > now) {
      const remainS = Math.ceil((cdUntil - now) / 1000);
      return res.status(400).json({ success: false, error: `Spell on cooldown. Ready in ${remainS}s` });
    }

    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    // Check mana cost (factor in magic_immune status if targeting self-buffs)
    const magicTower = city.buildings.find(b => b.type === 'magic_tower');
    if (!magicTower) return res.status(400).json({ success: false, error: 'Magic Tower required' });

    if ((city.resources.mana || 0) < spell.manaCost) {
      return res.status(400).json({ success: false, error: `Insufficient Mana. Need ${spell.manaCost}` });
    }

    city.resources.mana -= spell.manaCost;
    await city.save();

    // Apply effect (simplified server-side resolution)
    const effect = spell.effect;
    let resultMessage = `Cast ${spell.name}`;
    let effectApplied = {};

    switch (effect.type) {
      case 'heal_wounded': {
        // Heal 20% of wounded troops — signal to client
        effectApplied = { heal_pct: effect.pct, duration: 'instant' };
        resultMessage = `Healing Rain heals ${Math.floor(effect.pct * 100)}% of wounded troops`;
        break;
      }
      case 'def_buff':
      case 'atk_hp_trade':
      case 'march_speed': {
        // Store as active spell on user
        const expiresAt = new Date(Date.now() + (effect.durationH || 2) * 3600 * 1000);
        user.active_spells.push({ spell_id, expires_at: expiresAt, effect });
        effectApplied = { expires_at: expiresAt, effect };
        resultMessage = `${spell.name} active until ${expiresAt.toISOString()}`;
        break;
      }
      case 'destroy_low_tier': {
        // Client/server resolves in next battle — store as pending effect
        const expiresAt = new Date(Date.now() + 3600 * 1000);
        user.active_spells.push({ spell_id, expires_at: expiresAt, effect });
        effectApplied = { next_battle_effect: effect };
        break;
      }
      case 'instant_scout': {
        effectApplied = { scout_result: 'Revealed 20×20 tile area around target' };
        break;
      }
      case 'gather_speed':
      case 'mana_regen': {
        const expiresAt = new Date(Date.now() + (effect.durationH || 4) * 3600 * 1000);
        user.active_spells.push({ spell_id, expires_at: expiresAt, effect });
        effectApplied = { expires_at: expiresAt };
        break;
      }
      default:
        effectApplied = { effect };
    }

    // Set cooldown
    if (!user.spell_cooldowns) user.spell_cooldowns = new Map();
    user.spell_cooldowns.set(spell.id, new Date(Date.now() + spell.cdHours * 3600 * 1000));
    user.markModified('spell_cooldowns');
    user.markModified('active_spells');
    await user.save();

    logger.info(`Spell cast: ${spell_id} by player ${req.user.id}`);

    res.json({
      success: true,
      message: resultMessage,
      data: {
        spell_id,
        mana_remaining: city.resources.mana,
        cooldown_until: user.spell_cooldowns.get(spell.id),
        effect_applied: effectApplied,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/magic/active  — get currently active spells/buffs
export const getActiveSpells = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const now = new Date();
    const active = (user.active_spells || []).filter(s => s.expires_at > now);

    // Clean expired spells
    if (active.length !== user.active_spells.length) {
      user.active_spells = active;
      await user.save();
    }

    res.json({ success: true, data: active });
  } catch (error) {
    next(error);
  }
};
