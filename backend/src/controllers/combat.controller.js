import CombatReport from '../models/CombatReport.model.js';
import Unit from '../models/Unit.model.js';
import Hero from '../models/Hero.model.js';
import Dragon from '../models/Dragon.model.js';
import City from '../models/City.model.js';
import User from '../models/User.model.js';
import March from '../models/March.model.js';
import { HERO_TEMPLATES, DRAGON_DATA } from '../services/gameData.service.js';
import { resolveBattle, calculateLoot, resolveHeroDuel } from '../services/combat.service.js';
import logger from '../utils/logger.js';

// Build troops map from Unit documents
const buildTroopsMap = async (playerId) => {
  const units = await Unit.find({ player_id: playerId, count: { $gt: 0 } });
  const map = {};
  for (const u of units) {
    if (!map[u.unit_type]) map[u.unit_type] = {};
    map[u.unit_type][u.tier] = u.count;
  }
  return map;
};

// Build hero stat object from Hero document
const buildHeroStats = async (heroId) => {
  if (!heroId) return null;
  const hero = await Hero.findById(heroId);
  if (!hero || !hero.is_unlocked) return null;
  const template = HERO_TEMPLATES.find(t => t.id === hero.template_id);
  if (!template) return null;

  const levelMod = 1 + hero.level * 0.05;
  const starMod  = 1 + hero.stars * 0.10;
  return {
    id: hero._id,
    name: template.name,
    tier: template.tier,
    class: template.class,
    atk:   Math.floor(template.baseAtk  * levelMod * starMod),
    def:   Math.floor(template.baseDef  * levelMod),
    hp:    Math.floor(template.baseHp   * levelMod * starMod),
    speed: template.baseSpeed,
    passives: template.passives,
    actives:  template.actives,
  };
};

// POST /api/v1/combat/attack — launch attack on another player
export const attackPlayer = async (req, res, next) => {
  try {
    const { defender_id, troops, hero_id, dragon_id, spell_mod = 0 } = req.body;

    const attacker = await User.findById(req.user.id);
    const defender = await User.findById(defender_id);
    if (!defender) return res.status(404).json({ success: false, error: 'Defender not found' });

    // Check shield
    const defenderCity = await City.findOne({ player_id: defender_id });
    if (defenderCity?.is_shielded && defenderCity?.beginner_shield_until > new Date()) {
      return res.status(400).json({ success: false, error: 'Target is under beginner shield protection' });
    }

    // Attacker breaks their own shield on first attack
    const attackerCity = await City.findOne({ player_id: req.user.id });
    if (attackerCity?.is_shielded) {
      attackerCity.is_shielded = false;
      await attackerCity.save();
    }

    // Build defender troops
    const defenderTroops = await buildTroopsMap(defender_id);

    // Build hero stats
    const attackerHero = await buildHeroStats(hero_id);
    const defenderHeroDoc = await Hero.findOne({ player_id: defender_id, status: 'idle', is_unlocked: true });
    const defenderHero = await buildHeroStats(defenderHeroDoc?._id);

    // Dragon
    let attackerDragon = null;
    if (dragon_id) {
      const dragonDoc = await Dragon.findOne({ _id: dragon_id, player_id: req.user.id, status: 'idle' });
      if (dragonDoc) {
        attackerDragon = { dragon_type: dragonDoc.dragon_type, level: dragonDoc.level };
      }
    }

    // Resolve battle using GDD formula
    const battleResult = resolveBattle({
      attackerTroops: troops,
      defenderTroops,
      terrainType:    defenderCity?.terrain_type || 'plains',
      wallLevel:      defenderCity?.wall_level || 1,
      attackerTech:   attacker.tech_bonuses || {},
      defenderTech:   defender.tech_bonuses || {},
      attackerHero,
      defenderHero,
      attackerDragon,
      attackerSpellMod: spell_mod,
    });

    // Calculate loot if attacker wins
    let loot = {};
    if (battleResult.result === 'attacker_win') {
      const protectionPct = defender.tech_bonuses?.resource_protection || 0;
      loot = calculateLoot(defenderCity?.resources || {}, 50000, protectionPct);

      // Deduct from defender
      if (defenderCity) {
        for (const [res, amt] of Object.entries(loot)) {
          if (defenderCity.resources[res]) defenderCity.resources[res] = Math.max(0, defenderCity.resources[res] - amt);
        }
        await defenderCity.save();
      }
      // Add to attacker
      if (attackerCity) {
        for (const [res, amt] of Object.entries(loot)) {
          attackerCity.resources[res] = (attackerCity.resources[res] || 0) + amt;
        }
        await attackerCity.save();
      }
    }

    // Apply troop losses to attacker
    for (const [unitType, tierCounts] of Object.entries(battleResult.attackerSurvivors)) {
      for (const [tier, count] of Object.entries(tierCounts)) {
        const originalCount = troops[unitType]?.[tier] || 0;
        const lost = originalCount - count;
        if (lost > 0) {
          await Unit.findOneAndUpdate(
            { player_id: req.user.id, unit_type: unitType, tier: Number(tier) },
            { $inc: { count: -Math.min(lost, originalCount), wounded: Math.floor(lost * 0.7) } }
          );
        }
      }
    }

    // Update stats
    const attackerWon = battleResult.result === 'attacker_win';
    await User.findByIdAndUpdate(req.user.id, {
      $inc: {
        'stats.battlesWon': attackerWon ? 1 : 0,
        'stats.wins': attackerWon ? 1 : 0,
        'stats.losses': attackerWon ? 0 : 1,
        battle_medals: attackerWon ? 20 : 5,
      }
    });

    // Save combat report
    const report = await CombatReport.create({
      attacker_id:          req.user.id,
      defender_id,
      battle_type:          'pvp',
      attacker_troops:      troops,
      defender_troops:      defenderTroops,
      attacker_hero:        attackerHero,
      defender_hero:        defenderHero,
      terrain_type:         defenderCity?.terrain_type,
      wall_level:           defenderCity?.wall_level || 1,
      result:               battleResult.result,
      rounds:               battleResult.rounds,
      loot,
      attacker_power_score: attackerCity?.power_score || 0,
      defender_power_score: defenderCity?.power_score || 0,
      location:             defenderCity ? { x: defenderCity.map_x, y: defenderCity.map_y } : null,
    });

    logger.info(`Battle: ${attacker.username} vs ${defender.username} — ${battleResult.result} in ${battleResult.roundsPlayed} rounds`);

    res.json({
      success: true,
      data: {
        result:         battleResult.result,
        rounds_played:  battleResult.roundsPlayed,
        attacker_losses: battleResult.attackerLossCount,
        defender_losses: battleResult.defenderLossCount,
        loot,
        report_id:      report._id,
        rounds:         battleResult.rounds,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/combat/simulate  — simulate a battle without committing (preview)
export const simulateBattle = async (req, res, next) => {
  try {
    const { attacker_troops, defender_troops, terrain_type = 'plains', wall_level = 1 } = req.body;

    const user = await User.findById(req.user.id);

    const result = resolveBattle({
      attackerTroops: attacker_troops,
      defenderTroops: defender_troops,
      terrainType:    terrain_type,
      wallLevel:      wall_level,
      attackerTech:   user?.tech_bonuses || {},
    });

    res.json({ success: true, data: { result: result.result, rounds: result.rounds, rounds_played: result.roundsPlayed } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/combat/reports — get player's battle reports
export const getCombatReports = async (req, res, next) => {
  try {
    const reports = await CombatReport.find({
      $or: [{ attacker_id: req.user.id }, { defender_id: req.user.id }],
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

// GET /api/v1/combat/reports/:id
export const getCombatReport = async (req, res, next) => {
  try {
    const report = await CombatReport.findById(req.params.id)
      .populate('attacker_id', 'username displayName')
      .populate('defender_id', 'username displayName');

    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/combat/march — march troops to a target
export const marchTroops = async (req, res, next) => {
  try {
    const { target_player_id, target_x, target_y, troops, action, hero_id, dragon_id } = req.body;

    const attackerCity = await City.findOne({ player_id: req.user.id });
    if (!attackerCity) return res.status(404).json({ success: false, error: 'City not found' });

    // Check march queue limit
    const activeMarchCount = await March.countDocuments({ player_id: req.user.id, status: { $in: ['marching','at_target','returning'] } });
    const user = await User.findById(req.user.id);
    const maxMarches = (user?.tech_bonuses?.march_queue || 2);
    if (activeMarchCount >= maxMarches) {
      return res.status(400).json({ success: false, error: `March queue full (max ${maxMarches})` });
    }

    // Calculate march time (simplified: 60s per 100 tiles distance)
    const destX = target_x || 1500;
    const destY = target_y || 1500;
    const distance = Math.sqrt(Math.pow(destX - attackerCity.map_x, 2) + Math.pow(destY - attackerCity.map_y, 2));
    const marchSpeedBonus = 1 + (user?.tech_bonuses?.march_speed || 0);
    const marchTimeMs = Math.max(30000, Math.floor(distance * 600 / marchSpeedBonus));

    const arriveAt = new Date(Date.now() + marchTimeMs);

    const march = await March.create({
      player_id:        req.user.id,
      type:             action || 'attack',
      target_player_id,
      target_x:         destX,
      target_y:         destY,
      troops,
      hero_id,
      dragon_id,
      arrive_at:        arriveAt,
      return_at:        new Date(arriveAt.getTime() + marchTimeMs),
    });

    res.json({
      success: true,
      message:  `Troops marching. ETA: ${arriveAt.toISOString()}`,
      data:     { march_id: march._id, arrive_at: arriveAt, return_at: march.return_at, distance: Math.floor(distance) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/combat/recall — recall a march
export const recallTroops = async (req, res, next) => {
  try {
    const { march_id } = req.body;
    const march = await March.findOne({ _id: march_id, player_id: req.user.id });
    if (!march) return res.status(404).json({ success: false, error: 'March not found' });
    if (!['marching','at_target'].includes(march.status)) {
      return res.status(400).json({ success: false, error: 'Cannot recall this march' });
    }

    march.status = 'recalled';
    march.return_at = new Date(Date.now() + 60000);
    await march.save();

    res.json({ success: true, message: 'Troops recalled', data: { return_at: march.return_at } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/combat/marches — get active marches
export const getActiveMarches = async (req, res, next) => {
  try {
    const marches = await March.find({
      player_id: req.user.id,
      status: { $in: ['marching','at_target','returning'] },
    });
    res.json({ success: true, data: marches });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/combat/duel — 1v1 hero duel in Arena
export const startHeroDuel = async (req, res, next) => {
  try {
    const { my_hero_id, opponent_player_id, opponent_hero_id } = req.body;

    const myHero = await buildHeroStats(my_hero_id);
    const oppHero = await buildHeroStats(opponent_hero_id);
    if (!myHero) return res.status(400).json({ success: false, error: 'Your hero not found/locked' });
    if (!oppHero) return res.status(400).json({ success: false, error: 'Opponent hero not found' });

    const result = resolveHeroDuel(myHero, oppHero);

    const won = result.winner === 'A';
    const heroTokens = won ? 20 : 5;
    const battleMedals = won ? 10 : 2;

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { hero_tokens: heroTokens, battle_medals: battleMedals },
    });

    await CombatReport.create({
      attacker_id:  req.user.id,
      defender_id:  opponent_player_id,
      battle_type:  'duel',
      attacker_hero: myHero,
      defender_hero: oppHero,
      result: won ? 'attacker_win' : 'defender_win',
      rounds: result.log.map((l, i) => ({ round_number: i + 1, attacker_dmg: 0, defender_dmg: 0, dragon_skill_used: null })),
    });

    res.json({
      success: true,
      data: {
        winner: result.winner === 'A' ? 'you' : 'opponent',
        hp_remaining: { you: result.hpA, opponent: result.hpB },
        log: result.log,
        rewards: { hero_tokens: heroTokens, battle_medals: battleMedals },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/combat/formations — available battle formations
export const getFormations = async (req, res, next) => {
  const formations = [
    { id: 'offensive',  name: 'Offensive',  attack_bonus: 0.10, defense_penalty: -0.05 },
    { id: 'defensive',  name: 'Defensive',  attack_penalty: -0.05, defense_bonus: 0.15 },
    { id: 'balanced',   name: 'Balanced',   attack_bonus: 0.05, defense_bonus: 0.05 },
    { id: 'rapid',      name: 'Rapid March', march_speed_bonus: 0.20, attack_penalty: -0.10 },
  ];
  res.json({ success: true, data: formations });
};

// POST /api/v1/combat/scout — scout enemy city
export const scoutEnemy = async (req, res, next) => {
  try {
    const { target_id } = req.body;
    const target = await User.findById(target_id);
    if (!target) return res.status(404).json({ success: false, error: 'Target not found' });

    const targetCity = await City.findOne({ player_id: target_id });
    const targetTroops = await buildTroopsMap(target_id);
    const targetHero = await Hero.findOne({ player_id: target_id, is_unlocked: true, status: 'idle' });

    res.json({
      success: true,
      data: {
        username:    target.username,
        city_name:   targetCity?.name,
        ch_level:    targetCity?.city_hall_level || 1,
        wall_level:  targetCity?.wall_level || 1,
        power_score: targetCity?.power_score || 0,
        terrain:     targetCity?.terrain_type || 'plains',
        is_shielded: targetCity?.is_shielded || false,
        troops:      targetTroops,
        hero:        targetHero ? { template_id: targetHero.template_id, level: targetHero.level } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/combat/history — full battle history
export const getCombatHistory = async (req, res, next) => {
  try {
    const history = await CombatReport.find({
      $or: [{ attacker_id: req.user.id }, { defender_id: req.user.id }],
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

// POST /api/v1/combat/defend — set defense formation
export const setDefense = async (req, res, next) => {
  try {
    const { formation } = req.body;
    const validFormations = ['offensive','defensive','balanced','rapid'];
    if (!validFormations.includes(formation)) {
      return res.status(400).json({ success: false, error: 'Invalid formation' });
    }
    await User.findByIdAndUpdate(req.user.id, { $set: { 'stats.defenseFormation': formation } });
    res.json({ success: true, message: `Defense formation set to: ${formation}` });
  } catch (error) {
    next(error);
  }
};
