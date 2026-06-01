// Full GDD battle resolution — damage formula, rounds, counter/terrain/tech/hero modifiers

import { UNIT_STATS, COUNTER_MATRIX, TERRAIN_MODIFIERS, WALL_DEFENSE_BONUS_PER_LEVEL, SIEGE_VS_BUILDING_BONUS } from './gameData.service.js';

const MAX_ROUNDS = 10;

/**
 * Calculate total ATK power for one side
 * techBonuses: { archer_atk, infantry_atk, cavalry_atk, siege_atk }
 * heroMod: total ATK modifier from hero passives/actives (e.g. 0.25 = +25%)
 */
const sideAtk = (troops, opponentTroops, techBonuses = {}, heroMod = 0, terrainType = 'plains', isAttacker = true) => {
  let totalAtk = 0;

  for (const [unitType, tierCounts] of Object.entries(troops)) {
    if (!tierCounts || typeof tierCounts !== 'object') continue;

    for (const [tier, count] of Object.entries(tierCounts)) {
      if (!count || count <= 0) continue;
      const stats = UNIT_STATS[unitType]?.[tier];
      if (!stats) continue;

      const baseAtk = stats.atk;
      const unitCount = Number(count);

      // UnitCountModifier — diminishing returns
      const unitCountMod = Math.sqrt(unitCount / 100);

      // Tech modifier
      const techKey = `${unitType}_atk`;
      const techMod = 1 + (techBonuses[techKey] || 0);

      // Hero modifier
      const heroAtkMod = 1 + heroMod;

      // Terrain modifier for this unit type
      let terrainMod = 1.0;
      const terrain = TERRAIN_MODIFIERS[terrainType] || {};
      if (unitType === 'cavalry' && terrain.cavAtkPenalty) terrainMod *= terrain.cavAtkPenalty;
      if (unitType === 'siege' && terrain.siegeAtkBonus) terrainMod *= terrain.siegeAtkBonus;

      // Counter modifier — pick best counter against opponent's majority unit
      let bestCounterMod = 0;
      let totalOpponentCount = 0;
      for (const [opType, opTiers] of Object.entries(opponentTroops)) {
        if (!opTiers) continue;
        for (const [, opCount] of Object.entries(opTiers)) {
          if (opCount > 0) {
            totalOpponentCount += opCount;
            const cm = COUNTER_MATRIX[unitType]?.[opType] || 1.0;
            bestCounterMod += cm * opCount;
          }
        }
      }
      const counterMod = totalOpponentCount > 0 ? bestCounterMod / totalOpponentCount : 1.0;

      const unitAtk = baseAtk * unitCountMod * techMod * heroAtkMod * terrainMod * counterMod;
      totalAtk += unitAtk;
    }
  }

  return totalAtk;
};

/**
 * Calculate total DEF power for the defending side
 */
const sideDef = (troops, wallLevel = 0, techBonuses = {}, heroDefMod = 0) => {
  let totalDef = 0;

  for (const [unitType, tierCounts] of Object.entries(troops)) {
    if (!tierCounts || typeof tierCounts !== 'object') continue;

    for (const [tier, count] of Object.entries(tierCounts)) {
      if (!count || count <= 0) continue;
      const stats = UNIT_STATS[unitType]?.[tier];
      if (!stats) continue;

      const baseDef = stats.def;
      const unitCount = Number(count);
      const unitCountMod = Math.sqrt(unitCount / 100);
      const techDefMod = 1 + (techBonuses['troop_def'] || 0);
      const heroMod = 1 + heroDefMod;
      const wallMod = 1 + (wallLevel * WALL_DEFENSE_BONUS_PER_LEVEL);

      totalDef += baseDef * unitCountMod * techDefMod * heroMod * wallMod;
    }
  }

  return totalDef;
};

/**
 * Count total troops on one side
 */
const countTroops = (troops) => {
  let total = 0;
  for (const tierCounts of Object.values(troops)) {
    if (!tierCounts) continue;
    for (const count of Object.values(tierCounts)) {
      total += Number(count) || 0;
    }
  }
  return total;
};

/**
 * Calculate losses proportionally across all unit types/tiers
 * lossFraction: 0.0 → 1.0
 */
const applyLosses = (troops, lossFraction) => {
  const losses = {};
  const remaining = {};

  for (const [unitType, tierCounts] of Object.entries(troops)) {
    losses[unitType] = {};
    remaining[unitType] = {};
    if (!tierCounts) continue;

    for (const [tier, count] of Object.entries(tierCounts)) {
      const c = Number(count) || 0;
      const lost = Math.floor(c * lossFraction);
      losses[unitType][tier] = lost;
      remaining[unitType][tier] = c - lost;
    }
  }

  return { losses, remaining };
};

/**
 * Dragon skill damage — applied once per round
 */
const dragonSkillDamage = (dragon, defenderTroopHp, dragonTechBonus = 0) => {
  if (!dragon) return { dmg: 0, skillId: null };

  const skillDmgMod = 1 + dragonTechBonus;

  switch (dragon.dragon_type) {
    case 'emberstrike': {
      // 12% HP damage to front row (siege & infantry treated as front row — 30% of total HP)
      const dmg = defenderTroopHp * 0.12 * 0.3 * skillDmgMod;
      return { dmg: Math.floor(dmg), skillId: 'flame_breath' };
    }
    case 'stormbeak': {
      // Chain bolt hits 3 random units — 5% HP each
      const dmg = defenderTroopHp * 0.05 * 3 * skillDmgMod;
      return { dmg: Math.floor(dmg), skillId: 'chain_bolt' };
    }
    case 'venomfang': {
      // 3% HP DoT — apply per round
      const dmg = defenderTroopHp * 0.03 * skillDmgMod;
      return { dmg: Math.floor(dmg), skillId: 'toxic_cloud' };
    }
    case 'voidwing': {
      const dmg = defenderTroopHp * 0.08 * skillDmgMod;
      return { dmg: Math.floor(dmg), skillId: 'null_wave' };
    }
    case 'tideclaw': {
      // Freeze cavalry — reduces cavalry DEF contribution by 50%
      return { dmg: 0, skillId: 'tidal_surge', effect: 'freeze_cavalry' };
    }
    default:
      return { dmg: 0, skillId: null };
  }
};

/**
 * Estimate total HP pool for a side (used by dragon skills)
 */
const estimateTotalHp = (troops) => {
  let total = 0;
  for (const [unitType, tierCounts] of Object.entries(troops)) {
    if (!tierCounts) continue;
    for (const [tier, count] of Object.entries(tierCounts)) {
      const stats = UNIT_STATS[unitType]?.[tier];
      if (stats && count > 0) total += stats.hp * Number(count);
    }
  }
  return total;
};

/**
 * Main battle resolution
 *
 * @param {object} attackerTroops  { archer: {1: 100, 2: 50}, infantry: {...}, ... }
 * @param {object} defenderTroops
 * @param {object} options
 *   terrainType, wallLevel, attackerTech, defenderTech,
 *   attackerHero, defenderHero, attackerDragon,
 *   attackerSpellMod, defenderSpellMod
 */
export const resolveBattle = ({
  attackerTroops = {},
  defenderTroops = {},
  terrainType = 'plains',
  wallLevel = 0,
  attackerTech = {},
  defenderTech = {},
  attackerHero = null,
  defenderHero = null,
  attackerDragon = null,
  attackerSpellMod = 0,
  defenderSpellMod = 0,
} = {}) => {

  // Deep-copy troops so we can mutate
  let aTroops = JSON.parse(JSON.stringify(attackerTroops));
  let dTroops = JSON.parse(JSON.stringify(defenderTroops));

  const rounds = [];
  let winner = null;

  // Hero ATK/DEF modifiers from passives
  const attackerHeroAtkMod = attackerHero
    ? (attackerHero.passives || []).reduce((acc, p) => p.type === 'troop_atk' ? acc + p.value : acc, 0) + attackerSpellMod
    : attackerSpellMod;

  const attackerHeroDefMod = 0;

  const defenderHeroAtkMod = defenderHero
    ? (defenderHero.passives || []).reduce((acc, p) => p.type === 'troop_def' ? acc + p.value : acc, 0) + defenderSpellMod
    : defenderSpellMod;

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const aCount = countTroops(aTroops);
    const dCount = countTroops(dTroops);

    if (aCount === 0) { winner = 'defender'; break; }
    if (dCount === 0) { winner = 'attacker'; break; }

    // Compute ATK & DEF for this round
    const aAtk = sideAtk(aTroops, dTroops, attackerTech, attackerHeroAtkMod, terrainType, true);
    const dDef = sideDef(dTroops, wallLevel, defenderTech, defenderHeroAtkMod);
    const dAtk = sideAtk(dTroops, aTroops, defenderTech, defenderHeroAtkMod, terrainType, false);
    const aDef = sideDef(aTroops, 0, attackerTech, attackerHeroDefMod);

    // Raw damage
    const aDmgToDefender = Math.max(0, aAtk - dDef);
    const dDmgToAttacker = Math.max(0, dAtk - aDef);

    // Dragon contribution
    const defenderHpPool = estimateTotalHp(dTroops);
    const { dmg: dragonDmg, skillId } = dragonSkillDamage(attackerDragon, defenderHpPool, attackerTech.dragon_skill_dmg || 0);

    const totalDmgToDefender = aDmgToDefender + dragonDmg;
    const totalDmgToAttacker = dDmgToAttacker;

    // Convert damage to loss fractions (damage / total HP pool)
    const aTotalHp = estimateTotalHp(aTroops);
    const dTotalHp = estimateTotalHp(dTroops);

    const aLossFraction = aTotalHp > 0 ? Math.min(totalDmgToAttacker / aTotalHp, 1) : 0;
    const dLossFraction = dTotalHp > 0 ? Math.min(totalDmgToDefender / dTotalHp, 1) : 0;

    // Apply losses
    const { losses: aLosses, remaining: aRemaining } = applyLosses(aTroops, aLossFraction);
    const { losses: dLosses, remaining: dRemaining } = applyLosses(dTroops, dLossFraction);

    aTroops = aRemaining;
    dTroops = dRemaining;

    rounds.push({
      round_number:       round,
      attacker_dmg:       Math.floor(totalDmgToDefender),
      defender_dmg:       Math.floor(totalDmgToAttacker),
      attacker_losses:    aLosses,
      defender_losses:    dLosses,
      dragon_skill_used:  skillId,
    });

    if (countTroops(aTroops) === 0) { winner = 'defender'; break; }
    if (countTroops(dTroops) === 0) { winner = 'attacker'; break; }
  }

  // If no winner after MAX_ROUNDS, attacker retreats → defender wins by default
  if (!winner) winner = 'defender';

  // Compute surviving troops
  const attackerSurvivors = aTroops;
  const defenderSurvivors = dTroops;

  const attackerInitialCount = countTroops(attackerTroops);
  const defenderInitialCount = countTroops(defenderTroops);
  const attackerFinalCount   = countTroops(attackerSurvivors);
  const defenderFinalCount   = countTroops(defenderSurvivors);

  return {
    result: winner === 'attacker' ? 'attacker_win' : 'defender_win',
    winner,
    rounds,
    attackerSurvivors,
    defenderSurvivors,
    attackerLossCount:  attackerInitialCount - attackerFinalCount,
    defenderLossCount:  defenderInitialCount - defenderFinalCount,
    roundsPlayed:       rounds.length,
    terrainType,
    wallLevel,
  };
};

/**
 * Calculate loot from a successful attack
 */
export const calculateLoot = (defenderResources = {}, cargoCapacity = 50000, protectionPct = 0) => {
  const loot = {};
  const lootableResources = ['gold','food','wood','stone','mana','trade_goods'];

  for (const res of lootableResources) {
    const total = defenderResources[res] || 0;
    const protected_ = Math.floor(total * protectionPct);
    const lootable = Math.max(0, total - protected_);
    loot[res] = Math.floor(lootable * 0.20); // attacker steals 20% of unprotected
  }

  // Cap by cargo capacity
  let totalLoot = Object.values(loot).reduce((a, b) => a + b, 0);
  if (totalLoot > cargoCapacity) {
    const scale = cargoCapacity / totalLoot;
    for (const k of Object.keys(loot)) loot[k] = Math.floor(loot[k] * scale);
  }

  return loot;
};

/**
 * Hero 1v1 duel resolution (turn-based)
 * Returns { winner, log }
 */
export const resolveHeroDuel = (heroA, heroB) => {
  const log = [];
  let hpA = heroA.hp;
  let hpB = heroB.hp;
  const maxTurns = 10;

  for (let turn = 1; turn <= maxTurns; turn++) {
    // Hero with higher speed attacks first
    const aFirst = (heroA.speed || 1) >= (heroB.speed || 1);

    const attackOrder = aFirst ? [['A', heroA, 'B', heroB], ['B', heroB, 'A', heroA]]
                                : [['B', heroB, 'A', heroA], ['A', heroA, 'B', heroB]];

    for (const [atkLabel, atk, defLabel] of attackOrder) {
      const dmg = Math.max(1, Math.floor(atk.atk * (0.9 + Math.random() * 0.2) - (atkLabel === 'A' ? heroB.def : heroA.def) * 0.5));
      if (atkLabel === 'A') { hpB -= dmg; } else { hpA -= dmg; }
      log.push({ turn, action: `${atkLabel} attacks ${defLabel} for ${dmg} dmg` });
      if (hpA <= 0 || hpB <= 0) break;
    }

    if (hpA <= 0 || hpB <= 0) break;
  }

  const winner = hpA > hpB ? 'A' : hpA < hpB ? 'B' : 'draw';
  return { winner, hpA: Math.max(0, hpA), hpB: Math.max(0, hpB), log };
};
