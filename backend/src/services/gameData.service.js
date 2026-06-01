// Central game data constants — all unit stats, counters, heroes, dragons, beasts, mines

export const UNIT_STATS = {
  archer: {
    1: { name: 'Peasant Archer',  hp: 120, atk: 80,   def: 40,  speed: 1.2, trainCost: { gold: 20,  food: 10 } },
    2: { name: 'Longbowman',      hp: 160, atk: 120,  def: 55,  speed: 1.1, trainCost: { gold: 40,  food: 20 } },
    3: { name: 'Crossbowman',     hp: 200, atk: 180,  def: 70,  speed: 1.0, trainCost: { gold: 80,  food: 40 } },
    4: { name: 'Royal Sniper',    hp: 260, atk: 260,  def: 90,  speed: 0.9, trainCost: { gold: 180, food: 80 } },
    5: { name: 'Elven Marksman',  hp: 320, atk: 380,  def: 110, speed: 1.0, trainCost: { gold: 350, food: 150 } },
  },
  infantry: {
    1: { name: 'Militia',          hp: 200, atk: 60,  def: 80,  speed: 1.0,  trainCost: { gold: 15,  food: 10 } },
    2: { name: 'Footsoldier',      hp: 280, atk: 90,  def: 120, speed: 0.9,  trainCost: { gold: 30,  food: 20 } },
    3: { name: 'Knight-at-Arms',   hp: 380, atk: 140, def: 180, speed: 0.85, trainCost: { gold: 70,  food: 50 } },
    4: { name: 'Heavy Guard',      hp: 520, atk: 200, def: 260, speed: 0.8,  trainCost: { gold: 150, food: 100 } },
    5: { name: 'Iron Vanguard',    hp: 700, atk: 300, def: 380, speed: 0.75, trainCost: { gold: 300, food: 200 } },
  },
  cavalry: {
    1: { name: 'Scout Rider',   hp: 150, atk: 100, def: 50,  speed: 1.8, trainCost: { gold: 25,  food: 15 } },
    2: { name: 'Light Cavalry', hp: 220, atk: 150, def: 75,  speed: 1.6, trainCost: { gold: 50,  food: 30 } },
    3: { name: 'Heavy Cavalry', hp: 320, atk: 220, def: 110, speed: 1.4, trainCost: { gold: 100, food: 60 } },
    4: { name: 'Lancer',        hp: 440, atk: 320, def: 150, speed: 1.3, trainCost: { gold: 220, food: 120 } },
    5: { name: 'Dragon Knight', hp: 600, atk: 460, def: 200, speed: 1.2, trainCost: { gold: 450, food: 250 } },
  },
  siege: {
    1: { name: 'Battering Ram', hp: 800, atk: 400,  def: 100, speed: 0.4,  trainCost: { gold: 100,  wood: 80,  stone: 50 } },
    2: { name: 'Catapult',      hp: 600, atk: 700,  def: 80,  speed: 0.35, trainCost: { gold: 200,  wood: 150, stone: 100 } },
    3: { name: 'Ballista',      hp: 500, atk: 900,  def: 90,  speed: 0.3,  trainCost: { gold: 400,  wood: 250, stone: 150 } },
    4: { name: 'Trebuchet',     hp: 700, atk: 1400, def: 120, speed: 0.25, trainCost: { gold: 800,  wood: 400, stone: 300 } },
    5: { name: 'Arcane Cannon', hp: 900, atk: 2200, def: 140, speed: 0.3,  trainCost: { gold: 1500, wood: 600, stone: 500, mana: 100 } },
  },
};

// Unlock level for each unit tier
export const UNIT_UNLOCK_LEVELS = {
  archer:   { 1: 1, 2: 5, 3: 10, 4: 18, 5: 28 },
  infantry: { 1: 1, 2: 5, 3: 10, 4: 18, 5: 28 },
  cavalry:  { 1: 1, 2: 5, 3: 10, 4: 18, 5: 28 },
  siege:    { 1: 8, 2: 12, 3: 16, 4: 22, 5: 30 },
};

// Counter matrix: COUNTER_MATRIX[attacker_type][defender_type] = damage multiplier
export const COUNTER_MATRIX = {
  infantry: { infantry: 1.0, archer: 0.7, cavalry: 1.4, siege: 1.5 },
  archer:   { infantry: 1.4, archer: 1.0, cavalry: 0.7, siege: 0.6 },
  cavalry:  { infantry: 0.7, archer: 1.4, cavalry: 1.0, siege: 0.8 },
  siege:    { infantry: 0.9, archer: 0.9, cavalry: 1.1, siege: 1.0 },
};

// Siege gets additional bonus vs buildings/walls
export const SIEGE_VS_BUILDING_BONUS = 2.0;

// Terrain modifiers: terrain_type → { movementMod, defenseMod, cavPenalty? }
export const TERRAIN_MODIFIERS = {
  plains:   { movementMod: 1.0, defenseMod: 1.0 },
  forest:   { movementMod: 0.7, defenseMod: 1.3, cavAtkPenalty: 0.8 },
  desert:   { movementMod: 0.8, defenseMod: 0.8, manaCostBonus: 1.1 },
  mountain: { movementMod: 0.5, defenseMod: 1.5, siegeAtkBonus: 1.25 },
  snow:     { movementMod: 0.6, defenseMod: 1.1, infantryHpPenalty: 0.9 },
  coastal:  { movementMod: 1.0, defenseMod: 0.9 },
  volcano:  { movementMod: 0.4, defenseMod: 1.0 },
  swamp:    { movementMod: 0.5, defenseMod: 1.2, cavMovePenalty: 0.6 },
};

// Wall defense bonus per level
export const WALL_DEFENSE_BONUS_PER_LEVEL = 0.05;

// Hero templates
export const HERO_TEMPLATES = [
  {
    id: 'aethon_unbroken', name: 'Aethon the Unbroken', tier: 'legendary', class: 'warlord',
    shardsRequired: 80, baseAtk: 1200, baseDef: 800, baseHp: 5000, baseSpeed: 1.2, baseLeadership: 50000,
    passives: [
      { id: 'iron_march',  desc: 'Troop march ATK +25%', type: 'troop_atk', value: 0.25 },
      { id: 'unyielding',  desc: 'Troop HP +20% when attacking', type: 'troop_hp_attack', value: 0.20 },
    ],
    actives: [
      { id: 'battlecry',     desc: '+15% ATK all troops for 2 rounds', cdRounds: 4, type: 'atk_buff', value: 0.15 },
      { id: 'rally_charge',  desc: '+50% cavalry ATK for next round',  cdRounds: 6, type: 'cav_atk',  value: 0.50 },
    ],
  },
  {
    id: 'lyra_shadowstep', name: 'Lyra Shadowstep', tier: 'legendary', class: 'ranger',
    shardsRequired: 80, baseAtk: 1100, baseDef: 600, baseHp: 4200, baseSpeed: 1.6, baseLeadership: 40000,
    passives: [
      { id: 'swift_march',   desc: 'March speed +30%', type: 'march_speed', value: 0.30 },
      { id: 'eagle_eye',     desc: 'Archer ATK +25%',  type: 'archer_atk',  value: 0.25 },
    ],
    actives: [
      { id: 'rain_of_arrows', desc: '+40% archer ATK for 2 rounds', cdRounds: 5, type: 'archer_atk_buff', value: 0.40 },
      { id: 'shadow_strike',  desc: 'Skip defender counter bonus for 1 round', cdRounds: 8, type: 'negate_counter', value: 1 },
    ],
  },
  {
    id: 'mordan_ironwall', name: 'Mordan Ironwall', tier: 'elite', class: 'tactician',
    shardsRequired: 30, baseAtk: 700, baseDef: 1200, baseHp: 6000, baseSpeed: 0.9, baseLeadership: 35000,
    passives: [
      { id: 'fortress_mind', desc: 'All troop DEF +25%', type: 'troop_def', value: 0.25 },
      { id: 'counter_expert', desc: 'Counter bonus +15%', type: 'counter_bonus', value: 0.15 },
    ],
    actives: [
      { id: 'shield_wall',   desc: '+60% DEF for 1 round', cdRounds: 4, type: 'def_buff', value: 0.60 },
      { id: 'taunt',         desc: 'Enemy targets this hero first for 2 rounds', cdRounds: 6, type: 'taunt', value: 1 },
    ],
  },
  {
    id: 'seraphina_mage', name: 'Seraphina the Arcane', tier: 'legendary', class: 'mage',
    shardsRequired: 80, baseAtk: 1400, baseDef: 400, baseHp: 3500, baseSpeed: 1.0, baseLeadership: 30000,
    passives: [
      { id: 'mana_surge',    desc: 'Mana regen +30%',       type: 'mana_regen',   value: 0.30 },
      { id: 'arcane_power',  desc: 'Spell damage +40%',     type: 'spell_dmg',    value: 0.40 },
    ],
    actives: [
      { id: 'arcane_blast',  desc: '+60% spell ATK for 3 rounds', cdRounds: 6, type: 'spell_buff', value: 0.60 },
      { id: 'mana_shield',   desc: 'Absorb 20% of incoming damage as mana', cdRounds: 8, type: 'mana_shield', value: 0.20 },
    ],
  },
  {
    id: 'dragan_tamer', name: 'Dragan the Bonded', tier: 'legendary', class: 'dragon_tamer',
    shardsRequired: 80, baseAtk: 900, baseDef: 700, baseHp: 4500, baseSpeed: 1.1, baseLeadership: 45000,
    passives: [
      { id: 'dragon_bond',  desc: 'Dragon ATK +50%',   type: 'dragon_atk',  value: 0.50 },
      { id: 'ancient_lore', desc: 'Dragon EXP +30%',   type: 'dragon_exp',  value: 0.30 },
    ],
    actives: [
      { id: 'dragon_fury',  desc: 'Dragon skill fires twice this round', cdRounds: 8, type: 'dragon_double', value: 1 },
      { id: 'scales',       desc: '+40% dragon HP for rest of battle',   cdRounds: 10, type: 'dragon_hp',   value: 0.40 },
    ],
  },
  {
    id: 'kira_admiral', name: 'Kira the Admiral', tier: 'elite', class: 'admiral',
    shardsRequired: 30, baseAtk: 800, baseDef: 900, baseHp: 4800, baseSpeed: 1.0, baseLeadership: 40000,
    passives: [
      { id: 'fleet_command', desc: 'Fleet ATK +40%',   type: 'fleet_atk',   value: 0.40 },
      { id: 'sea_legs',      desc: 'Fleet cargo +30%', type: 'fleet_cargo', value: 0.30 },
    ],
    actives: [
      { id: 'broadside',    desc: '+50% ship ATK for 2 rounds', cdRounds: 5, type: 'ship_atk', value: 0.50 },
      { id: 'trade_winds',  desc: 'Trade Good income +50% for 24h', cdRounds: 99, type: 'trade_bonus', value: 0.50 },
    ],
  },
  {
    id: 'finn_scout', name: 'Finn the Swift', tier: 'common', class: 'ranger',
    shardsRequired: 10, baseAtk: 400, baseDef: 300, baseHp: 2000, baseSpeed: 1.8, baseLeadership: 15000,
    passives: [
      { id: 'speed_I', desc: 'March speed +15%', type: 'march_speed', value: 0.15 },
      { id: 'gather_I', desc: 'Gather speed +10%', type: 'gather_speed', value: 0.10 },
    ],
    actives: [
      { id: 'quick_strike', desc: '+20% ATK for 1 round', cdRounds: 3, type: 'atk_buff', value: 0.20 },
      { id: 'evade',        desc: '15% chance to dodge next attack', cdRounds: 4, type: 'dodge', value: 0.15 },
    ],
  },
];

// Dragon data
export const DRAGON_DATA = {
  emberstrike: {
    name: 'Emberstrike', type: 'fire', unlockLevel: 25,
    baseHp: 8000, baseAtk: 1200, statMultiplier: { atk: 1.5 },
    primarySkill: { id: 'flame_breath', desc: 'Deals 12% HP damage to front-row enemy troops', type: 'aoe_hp_pct', value: 0.12 },
    secondarySkill: { id: 'smelt', desc: 'Stone gathering +30%', type: 'gather_bonus', resource: 'stone', value: 0.30 },
  },
  tideclaw: {
    name: 'Tideclaw', type: 'water', unlockLevel: 28,
    baseHp: 9000, baseAtk: 900, statMultiplier: { def: 1.4 },
    primarySkill: { id: 'tidal_surge', desc: 'Freezes enemy cavalry for 2 rounds', type: 'freeze', target: 'cavalry', rounds: 2 },
    secondarySkill: { id: 'trade_wind', desc: 'Trade Good income +20%', type: 'trade_bonus', value: 0.20 },
  },
  stormbeak: {
    name: 'Stormbeak', type: 'lightning', unlockLevel: 31,
    baseHp: 7000, baseAtk: 1400, statMultiplier: { speed: 1.8 },
    primarySkill: { id: 'chain_bolt', desc: 'Hits 3 random enemy units each round', type: 'chain', hits: 3, dmgPct: 0.05 },
    secondarySkill: { id: 'scout_storm', desc: 'Instantly reveal 20x20 tile area', type: 'scout', radius: 20 },
  },
  venomfang: {
    name: 'Venomfang', type: 'poison', unlockLevel: 34,
    baseHp: 11000, baseAtk: 800, statMultiplier: { hp: 1.6 },
    primarySkill: { id: 'toxic_cloud', desc: 'Enemy troops lose 3% HP/round for 5 rounds', type: 'dot', pctPerRound: 0.03, rounds: 5 },
    secondarySkill: { id: 'harvest_poison', desc: 'Mana production +25%', type: 'mana_bonus', value: 0.25 },
  },
  voidwing: {
    name: 'Voidwing', type: 'shadow', unlockLevel: 38,
    baseHp: 10000, baseAtk: 1300, statMultiplier: { all: 1.3 },
    primarySkill: { id: 'null_wave', desc: 'Disables 1 enemy faction spell for 24h', type: 'spell_disable', duration: 86400 },
    secondarySkill: { id: 'void_travel', desc: 'March speed +100% for 2h', type: 'march_speed_temp', value: 1.0, durationMs: 7200000 },
  },
};

// Faction magic data
export const FACTION_SPELLS = {
  elf: [
    { id: 'healing_rain',   name: 'Healing Rain',   manaCost: 300, cdHours: 8,  effect: { type: 'heal_wounded', pct: 0.20 } },
    { id: 'nature_shield',  name: 'Nature Shield',  manaCost: 200, cdHours: 4,  effect: { type: 'def_buff', value: 0.30, durationH: 2 } },
    { id: 'entangle',       name: 'Entangle',       manaCost: 400, cdHours: 12, effect: { type: 'slow_march', value: 0.30, durationMin: 30 } },
    { id: 'summon_eagle',   name: 'Summon Eagle',   manaCost: 500, cdHours: 6,  effect: { type: 'instant_scout' } },
    { id: 'barkskin',       name: 'Barkskin',       manaCost: 250, cdHours: 6,  effect: { type: 'infantry_hp', value: 0.50, durationH: 4 } },
    { id: 'natures_wrath',  name: "Nature's Wrath", manaCost: 800, cdHours: 24, effect: { type: 'destroy_low_tier', pct: 0.05, maxTier: 3 } },
  ],
  goblin: [
    { id: 'smoke_bomb',   name: 'Smoke Bomb',   manaCost: 200, cdHours: 72, effect: { type: 'city_teleport' } },
    { id: 'poison_arrow', name: 'Poison Arrow', manaCost: 300, cdHours: 8,  effect: { type: 'dot_battle', pctPerTick: 0.03, ticks: 5 } },
    { id: 'greed_aura',   name: 'Greed Aura',   manaCost: 400, cdHours: 4,  effect: { type: 'extra_loot', pct: 0.10 } },
    { id: 'bomb_trap',    name: 'Bomb Trap',    manaCost: 500, cdHours: 16, effect: { type: 'first_wave_kill', pct: 0.08 } },
    { id: 'speed_hex',    name: 'Speed Hex',    manaCost: 250, cdHours: 6,  effect: { type: 'march_speed', value: 0.50, durationH: 6 } },
    { id: 'chaos_nova',   name: 'Chaos Nova',   manaCost: 900, cdHours: 24, effect: { type: 'negate_counters', durationRounds: 5 } },
  ],
  demon: [
    { id: 'hellfire',      name: 'Hellfire',      manaCost: 500, cdHours: 8,  effect: { type: 'destroy_low_tier', pct: 0.10, maxTier: 2 } },
    { id: 'blood_pact',    name: 'Blood Pact',    manaCost: 300, cdHours: 4,  effect: { type: 'atk_hp_trade', atkBonus: 0.40, hpPenalty: 0.20, durationH: 3 } },
    { id: 'soulbind',      name: 'Soulbind',      manaCost: 400, cdHours: 24, effect: { type: 'block_march', durationH: 1 } },
    { id: 'dark_shield',   name: 'Dark Shield',   manaCost: 350, cdHours: 12, effect: { type: 'magic_immune', durationH: 4 } },
    { id: 'demon_summon',  name: 'Demon Summon',  manaCost: 700, cdHours: 12, effect: { type: 'spawn_troops', type_unit: 'infantry', tier: 3, count: 500 } },
    { id: 'apocalypse',    name: 'Apocalypse',    manaCost: 1200, cdHours: 48, effect: { type: 'aoe_hp_pct', pct: 0.15 } },
  ],
  fairy: [
    { id: 'pixie_dust',    name: 'Pixie Dust',    manaCost: 200, cdHours: 4,  effect: { type: 'gather_speed', value: 0.30, durationH: 4 } },
    { id: 'glamour',       name: 'Glamour',       manaCost: 300, cdHours: 12, effect: { type: 'false_scout', durationH: 12 } },
    { id: 'fairy_ring',    name: 'Fairy Ring',    manaCost: 400, cdHours: 24, effect: { type: 'army_teleport' } },
    { id: 'blessing',      name: 'Blessing',      manaCost: 350, cdHours: 8,  effect: { type: 'resurrect_dead', pct: 0.15 } },
    { id: 'illusion_wall', name: 'Illusion Wall', manaCost: 500, cdHours: 12, effect: { type: 'fake_wall_hp' } },
    { id: 'star_rain',     name: 'Star Rain',     manaCost: 800, cdHours: 24, effect: { type: 'heal_all_allied', pct: 0.25 } },
  ],
};

// Faction passives
export const FACTION_PASSIVES = {
  elf:    { archerRange: 1.15, troopHpRegen: 0.10, forestBonus: true },
  goblin: { marchSpeed: 1.20, siegeAtk: 1.10 },
  demon:  { allAtk: 1.15, allDefPenalty: 0.95 },
  fairy:  { gatherSpeed: 1.20, researchSpeed: 1.10 },
};

// Beast data
export const BEAST_DATA = [
  { id: 'goblin_scout',   name: 'Goblin Scout',    level: 1,  hp: 500,   atk: 50,  respawnMin: 15,  rewards: { food: 200, wood: 100, common_shards: 1 } },
  { id: 'wolf_pack',      name: 'Wolf Pack',       level: 3,  hp: 1200,  atk: 120, respawnMin: 15,  rewards: { food: 400, wood: 200, equipment_frag: 1 } },
  { id: 'troll',          name: 'Troll',           level: 6,  hp: 3000,  atk: 300, respawnMin: 30,  rewards: { stone: 500, gold: 300, equipment_frag: 3 } },
  { id: 'wyvern',         name: 'Wyvern',          level: 8,  hp: 5000,  atk: 500, respawnMin: 30,  rewards: { gold: 800, elite_shard: 1, equipment_piece: 1 } },
  { id: 'giant',          name: 'Giant',           level: 12, hp: 12000, atk: 900, respawnMin: 60,  rewards: { gold: 2000, elite_shard: 2, equipment_piece: 2 } },
  { id: 'cyclops',        name: 'Cyclops',         level: 15, hp: 20000, atk: 1400, respawnMin: 60, rewards: { gold: 4000, elite_shard: 3, equipment_set: 1 } },
  { id: 'hydra',          name: 'Hydra',           level: 21, hp: 60000, atk: 3000, respawnMin: 360, rewards: { dragon_egg: 1, legendary_shard: 2, gems: 30 } },
  { id: 'fire_drake',     name: 'Fire Drake',      level: 25, hp: 100000, atk: 5000, respawnMin: 360, rewards: { dragon_egg: 2, legendary_shard: 3, gems: 50 } },
  { id: 'ancient_golem',  name: 'Ancient Golem',   level: 31, hp: 300000, atk: 10000, respawnMin: 1440, rewards: { mithril_equipment: 1, legendary_shard: 5, gems: 100 } },
  { id: 'world_serpent',  name: 'World Serpent',   level: 35, hp: 500000, atk: 18000, respawnMin: 1440, rewards: { dragon_armor_mat: 3, legendary_shard: 8, gems: 200 } },
  { id: 'world_dragon',   name: 'The World Dragon', level: 50, hp: 5000000, atk: 80000, respawnMin: 10080, rewards: { voidwing_unlock: true, exclusive_title: true, gems: 1000 } },
];

// Mine data
export const MINE_CONFIGS = [
  { level: 1, goldPerHr: 2000,  stonePerHr: 1000, dragonEnergyPerHr: 0,    guardStrength: 800 },
  { level: 2, goldPerHr: 5000,  stonePerHr: 2500, dragonEnergyPerHr: 0,    guardStrength: 3000 },
  { level: 3, goldPerHr: 10000, stonePerHr: 5000, dragonEnergyPerHr: 100,  guardStrength: 8000 },
  { level: 4, goldPerHr: 20000, stonePerHr: 10000, dragonEnergyPerHr: 300, guardStrength: 25000 },
  { level: 5, goldPerHr: 50000, stonePerHr: 25000, dragonEnergyPerHr: 1000, guardStrength: 80000 },
];

// City Hall progression requirements
export const CITY_HALL_REQUIREMENTS = {
  1:  { playerLevel: 1,  cityHallLevel: 0, time: 0,        resources: {} },
  2:  { playerLevel: 2,  cityHallLevel: 1, time: 300,      resources: { gold: 5000 } },
  3:  { playerLevel: 3,  cityHallLevel: 2, time: 900,      resources: { gold: 10000, food: 5000 } },
  5:  { playerLevel: 5,  cityHallLevel: 4, time: 3600,     resources: { gold: 50000, food: 20000, wood: 10000 } },
  10: { playerLevel: 10, cityHallLevel: 9, time: 28800,    resources: { gold: 500000, food: 200000, wood: 100000 } },
  15: { playerLevel: 15, cityHallLevel: 14, time: 86400,   resources: { gold: 2000000, food: 1000000, wood: 500000, stone: 300000 } },
  20: { playerLevel: 20, cityHallLevel: 19, time: 259200,  resources: { gold: 20000000, food: 10000000, wood: 5000000, stone: 3000000 } },
  25: { playerLevel: 25, cityHallLevel: 24, time: 432000,  resources: { gold: 100000000, food: 50000000, wood: 25000000, stone: 15000000 } },
  30: { playerLevel: 30, cityHallLevel: 29, time: 604800,  resources: { gold: 1000000000 } },
};

// Research nodes
export const RESEARCH_NODES = {
  military: [
    { id: 'infantry_training',  maxLevel: 5, baseTime: 3600,   timeMultiplier: 6,  effect: { type: 'infantry_atk', valuePerLevel: 0.05 } },
    { id: 'archer_precision',   maxLevel: 5, baseTime: 3600,   timeMultiplier: 6,  effect: { type: 'archer_atk',   valuePerLevel: 0.05 } },
    { id: 'cavalry_charge',     maxLevel: 5, baseTime: 3600,   timeMultiplier: 6,  effect: { type: 'cavalry_atk',  valuePerLevel: 0.05 } },
    { id: 'siege_engineering',  maxLevel: 5, baseTime: 14400,  timeMultiplier: 7,  effect: { type: 'siege_atk',    valuePerLevel: 0.08 }, prereq: { building: 'barracks', level: 8 } },
    { id: 'advanced_tactics',   maxLevel: 1, baseTime: 259200, timeMultiplier: 1,  effect: { type: 'counter_bonus', valuePerLevel: 0.10 }, prereq: { research: ['infantry_training_5', 'archer_precision_5'] } },
    { id: 'warlords_code',      maxLevel: 1, baseTime: 432000, timeMultiplier: 1,  effect: { type: 'march_queue', valuePerLevel: 1 }, prereq: { research: ['advanced_tactics_1'] } },
  ],
  economy: [
    { id: 'agriculture',       maxLevel: 5, baseTime: 1800,  timeMultiplier: 5, effect: { type: 'food_prod',  valuePerLevel: 0.08 } },
    { id: 'mining',            maxLevel: 5, baseTime: 1800,  timeMultiplier: 5, effect: { type: 'gold_prod',  valuePerLevel: 0.08 } },
    { id: 'forestry',          maxLevel: 5, baseTime: 1800,  timeMultiplier: 5, effect: { type: 'wood_prod',  valuePerLevel: 0.08 } },
    { id: 'masonry',           maxLevel: 5, baseTime: 1800,  timeMultiplier: 5, effect: { type: 'stone_prod', valuePerLevel: 0.08 } },
    { id: 'trade_routes',      maxLevel: 3, baseTime: 7200,  timeMultiplier: 4, effect: { type: 'trade_income', valuePerLevel: 0.15 }, prereq: { building: 'harbor', level: 1 } },
    { id: 'resource_protection', maxLevel: 5, baseTime: 3600, timeMultiplier: 5, effect: { type: 'resource_protection', valuePerLevel: 0.10 }, prereq: { research: ['mining_3'] } },
  ],
  magic: [
    { id: 'mana_flow',        maxLevel: 5, baseTime: 7200,   timeMultiplier: 5, effect: { type: 'mana_regen', valuePerLevel: 0.10 }, prereq: { building: 'magic_tower', level: 1 } },
    { id: 'spell_mastery',    maxLevel: 3, baseTime: 43200,  timeMultiplier: 4, effect: { type: 'spell_dmg',  valuePerLevel: 0.15 }, prereq: { research: ['mana_flow_3'] } },
    { id: 'faction_attunement', maxLevel: 1, baseTime: 259200, timeMultiplier: 1, effect: { type: 'faction_passive', valuePerLevel: 0.20 }, prereq: { research: ['spell_mastery_1'] } },
    { id: 'arcane_shield',    maxLevel: 3, baseTime: 86400,  timeMultiplier: 3, effect: { type: 'magic_dmg_reduction', valuePerLevel: 0.10 }, prereq: { building: 'magic_tower', level: 3 } },
  ],
  naval: [
    { id: 'shipbuilding',    maxLevel: 5, baseTime: 7200,   timeMultiplier: 5, effect: { type: 'ship_hp',  valuePerLevel: 0.10 }, prereq: { building: 'harbor', level: 1 } },
    { id: 'naval_tactics',   maxLevel: 5, baseTime: 7200,   timeMultiplier: 5, effect: { type: 'ship_atk', valuePerLevel: 0.10 }, prereq: { research: ['shipbuilding_2'] } },
    { id: 'trade_wind',      maxLevel: 3, baseTime: 14400,  timeMultiplier: 4, effect: { type: 'trade_income', valuePerLevel: 0.20 }, prereq: { building: 'harbor', level: 3 } },
    { id: 'ironhull',        maxLevel: 1, baseTime: 345600, timeMultiplier: 1, effect: { type: 'unlock_ironclad' }, prereq: { research: ['shipbuilding_5'] } },
  ],
  dragon: [
    { id: 'dragon_bond',  maxLevel: 5, baseTime: 43200,  timeMultiplier: 5, effect: { type: 'dragon_exp',  valuePerLevel: 0.10 }, prereq: { building: 'dragon_lair', level: 1 } },
    { id: 'dragon_armor', maxLevel: 3, baseTime: 86400,  timeMultiplier: 3, effect: { type: 'dragon_hp',   valuePerLevel: 0.15 }, prereq: { research: ['dragon_bond_2'] } },
    { id: 'dragon_fury',  maxLevel: 3, baseTime: 86400,  timeMultiplier: 3, effect: { type: 'dragon_skill_dmg', valuePerLevel: 0.20 }, prereq: { research: ['dragon_bond_3'] } },
    { id: 'ancient_pact', maxLevel: 1, baseTime: 604800, timeMultiplier: 1, effect: { type: 'dragon_heal_speed', value: 2, extraSlot: true }, prereq: { research: ['dragon_bond_5'] } },
  ],
};

// Ship stats
export const SHIP_STATS = {
  fishing_boat:  { name: 'Fishing Boat',  unlockLevel: 10, hp: 300,   atk: 0,    speed: 1.2, cargo: 2000,  role: 'gather' },
  war_canoe:     { name: 'War Canoe',     unlockLevel: 10, hp: 500,   atk: 200,  speed: 1.5, cargo: 500,   role: 'raider' },
  galleon:       { name: 'Galleon',       unlockLevel: 14, hp: 1200,  atk: 500,  speed: 1.0, cargo: 10000, role: 'transport' },
  warship:       { name: 'Warship',       unlockLevel: 18, hp: 2000,  atk: 900,  speed: 0.9, cargo: 5000,  role: 'combat' },
  ironclad:      { name: 'Ironclad',      unlockLevel: 24, hp: 4000,  atk: 1600, speed: 0.7, cargo: 8000,  role: 'heavy' },
  dreadnought:   { name: 'Dreadnought',   unlockLevel: 30, hp: 7000,  atk: 3000, speed: 0.5, cargo: 20000, role: 'flagship' },
};

// Resource base rates (per hr per building level)
export const RESOURCE_BASE_RATES = {
  gold:          { buildingType: 'goldmine',     perLevel: 50 },
  food:          { buildingType: 'farm',         perLevel: 60 },
  wood:          { buildingType: 'lumber_mill',  perLevel: 40 },
  stone:         { buildingType: 'quarry',       perLevel: 30 },
  mana:          { buildingType: 'magic_tower',  perLevel: 30 },
  dragon_energy: { buildingType: 'dragon_lair',  perLevel: 10 },
  trade_goods:   { buildingType: 'harbor',       perLevel: 20 },
};

// Beginner's shield duration (ms)
export const BEGINNER_SHIELD_MS = 7 * 24 * 60 * 60 * 1000;
