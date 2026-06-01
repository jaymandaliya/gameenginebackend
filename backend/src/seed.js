/**
 * Complete MongoDB Seed Script
 * Seeds: users, alliances, cities, units, heroes, dragons, ships,
 *        research, mines, beasts, tournament, capital war, combat reports
 *
 * Run: npm run seed
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Models
import User         from './models/User.model.js';
import Alliance     from './models/Alliance.model.js';
import City         from './models/City.model.js';
import Unit         from './models/Unit.model.js';
import Hero         from './models/Hero.model.js';
import Dragon       from './models/Dragon.model.js';
import Ship         from './models/Ship.model.js';
import Research     from './models/Research.model.js';
import Mine         from './models/Mine.model.js';
import Beast        from './models/Beast.model.js';
import Tournament   from './models/Tournament.model.js';
import CapitalWar   from './models/CapitalWar.model.js';
import CombatReport from './models/CombatReport.model.js';

const HASH_ROUNDS = 10;

// ─── Utility ────────────────────────────────────────────────────────────────
const now = new Date();
const future = (ms) => new Date(Date.now() + ms);
const past   = (ms) => new Date(Date.now() - ms);
const H = (h) => h * 3600_000;
const D = (d) => d * 86_400_000;

// ─── Raw user definitions ───────────────────────────────────────────────────
const RAW_USERS = [
  {
    username: 'IronKing',     displayName: 'Iron King',     email: 'ironking@game.test',   password: 'Test1234!',
    level: 28, gems: 3200, city_hall_level: 22, faction: 'demon',
    vip_level: 5, battle_medals: 1850, alliance_points: 4200, hero_tokens: 720, tournament_crowns: 38, war_points: 950,
    tech_bonuses: { infantry_atk:15, archer_atk:12, cavalry_atk:18, siege_atk:10, troop_def:20, troop_hp:15,
                    march_speed:25, march_queue:4, food_prod:20, gold_prod:18, wood_prod:15, stone_prod:12,
                    mana_regen:10, spell_dmg:15, ship_atk:8, ship_hp:10, dragon_exp:20, dragon_hp:15,
                    dragon_skill_dmg:18, resource_protection:30 },
    stats: { gamesPlayed:450, wins:312, losses:138, totalScore:94500, battlesWon:312, beastsKilled:47 },
  },
  {
    username: 'ElvenArcher',  displayName: 'Elven Archer',  email: 'elvenarcher@game.test', password: 'Test1234!',
    level: 24, gems: 1800, city_hall_level: 18, faction: 'elf',
    vip_level: 3, battle_medals: 920, alliance_points: 2600, hero_tokens: 480, tournament_crowns: 22, war_points: 560,
    tech_bonuses: { infantry_atk:8, archer_atk:22, cavalry_atk:6, siege_atk:5, troop_def:15, troop_hp:12,
                    march_speed:18, march_queue:3, food_prod:25, gold_prod:20, wood_prod:22, stone_prod:10,
                    mana_regen:25, spell_dmg:22, ship_atk:5, ship_hp:8, dragon_exp:15, dragon_hp:10,
                    dragon_skill_dmg:12, resource_protection:25 },
    stats: { gamesPlayed:280, wins:198, losses:82, totalScore:61200, battlesWon:198, beastsKilled:31 },
  },
  {
    username: 'GoblinKing',   displayName: 'Goblin King',   email: 'goblinkg@game.test',   password: 'Test1234!',
    level: 20, gems: 950, city_hall_level: 15, faction: 'goblin',
    vip_level: 2, battle_medals: 540, alliance_points: 1300, hero_tokens: 280, tournament_crowns: 12, war_points: 310,
    tech_bonuses: { infantry_atk:10, archer_atk:8, cavalry_atk:14, siege_atk:8, troop_def:10, troop_hp:8,
                    march_speed:15, march_queue:3, food_prod:15, gold_prod:25, wood_prod:12, stone_prod:15,
                    mana_regen:8, spell_dmg:10, ship_atk:12, ship_hp:10, dragon_exp:10, dragon_hp:8,
                    dragon_skill_dmg:8, resource_protection:20 },
    stats: { gamesPlayed:185, wins:98, losses:87, totalScore:29400, battlesWon:98, beastsKilled:18 },
  },
  {
    username: 'FairyQueen',   displayName: 'Fairy Queen',   email: 'fairyq@game.test',     password: 'Test1234!',
    level: 18, gems: 720, city_hall_level: 14, faction: 'fairy',
    vip_level: 2, battle_medals: 380, alliance_points: 980, hero_tokens: 160, tournament_crowns: 8, war_points: 190,
    tech_bonuses: { infantry_atk:6, archer_atk:10, cavalry_atk:8, siege_atk:4, troop_def:12, troop_hp:18,
                    march_speed:12, march_queue:2, food_prod:30, gold_prod:15, wood_prod:20, stone_prod:8,
                    mana_regen:30, spell_dmg:28, ship_atk:4, ship_hp:6, dragon_exp:12, dragon_hp:20,
                    dragon_skill_dmg:15, resource_protection:35 },
    stats: { gamesPlayed:140, wins:88, losses:52, totalScore:22400, battlesWon:88, beastsKilled:12 },
  },
  {
    username: 'SteelGuard',   displayName: 'Steel Guard',   email: 'steelguard@game.test', password: 'Test1234!',
    level: 15, gems: 480, city_hall_level: 12, faction: 'demon',
    vip_level: 1, battle_medals: 220, alliance_points: 640, hero_tokens: 90, tournament_crowns: 4, war_points: 100,
    tech_bonuses: { infantry_atk:12, archer_atk:5, cavalry_atk:8, siege_atk:12, troop_def:18, troop_hp:20,
                    march_speed:8, march_queue:2, food_prod:10, gold_prod:12, wood_prod:8, stone_prod:20,
                    mana_regen:5, spell_dmg:6, ship_atk:6, ship_hp:12, dragon_exp:8, dragon_hp:12,
                    dragon_skill_dmg:6, resource_protection:25 },
    stats: { gamesPlayed:95, wins:52, losses:43, totalScore:13500, battlesWon:52, beastsKilled:8 },
  },
  {
    username: 'SwiftRider',   displayName: 'Swift Rider',   email: 'swiftrider@game.test', password: 'Test1234!',
    level: 12, gems: 300, city_hall_level: 10, faction: 'elf',
    vip_level: 1, battle_medals: 120, alliance_points: 350, hero_tokens: 45, tournament_crowns: 2, war_points: 55,
    tech_bonuses: { infantry_atk:5, archer_atk:6, cavalry_atk:20, siege_atk:4, troop_def:8, troop_hp:10,
                    march_speed:30, march_queue:2, food_prod:8, gold_prod:10, wood_prod:6, stone_prod:6,
                    mana_regen:6, spell_dmg:8, ship_atk:3, ship_hp:4, dragon_exp:6, dragon_hp:6,
                    dragon_skill_dmg:6, resource_protection:15 },
    stats: { gamesPlayed:62, wins:32, losses:30, totalScore:8200, battlesWon:32, beastsKilled:4 },
  },
  {
    username: 'NewRecruit',   displayName: 'New Recruit',   email: 'newrecruit@game.test', password: 'Test1234!',
    level: 5,  gems: 100, city_hall_level: 5,  faction: null,
    vip_level: 0, battle_medals: 20, alliance_points: 0, hero_tokens: 10, tournament_crowns: 0, war_points: 0,
    tech_bonuses: {},
    stats: { gamesPlayed:12, wins:4, losses:8, totalScore:800, battlesWon:4, beastsKilled:0 },
  },
];

// ─── Hero templates used for seeding ────────────────────────────────────────
const HERO_TEMPLATES = ['warrior_king','shadow_archer','iron_vanguard','storm_mage','dragon_rider','sea_captain','beast_slayer'];

// ─── Dragon types ────────────────────────────────────────────────────────────
const DRAGON_TYPES = ['emberstrike','tideclaw','stormbeak','venomfang','voidwing'];

// ─── Research branches & nodes ───────────────────────────────────────────────
const RESEARCH_NODES = {
  military: ['infantry_training','archer_training','cavalry_charge','siege_mastery','troop_hp','troop_defense','march_capacity','march_speed'],
  economy:  ['gold_mining','food_farming','wood_cutting','stone_quarry','storehouse','trade_routes','tax_reform','resource_protection'],
  magic:    ['mana_flow','spell_power','faction_mastery','enchanted_armor','arcane_research','magical_shielding'],
  naval:    ['fishing','ship_construction','naval_combat','trade_winds','deep_sea_routes','ironclad_hulls'],
  dragon:   ['dragon_taming','dragon_combat','dragon_healing','dragon_growth','dragon_skill_mastery','void_channeling'],
};

// ─── Mine world layout ───────────────────────────────────────────────────────
const MINE_LAYOUT = [
  { map_x:10, map_y:10, level:1, resource_type:'gold',          zone:'borderlands', guard_hp:800,  guard_hp_max:800  },
  { map_x:15, map_y:8,  level:2, resource_type:'stone',         zone:'borderlands', guard_hp:1600, guard_hp_max:1600 },
  { map_x:20, map_y:15, level:3, resource_type:'dragon_energy', zone:'wildlands',   guard_hp:3200, guard_hp_max:3200 },
  { map_x:25, map_y:20, level:2, resource_type:'gold',          zone:'wildlands',   guard_hp:1600, guard_hp_max:1600 },
  { map_x:30, map_y:12, level:4, resource_type:'stone',         zone:'deeplands',   guard_hp:6400, guard_hp_max:6400 },
  { map_x:35, map_y:25, level:3, resource_type:'dragon_energy', zone:'deeplands',   guard_hp:3200, guard_hp_max:3200 },
  { map_x:40, map_y:30, level:5, resource_type:'gold',          zone:'core',        guard_hp:12000,guard_hp_max:12000},
  { map_x:45, map_y:18, level:4, resource_type:'stone',         zone:'core',        guard_hp:6400, guard_hp_max:6400 },
  { map_x:50, map_y:35, level:5, resource_type:'dragon_energy', zone:'core',        guard_hp:12000,guard_hp_max:12000},
  { map_x:55, map_y:22, level:1, resource_type:'gold',          zone:'borderlands', guard_hp:800,  guard_hp_max:800  },
];

// ─── World beasts ─────────────────────────────────────────────────────────────
const BEAST_LAYOUT = [
  { beast_id:'beast_goblin_01',   name:'Goblin Raider',    level:5,  map_x:12, map_y:14, hp_max:2000,  atk:120, zone:'borderlands' },
  { beast_id:'beast_wolf_01',     name:'Dire Wolf',        level:8,  map_x:18, map_y:22, hp_max:3500,  atk:200, zone:'borderlands' },
  { beast_id:'beast_troll_01',    name:'Stone Troll',      level:12, map_x:24, map_y:16, hp_max:6000,  atk:350, zone:'wildlands'   },
  { beast_id:'beast_bandit_01',   name:'Bandit Chief',     level:10, map_x:28, map_y:30, hp_max:4500,  atk:280, zone:'wildlands'   },
  { beast_id:'beast_golem_01',    name:'Iron Golem',       level:18, map_x:36, map_y:24, hp_max:12000, atk:600, zone:'deeplands'   },
  { beast_id:'beast_wyvern_01',   name:'Ancient Wyvern',   level:22, map_x:42, map_y:38, hp_max:18000, atk:900, zone:'deeplands'   },
  { beast_id:'beast_guardian_01', name:'Forest Guardian',  level:15, map_x:32, map_y:20, hp_max:8000,  atk:450, zone:'deeplands'   },
  { beast_id:'beast_hydra_01',    name:'Sea Hydra',        level:28, map_x:48, map_y:44, hp_max:30000, atk:1400,zone:'core'        },
  { beast_id:'beast_dragon_01',   name:'Ancient Fire Dragon',level:35,map_x:52,map_y:28, hp_max:50000, atk:2200,zone:'core'        },
  { beast_id:'beast_lich_01',     name:'Death Lich',       level:30, map_x:56, map_y:36, hp_max:35000, atk:1800,zone:'core'        },
  { beast_id:'beast_titan_01',    name:'Chaos Titan',      level:40, map_x:60, map_y:50, hp_max:80000, atk:3500,zone:'core'        },
];

// ─── Connect ────────────────────────────────────────────────────────────────
async function connect() {
  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');
}

// ─── Clear existing data ─────────────────────────────────────────────────────
async function clearAll() {
  console.log('🗑️  Clearing existing seed collections…');
  await Promise.all([
    User.deleteMany({}),
    Alliance.deleteMany({}),
    City.deleteMany({}),
    Unit.deleteMany({}),
    Hero.deleteMany({}),
    Dragon.deleteMany({}),
    Ship.deleteMany({}),
    Research.deleteMany({}),
    Mine.deleteMany({}),
    Beast.deleteMany({}),
    Tournament.deleteMany({}),
    CapitalWar.deleteMany({}),
    CombatReport.deleteMany({}),
  ]);
  console.log('✅ Collections cleared');
}

// ─── Seed Users ──────────────────────────────────────────────────────────────
async function seedUsers() {
  console.log('👤 Seeding users…');
  const users = [];
  for (const u of RAW_USERS) {
    const hashed = await bcrypt.hash(u.password, HASH_ROUNDS);
    users.push({
      email:       u.email,
      username:    u.username,
      displayName: u.displayName,
      password:    hashed,
      level:       u.level,
      gems:        u.gems,
      city_hall_level: u.city_hall_level,
      faction:     u.faction,
      vip_level:   u.vip_level,
      battle_medals:   u.battle_medals,
      alliance_points: u.alliance_points,
      hero_tokens:     u.hero_tokens,
      tournament_crowns: u.tournament_crowns,
      war_points:  u.war_points,
      tech_bonuses: { ...u.tech_bonuses },
      stats:       u.stats,
      lastLoginAt: past(D(1)),
    });
  }
  const created = await User.insertMany(users);
  console.log(`  ✅ ${created.length} users created`);
  return created;
}

// ─── Seed Alliances ───────────────────────────────────────────────────────────
async function seedAlliances(users) {
  console.log('⚔️  Seeding alliances…');
  const [u0, u1, u2, u3, u4, u5] = users;

  const alliances = await Alliance.insertMany([
    {
      name: 'Iron Legion',
      tag: 'IRON',
      description: 'The mightiest warriors united under iron will.',
      leader_id: u0._id,
      officers: [u1._id],
      members: [u0._id, u1._id, u2._id, u3._id],
      level: 8,
      max_members: 50,
      power: 285000,
      buffs: { attack_bonus: 10, defense_bonus: 8, production_bonus: 6 },
      territory: [
        { x: 20, y: 20, captured_at: past(D(10)) },
        { x: 21, y: 20, captured_at: past(D(8)) },
        { x: 20, y: 21, captured_at: past(D(6)) },
      ],
      settings: { join_type: 'approval', min_castle_level: 10 },
    },
    {
      name: 'Shadow Guild',
      tag: 'SHDW',
      description: 'Stealth and cunning above brute strength.',
      leader_id: u4._id,
      officers: [u5._id],
      members: [u4._id, u5._id],
      level: 4,
      max_members: 30,
      power: 52000,
      buffs: { attack_bonus: 5, defense_bonus: 4, production_bonus: 8 },
      territory: [
        { x: 40, y: 40, captured_at: past(D(3)) },
      ],
      settings: { join_type: 'open', min_castle_level: 5 },
    },
  ]);

  // Link alliance_id to users
  await User.updateMany({ _id: { $in: [u0._id, u1._id, u2._id, u3._id] } }, { alliance_id: alliances[0]._id });
  await User.updateMany({ _id: { $in: [u4._id, u5._id] } },                 { alliance_id: alliances[1]._id });

  console.log(`  ✅ ${alliances.length} alliances created`);
  return alliances;
}

// ─── Seed Cities ─────────────────────────────────────────────────────────────
async function seedCities(users) {
  console.log('🏰 Seeding cities…');

  const cityDefs = [
    { name: 'Iron Fortress',     terrain_type: 'mountain', map_x:20, map_y:20, city_hall_level:22, wall_level:18, wall_hp:45000, wall_hp_max:50000,
      resources:{ gold:850000, food:620000, wood:480000, stone:390000, mana:12000, dragon_energy:8500, trade_goods:3200, gems:3200 } },
    { name: 'Elven Grove',       terrain_type: 'forest',   map_x:25, map_y:25, city_hall_level:18, wall_level:14, wall_hp:28000, wall_hp_max:32000,
      resources:{ gold:420000, food:780000, wood:960000, stone:180000, mana:28000, dragon_energy:3200, trade_goods:1800, gems:1800 } },
    { name: 'Goblin Market',     terrain_type: 'plains',   map_x:30, map_y:18, city_hall_level:15, wall_level:10, wall_hp:18000, wall_hp_max:20000,
      resources:{ gold:650000, food:220000, wood:180000, stone:280000, mana:6000, dragon_energy:1800, trade_goods:4500, gems:950 } },
    { name: 'Fairy Hollow',      terrain_type: 'swamp',    map_x:28, map_y:30, city_hall_level:14, wall_level:8,  wall_hp:14000, wall_hp_max:16000,
      resources:{ gold:280000, food:450000, wood:320000, stone:120000, mana:45000, dragon_energy:2200, trade_goods:1200, gems:720 } },
    { name: 'Steel Bastion',     terrain_type: 'desert',   map_x:35, map_y:22, city_hall_level:12, wall_level:12, wall_hp:24000, wall_hp_max:28000,
      resources:{ gold:380000, food:180000, wood:150000, stone:480000, mana:4000, dragon_energy:1200, trade_goods:800,  gems:480 } },
    { name: 'Rider\'s Rest',     terrain_type: 'plains',   map_x:22, map_y:35, city_hall_level:10, wall_level:6,  wall_hp:10000, wall_hp_max:12000,
      resources:{ gold:180000, food:320000, wood:120000, stone:90000,  mana:3500, dragon_energy:800,  trade_goods:500,  gems:300 } },
    { name: 'Recruit Village',   terrain_type: 'plains',   map_x:15, map_y:15, city_hall_level:5,  wall_level:3,  wall_hp:4000,  wall_hp_max:5000,
      resources:{ gold:25000,  food:30000,  wood:20000,  stone:15000,  mana:500,  dragon_energy:0,    trade_goods:0,    gems:100 } },
  ];

  const cities = [];
  for (let i = 0; i < users.length; i++) {
    const def = cityDefs[i];
    const buildings = [
      { type: 'barracks',   level: Math.min(def.city_hall_level, 20) },
      { type: 'archery',    level: Math.max(1, def.city_hall_level - 2) },
      { type: 'stable',     level: Math.max(1, def.city_hall_level - 3) },
      { type: 'workshop',   level: Math.max(1, def.city_hall_level - 4) },
      { type: 'farm',       level: Math.min(def.city_hall_level, 25) },
      { type: 'sawmill',    level: Math.max(1, def.city_hall_level - 1) },
      { type: 'quarry',     level: Math.max(1, def.city_hall_level - 2) },
      { type: 'gold_mine',  level: Math.max(1, def.city_hall_level - 1) },
      { type: 'mana_well',  level: Math.max(1, def.city_hall_level - 5) },
      { type: 'harbor',     level: Math.max(1, def.city_hall_level - 6) },
      { type: 'academy',    level: Math.max(1, def.city_hall_level - 3) },
      { type: 'warehouse',  level: Math.max(1, def.city_hall_level - 2) },
      { type: 'hospital',   level: Math.max(1, def.city_hall_level - 4) },
      { type: 'dragon_lair',level: Math.max(1, def.city_hall_level - 8) },
    ];
    const city = new City({
      player_id:       users[i]._id,
      name:            def.name,
      map_x:           def.map_x,
      map_y:           def.map_y,
      terrain_type:    def.terrain_type,
      city_hall_level: def.city_hall_level,
      wall_level:      def.wall_level,
      wall_hp:         def.wall_hp,
      wall_hp_max:     def.wall_hp_max,
      buildings,
      resources:       def.resources,
      beginner_shield_until: i >= 6 ? future(D(7)) : past(D(3)),
      is_shielded:     i >= 6,
      last_resource_tick: past(H(1)),
      power_score:     def.city_hall_level * 12000 + def.wall_level * 1500,
    });
    cities.push(await city.save());
  }
  console.log(`  ✅ ${cities.length} cities created`);
  return cities;
}

// ─── Seed Units ───────────────────────────────────────────────────────────────
async function seedUnits(users) {
  console.log('⚔️  Seeding units…');
  const unitDefs = [
    // IronKing — strong across all tiers
    [
      { unit_type:'archer',   tier:1, count:5000 }, { unit_type:'archer',   tier:2, count:3000 }, { unit_type:'archer',   tier:3, count:1500 }, { unit_type:'archer',   tier:4, count:600 }, { unit_type:'archer',   tier:5, count:150 },
      { unit_type:'infantry', tier:1, count:6000 }, { unit_type:'infantry', tier:2, count:3500 }, { unit_type:'infantry', tier:3, count:1800 }, { unit_type:'infantry', tier:4, count:700 }, { unit_type:'infantry', tier:5, count:200 },
      { unit_type:'cavalry',  tier:1, count:3000 }, { unit_type:'cavalry',  tier:2, count:2000 }, { unit_type:'cavalry',  tier:3, count:1000 }, { unit_type:'cavalry',  tier:4, count:400 }, { unit_type:'cavalry',  tier:5, count:100 },
      { unit_type:'siege',    tier:1, count:800  }, { unit_type:'siege',    tier:2, count:500  }, { unit_type:'siege',    tier:3, count:250  }, { unit_type:'siege',    tier:4, count:100 }, { unit_type:'siege',    tier:5, count:30  },
    ],
    // ElvenArcher — archers dominant
    [
      { unit_type:'archer',   tier:1, count:8000 }, { unit_type:'archer',   tier:2, count:5000 }, { unit_type:'archer',   tier:3, count:2500 }, { unit_type:'archer',   tier:4, count:800 }, { unit_type:'archer',   tier:5, count:200 },
      { unit_type:'infantry', tier:1, count:2000 }, { unit_type:'infantry', tier:2, count:1200 }, { unit_type:'infantry', tier:3, count:500  }, { unit_type:'infantry', tier:4, count:150 }, { unit_type:'infantry', tier:5, count:30  },
      { unit_type:'cavalry',  tier:1, count:1500 }, { unit_type:'cavalry',  tier:2, count:800  }, { unit_type:'cavalry',  tier:3, count:300  }, { unit_type:'cavalry',  tier:4, count:80  }, { unit_type:'cavalry',  tier:5, count:15  },
      { unit_type:'siege',    tier:1, count:400  }, { unit_type:'siege',    tier:2, count:200  }, { unit_type:'siege',    tier:3, count:80   }, { unit_type:'siege',    tier:4, count:20  }, { unit_type:'siege',    tier:5, count:5   },
    ],
    // GoblinKing — mid-range
    [
      { unit_type:'archer',   tier:1, count:2500 }, { unit_type:'archer',   tier:2, count:1500 }, { unit_type:'archer',   tier:3, count:600  }, { unit_type:'archer',   tier:4, count:0  }, { unit_type:'archer',   tier:5, count:0   },
      { unit_type:'infantry', tier:1, count:3000 }, { unit_type:'infantry', tier:2, count:1800 }, { unit_type:'infantry', tier:3, count:700  }, { unit_type:'infantry', tier:4, count:0  }, { unit_type:'infantry', tier:5, count:0   },
      { unit_type:'cavalry',  tier:1, count:2000 }, { unit_type:'cavalry',  tier:2, count:1200 }, { unit_type:'cavalry',  tier:3, count:500  }, { unit_type:'cavalry',  tier:4, count:100}, { unit_type:'cavalry',  tier:5, count:0   },
      { unit_type:'siege',    tier:1, count:600  }, { unit_type:'siege',    tier:2, count:350  }, { unit_type:'siege',    tier:3, count:120  }, { unit_type:'siege',    tier:4, count:0  }, { unit_type:'siege',    tier:5, count:0   },
    ],
    // FairyQueen — defensive, lower attack
    [
      { unit_type:'archer',   tier:1, count:2000 }, { unit_type:'archer',   tier:2, count:1000 }, { unit_type:'archer',   tier:3, count:400  }, { unit_type:'archer',   tier:4, count:0  }, { unit_type:'archer',   tier:5, count:0   },
      { unit_type:'infantry', tier:1, count:2500 }, { unit_type:'infantry', tier:2, count:1200 }, { unit_type:'infantry', tier:3, count:400  }, { unit_type:'infantry', tier:4, count:0  }, { unit_type:'infantry', tier:5, count:0   },
      { unit_type:'cavalry',  tier:1, count:800  }, { unit_type:'cavalry',  tier:2, count:400  }, { unit_type:'cavalry',  tier:3, count:0   }, { unit_type:'cavalry',  tier:4, count:0  }, { unit_type:'cavalry',  tier:5, count:0   },
      { unit_type:'siege',    tier:1, count:200  }, { unit_type:'siege',    tier:2, count:80   }, { unit_type:'siege',    tier:3, count:0   }, { unit_type:'siege',    tier:4, count:0  }, { unit_type:'siege',    tier:5, count:0   },
    ],
    // SteelGuard — siege & infantry focused
    [
      { unit_type:'archer',   tier:1, count:1000 }, { unit_type:'archer',   tier:2, count:400  }, { unit_type:'archer',   tier:3, count:0   }, { unit_type:'archer',   tier:4, count:0  }, { unit_type:'archer',   tier:5, count:0   },
      { unit_type:'infantry', tier:1, count:3500 }, { unit_type:'infantry', tier:2, count:2000 }, { unit_type:'infantry', tier:3, count:800  }, { unit_type:'infantry', tier:4, count:200}, { unit_type:'infantry', tier:5, count:0   },
      { unit_type:'cavalry',  tier:1, count:500  }, { unit_type:'cavalry',  tier:2, count:200  }, { unit_type:'cavalry',  tier:3, count:0   }, { unit_type:'cavalry',  tier:4, count:0  }, { unit_type:'cavalry',  tier:5, count:0   },
      { unit_type:'siege',    tier:1, count:1200 }, { unit_type:'siege',    tier:2, count:800  }, { unit_type:'siege',    tier:3, count:300  }, { unit_type:'siege',    tier:4, count:80 }, { unit_type:'siege',    tier:5, count:0   },
    ],
    // SwiftRider — cavalry focused
    [
      { unit_type:'archer',   tier:1, count:800  }, { unit_type:'archer',   tier:2, count:300  }, { unit_type:'archer',   tier:3, count:0   }, { unit_type:'archer',   tier:4, count:0  }, { unit_type:'archer',   tier:5, count:0   },
      { unit_type:'infantry', tier:1, count:600  }, { unit_type:'infantry', tier:2, count:200  }, { unit_type:'infantry', tier:3, count:0   }, { unit_type:'infantry', tier:4, count:0  }, { unit_type:'infantry', tier:5, count:0   },
      { unit_type:'cavalry',  tier:1, count:2500 }, { unit_type:'cavalry',  tier:2, count:1500 }, { unit_type:'cavalry',  tier:3, count:600  }, { unit_type:'cavalry',  tier:4, count:150}, { unit_type:'cavalry',  tier:5, count:0   },
      { unit_type:'siege',    tier:1, count:100  }, { unit_type:'siege',    tier:2, count:0    }, { unit_type:'siege',    tier:3, count:0   }, { unit_type:'siege',    tier:4, count:0  }, { unit_type:'siege',    tier:5, count:0   },
    ],
    // NewRecruit — just starting
    [
      { unit_type:'archer',   tier:1, count:200  }, { unit_type:'archer',   tier:2, count:0    }, { unit_type:'archer',   tier:3, count:0   }, { unit_type:'archer',   tier:4, count:0  }, { unit_type:'archer',   tier:5, count:0   },
      { unit_type:'infantry', tier:1, count:300  }, { unit_type:'infantry', tier:2, count:0    }, { unit_type:'infantry', tier:3, count:0   }, { unit_type:'infantry', tier:4, count:0  }, { unit_type:'infantry', tier:5, count:0   },
      { unit_type:'cavalry',  tier:1, count:50   }, { unit_type:'cavalry',  tier:2, count:0    }, { unit_type:'cavalry',  tier:3, count:0   }, { unit_type:'cavalry',  tier:4, count:0  }, { unit_type:'cavalry',  tier:5, count:0   },
      { unit_type:'siege',    tier:1, count:0    }, { unit_type:'siege',    tier:2, count:0    }, { unit_type:'siege',    tier:3, count:0   }, { unit_type:'siege',    tier:4, count:0  }, { unit_type:'siege',    tier:5, count:0   },
    ],
  ];

  let total = 0;
  for (let i = 0; i < users.length; i++) {
    const docs = unitDefs[i].filter(u => u.count > 0).map(u => ({ player_id: users[i]._id, ...u }));
    if (docs.length) {
      await Unit.insertMany(docs);
      total += docs.length;
    }
  }
  console.log(`  ✅ ${total} unit records created`);
}

// ─── Seed Heroes ──────────────────────────────────────────────────────────────
async function seedHeroes(users) {
  console.log('🦸 Seeding heroes…');

  // Hero configs per user: [template_id, level, stars, is_unlocked, shards]
  const heroDefs = [
    // IronKing — all 7 heroes, top 3 maxed out
    [
      { t:'warrior_king',  level:80, stars:5, unlocked:true,  shards:250, exp:900000 },
      { t:'dragon_rider',  level:65, stars:4, unlocked:true,  shards:180, exp:600000 },
      { t:'storm_mage',    level:50, stars:3, unlocked:true,  shards:120, exp:350000 },
      { t:'shadow_archer', level:45, stars:3, unlocked:true,  shards:100, exp:280000 },
      { t:'iron_vanguard', level:40, stars:2, unlocked:true,  shards:80,  exp:200000 },
      { t:'sea_captain',   level:30, stars:1, unlocked:true,  shards:50,  exp:80000  },
      { t:'beast_slayer',  level:20, stars:0, unlocked:true,  shards:30,  exp:30000  },
    ],
    // ElvenArcher — 5 heroes
    [
      { t:'shadow_archer', level:70, stars:5, unlocked:true,  shards:220, exp:750000 },
      { t:'storm_mage',    level:55, stars:4, unlocked:true,  shards:140, exp:420000 },
      { t:'warrior_king',  level:40, stars:2, unlocked:true,  shards:75,  exp:210000 },
      { t:'sea_captain',   level:35, stars:2, unlocked:true,  shards:65,  exp:150000 },
      { t:'beast_slayer',  level:25, stars:1, unlocked:true,  shards:40,  exp:55000  },
    ],
    // GoblinKing — 4 heroes
    [
      { t:'iron_vanguard', level:55, stars:4, unlocked:true,  shards:130, exp:430000 },
      { t:'warrior_king',  level:40, stars:2, unlocked:true,  shards:70,  exp:190000 },
      { t:'sea_captain',   level:30, stars:1, unlocked:true,  shards:45,  exp:75000  },
      { t:'dragon_rider',  level:20, stars:0, unlocked:true,  shards:20,  exp:20000  },
    ],
    // FairyQueen — 3 heroes
    [
      { t:'storm_mage',    level:48, stars:3, unlocked:true,  shards:110, exp:290000 },
      { t:'warrior_king',  level:32, stars:1, unlocked:true,  shards:55,  exp:95000  },
      { t:'shadow_archer', level:18, stars:0, unlocked:true,  shards:15,  exp:12000  },
    ],
    // SteelGuard — 3 heroes
    [
      { t:'iron_vanguard', level:42, stars:2, unlocked:true,  shards:85,  exp:220000 },
      { t:'warrior_king',  level:28, stars:1, unlocked:true,  shards:40,  exp:60000  },
      { t:'beast_slayer',  level:15, stars:0, unlocked:false, shards:18,  exp:8000   },
    ],
    // SwiftRider — 2 heroes
    [
      { t:'dragon_rider',  level:35, stars:2, unlocked:true,  shards:60,  exp:140000 },
      { t:'shadow_archer', level:20, stars:0, unlocked:true,  shards:25,  exp:25000  },
    ],
    // NewRecruit — 1 hero starter
    [
      { t:'warrior_king',  level:5,  stars:0, unlocked:true,  shards:10,  exp:2000   },
    ],
  ];

  let total = 0;
  for (let i = 0; i < users.length; i++) {
    const docs = heroDefs[i].map(h => ({
      player_id:   users[i]._id,
      template_id: h.t,
      level:       h.level,
      exp:         h.exp,
      stars:       h.stars,
      shards:      h.shards,
      is_unlocked: h.unlocked,
      skill_levels: { primary: Math.max(1, Math.floor(h.level / 20)), secondary: Math.max(1, Math.floor(h.level / 30)) },
    }));
    await Hero.insertMany(docs);
    total += docs.length;
  }
  console.log(`  ✅ ${total} hero records created`);
}

// ─── Seed Dragons ─────────────────────────────────────────────────────────────
async function seedDragons(users) {
  console.log('🐉 Seeding dragons…');

  // [user_index, dragon_type, level, hp_max_multiplier, skill_level]
  const dragonDefs = [
    // IronKing — 3 dragons
    { ui:0, t:'emberstrike', level:40, hp:80000,  skill_p:5, skill_s:4 },
    { ui:0, t:'voidwing',    level:25, hp:50000,  skill_p:3, skill_s:2 },
    { ui:0, t:'stormbeak',   level:15, hp:28000,  skill_p:2, skill_s:1 },
    // ElvenArcher — 2 dragons
    { ui:1, t:'tideclaw',    level:30, hp:60000,  skill_p:4, skill_s:3 },
    { ui:1, t:'stormbeak',   level:18, hp:35000,  skill_p:2, skill_s:1 },
    // GoblinKing — 2 dragons
    { ui:2, t:'venomfang',   level:22, hp:44000,  skill_p:3, skill_s:2 },
    { ui:2, t:'emberstrike', level:12, hp:22000,  skill_p:1, skill_s:1 },
    // FairyQueen — 1 dragon
    { ui:3, t:'stormbeak',   level:20, hp:40000,  skill_p:3, skill_s:2 },
    // SteelGuard — 1 dragon
    { ui:4, t:'emberstrike', level:10, hp:18000,  skill_p:1, skill_s:1 },
    // SwiftRider — 1 dragon
    { ui:5, t:'tideclaw',    level:8,  hp:14000,  skill_p:1, skill_s:1 },
  ];

  const docs = dragonDefs.map(d => ({
    player_id: users[d.ui]._id,
    dragon_type: d.t,
    level: d.level,
    exp: Math.floor(1000 * Math.pow(d.level, 1.8) * 0.6),
    hp_current: d.hp,
    hp_max: d.hp,
    primary_skill_level: d.skill_p,
    secondary_skill_level: d.skill_s,
    status: 'idle',
  }));

  await Dragon.insertMany(docs);
  console.log(`  ✅ ${docs.length} dragon records created`);
}

// ─── Seed Ships ───────────────────────────────────────────────────────────────
async function seedShips(users) {
  console.log('⚓ Seeding ships…');

  const shipDefs = [
    // IronKing
    [
      { t:'galleon',     count:8,  hp:15, atk:12 },
      { t:'warship',     count:4,  hp:20, atk:18 },
      { t:'ironclad',    count:2,  hp:25, atk:22 },
    ],
    // ElvenArcher
    [
      { t:'war_canoe',   count:15, hp:8,  atk:10 },
      { t:'galleon',     count:5,  hp:12, atk:10 },
    ],
    // GoblinKing
    [
      { t:'fishing_boat',count:20, hp:5,  atk:5  },
      { t:'war_canoe',   count:10, hp:8,  atk:8  },
      { t:'galleon',     count:3,  hp:10, atk:8  },
    ],
    // FairyQueen
    [
      { t:'fishing_boat',count:12, hp:4,  atk:3  },
      { t:'war_canoe',   count:6,  hp:6,  atk:6  },
    ],
    // SteelGuard
    [
      { t:'warship',     count:3,  hp:18, atk:16 },
      { t:'galleon',     count:2,  hp:12, atk:10 },
    ],
    // SwiftRider
    [
      { t:'fishing_boat',count:8,  hp:3,  atk:2  },
    ],
  ];

  let total = 0;
  for (let i = 0; i < Math.min(users.length, shipDefs.length); i++) {
    const docs = shipDefs[i].map(s => ({
      player_id: users[i]._id,
      ship_type:  s.t,
      count:      s.count,
      hp_bonus:   s.hp,
      atk_bonus:  s.atk,
    }));
    await Ship.insertMany(docs);
    total += docs.length;
  }
  console.log(`  ✅ ${total} ship records created`);
}

// ─── Seed Research ────────────────────────────────────────────────────────────
async function seedResearch(users) {
  console.log('🔬 Seeding research…');

  let total = 0;
  for (let ui = 0; ui < users.length; ui++) {
    const u = RAW_USERS[ui];
    const ch = u.city_hall_level;
    const docs = [];

    for (const [branch, nodes] of Object.entries(RESEARCH_NODES)) {
      const maxLevel = Math.max(0, Math.floor(ch / 3));
      nodes.forEach((node_id, idx) => {
        // Higher index nodes need more city hall level
        const nodeLevel = Math.max(0, maxLevel - idx);
        if (nodeLevel > 0) {
          docs.push({ player_id: users[ui]._id, node_id, branch, current_level: nodeLevel, in_progress: false });
        }
      });
    }

    if (docs.length) {
      await Research.insertMany(docs);
      total += docs.length;
    }
  }
  console.log(`  ✅ ${total} research records created`);
}

// ─── Seed World Mines ─────────────────────────────────────────────────────────
async function seedMines(users) {
  console.log('⛏️  Seeding world mines…');

  const docs = MINE_LAYOUT.map((m, idx) => {
    // Assign first 2 mines to top players
    const occupant = idx < 2 ? users[idx % 2]._id : null;
    return {
      ...m,
      occupant_id: occupant,
      occupied_at: occupant ? past(H(2)) : null,
      occupation_expires_at: occupant ? future(H(4)) : null,
      last_harvest: past(H(1)),
    };
  });

  await Mine.insertMany(docs);
  console.log(`  ✅ ${docs.length} mines seeded`);
}

// ─── Seed World Beasts ────────────────────────────────────────────────────────
async function seedBeasts() {
  console.log('🐺 Seeding world beasts…');

  const docs = BEAST_LAYOUT.map(b => ({
    ...b,
    hp_current: b.hp_max,
    status: 'alive',
  }));

  await Beast.insertMany(docs);
  console.log(`  ✅ ${docs.length} beasts seeded`);
}

// ─── Seed Tournaments ─────────────────────────────────────────────────────────
async function seedTournaments(users, heroList) {
  console.log('🏆 Seeding tournaments…');

  // Fetch heroes per user for hero_ids
  const userHeroMap = {};
  const allHeroes = await Hero.find({ player_id: { $in: users.map(u => u._id) } });
  for (const h of allHeroes) {
    const key = h.player_id.toString();
    if (!userHeroMap[key]) userHeroMap[key] = [];
    userHeroMap[key].push(h._id);
  }

  const getHeroIds = (uid, n) => (userHeroMap[uid.toString()] || []).slice(0, n);

  const divisions = ['bronze','silver','gold','platinum','diamond','legend'];
  const makeTeam = (user, n, div, tier, wins, losses, crowns) => ({
    team_id:    uuidv4(),
    player_id:  user._id,
    hero_ids:   getHeroIds(user._id, n),
    division:   div,
    tier,
    wins,
    losses,
    war_points: wins * 150 - losses * 50,
    crowns,
  });

  const team3v3 = [
    makeTeam(users[0], 3, 'legend',  5, 18, 2,  45),
    makeTeam(users[1], 3, 'diamond', 4, 14, 6,  32),
    makeTeam(users[2], 3, 'gold',    3, 8,  8,  18),
    makeTeam(users[3], 3, 'silver',  2, 5,  10, 10),
    makeTeam(users[4], 3, 'silver',  2, 4,  11, 8 ),
    makeTeam(users[5], 3, 'bronze',  1, 2,  14, 4 ),
  ];

  const team5v5 = [
    makeTeam(users[0], 5, 'platinum',4, 10, 5,  28),
    makeTeam(users[1], 5, 'gold',    3, 7,  7,  16),
    makeTeam(users[2], 5, 'silver',  2, 4,  9,  9 ),
    makeTeam(users[3], 5, 'bronze',  1, 2,  12, 4 ),
  ];

  // Build sample match history
  const buildMatches = (teams, rounds = 3) => {
    const matches = [];
    for (let r = 1; r <= rounds; r++) {
      for (let i = 0; i < teams.length - 1; i += 2) {
        const a = teams[i];
        const b = teams[i + 1];
        if (!a || !b) continue;
        const winner = a.wins >= b.wins ? a.team_id : b.team_id;
        matches.push({
          round: r,
          team_a_id: a.team_id,
          team_b_id: b.team_id,
          winner_team_id: winner,
          log: { rounds: 3, attacker_wins: 2, defender_wins: 1 },
          played_at: past(D(r)),
        });
      }
    }
    return matches;
  };

  await Tournament.insertMany([
    {
      format: '3v3',
      season: 1,
      week: 3,
      status: 'active',
      signup_end:  past(D(14)),
      battles_end: future(D(7)),
      finals_end:  future(D(14)),
      teams: team3v3,
      matches: buildMatches(team3v3),
    },
    {
      format: '5v5',
      season: 1,
      week: 2,
      status: 'active',
      signup_end:  past(D(7)),
      battles_end: future(D(14)),
      finals_end:  future(D(21)),
      teams: team5v5,
      matches: buildMatches(team5v5, 2),
    },
  ]);
  console.log('  ✅ 2 tournaments seeded (3v3 + 5v5)');
}

// ─── Seed Capital War ─────────────────────────────────────────────────────────
async function seedCapitalWar(users, alliances) {
  console.log('🏯 Seeding capital war…');

  await CapitalWar.create({
    server_id: 'server_1',
    season: 1,
    status: 'battle',
    declaration_end: past(D(2)),
    march_end:       past(D(1)),
    battle_end:      future(H(12)),
    holding_alliance: alliances[0]._id,
    capital_wall_hp: 650000,
    capital_wall_hp_max: 1000000,
    troops_on_capital: [
      { alliance_id: alliances[0]._id, player_id: users[0]._id, troop_count: 45000, arrived_at: past(H(8)) },
      { alliance_id: alliances[0]._id, player_id: users[1]._id, troop_count: 32000, arrived_at: past(H(6)) },
      { alliance_id: alliances[1]._id, player_id: users[4]._id, troop_count: 18000, arrived_at: past(H(4)) },
      { alliance_id: alliances[1]._id, player_id: users[5]._id, troop_count:  9000, arrived_at: past(H(2)) },
    ],
    war_point_log: [
      { player_id: users[0]._id, alliance_id: alliances[0]._id, action: 'march_arrived',    points: 200, at: past(H(8)) },
      { player_id: users[1]._id, alliance_id: alliances[0]._id, action: 'march_arrived',    points: 200, at: past(H(6)) },
      { player_id: users[0]._id, alliance_id: alliances[0]._id, action: 'capital_attacked', points: 500, at: past(H(5)) },
      { player_id: users[4]._id, alliance_id: alliances[1]._id, action: 'march_arrived',    points: 200, at: past(H(4)) },
      { player_id: users[1]._id, alliance_id: alliances[0]._id, action: 'capital_attacked', points: 300, at: past(H(3)) },
      { player_id: users[5]._id, alliance_id: alliances[1]._id, action: 'march_arrived',    points: 200, at: past(H(2)) },
    ],
    declarations: [alliances[0]._id, alliances[1]._id],
  });
  console.log('  ✅ Capital war seeded (battle phase, 12h remaining)');
}

// ─── Seed Combat Reports ──────────────────────────────────────────────────────
async function seedCombatReports(users) {
  console.log('📋 Seeding combat reports…');

  const sampleTroops = (scale = 1) => ({
    archer:   { T1: Math.floor(2000 * scale), T2: Math.floor(1200 * scale), T3: Math.floor(500 * scale) },
    infantry: { T1: Math.floor(2500 * scale), T2: Math.floor(1500 * scale), T3: Math.floor(600 * scale) },
    cavalry:  { T1: Math.floor(1000 * scale), T2: Math.floor(600  * scale), T3: Math.floor(200 * scale) },
    siege:    { T1: Math.floor(300  * scale), T2: Math.floor(150  * scale) },
  });

  const sampleRound = (n) => ({
    round_number: n,
    attacker_dmg: Math.floor(Math.random() * 50000 + 20000),
    defender_dmg: Math.floor(Math.random() * 40000 + 15000),
    attacker_losses: { infantry: Math.floor(Math.random() * 200), archer: Math.floor(Math.random() * 150) },
    defender_losses: { infantry: Math.floor(Math.random() * 300), cavalry: Math.floor(Math.random() * 100) },
    dragon_skill_used: n === 1 ? 'Flame Burst' : null,
    spell_used: null,
  });

  const battles = [
    // IronKing attacks ElvenArcher — attacker wins
    {
      attacker_id: users[0]._id, defender_id: users[1]._id, battle_type: 'pvp',
      attacker_troops: sampleTroops(1), defender_troops: sampleTroops(0.7),
      terrain_type: 'plains', wall_level: 14, result: 'attacker_win',
      rounds: [1,2,3,4,5].map(sampleRound),
      loot: { gold: 45000, food: 32000, wood: 18000, stone: 12000, mana: 800, dragon_energy: 200, trade_goods: 150, gems: 5 },
      attacker_power_score: 285000, defender_power_score: 198000,
      location: { x: 25, y: 25 }, created_at: past(D(1)),
    },
    // ElvenArcher attacks GoblinKing — attacker wins
    {
      attacker_id: users[1]._id, defender_id: users[2]._id, battle_type: 'pvp',
      attacker_troops: sampleTroops(0.8), defender_troops: sampleTroops(0.6),
      terrain_type: 'forest', wall_level: 10, result: 'attacker_win',
      rounds: [1,2,3].map(sampleRound),
      loot: { gold: 28000, food: 18000, wood: 22000, stone: 8000, mana: 500, dragon_energy: 100, trade_goods: 80, gems: 2 },
      attacker_power_score: 198000, defender_power_score: 145000,
      location: { x: 30, y: 18 }, created_at: past(H(20)),
    },
    // GoblinKing attacks FairyQueen — defender wins
    {
      attacker_id: users[2]._id, defender_id: users[3]._id, battle_type: 'pvp',
      attacker_troops: sampleTroops(0.5), defender_troops: sampleTroops(0.5),
      terrain_type: 'swamp', wall_level: 8, result: 'defender_win',
      rounds: [1,2,3,4,5,6,7,8,9,10].map(sampleRound),
      loot: { gold: 0, food: 0, wood: 0, stone: 0, mana: 0, dragon_energy: 0, trade_goods: 0, gems: 0 },
      attacker_power_score: 145000, defender_power_score: 152000,
      location: { x: 28, y: 30 }, created_at: past(H(15)),
    },
    // IronKing kills beast
    {
      attacker_id: users[0]._id, defender_id: null, battle_type: 'pve',
      attacker_troops: sampleTroops(0.3), defender_troops: null,
      terrain_type: 'plains', wall_level: 0, result: 'attacker_win',
      rounds: [1,2,3].map(sampleRound),
      loot: { gold: 15000, food: 8000, wood: 5000, stone: 3000, mana: 2000, dragon_energy: 500, trade_goods: 0, gems: 3 },
      attacker_power_score: 285000, defender_power_score: 40000,
      location: { x: 12, y: 14 }, created_at: past(H(10)),
    },
    // SteelGuard vs SwiftRider — draw after 10 rounds
    {
      attacker_id: users[4]._id, defender_id: users[5]._id, battle_type: 'pvp',
      attacker_troops: sampleTroops(0.4), defender_troops: sampleTroops(0.35),
      terrain_type: 'desert', wall_level: 6, result: 'draw',
      rounds: [1,2,3,4,5,6,7,8,9,10].map(sampleRound),
      loot: { gold: 0, food: 0, wood: 0, stone: 0, mana: 0, dragon_energy: 0, trade_goods: 0, gems: 0 },
      attacker_power_score: 98000, defender_power_score: 92000,
      location: { x: 22, y: 35 }, created_at: past(H(6)),
    },
    // Hero duel
    {
      attacker_id: users[0]._id, defender_id: users[1]._id, battle_type: 'duel',
      attacker_troops: {}, defender_troops: {},
      terrain_type: 'plains', wall_level: 0, result: 'attacker_win',
      rounds: [1,2,3].map(sampleRound),
      loot: { gold: 5000, food: 0, wood: 0, stone: 0, mana: 0, dragon_energy: 0, trade_goods: 0, gems: 0 },
      attacker_power_score: 285000, defender_power_score: 198000,
      location: { x: 20, y: 20 }, created_at: past(H(3)),
    },
  ];

  await CombatReport.insertMany(battles);
  console.log(`  ✅ ${battles.length} combat reports seeded`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🌱 COMPLETE GAME WORLD SEED');
  console.log('═══════════════════════════════════════════════════════════');

  await connect();
  await clearAll();

  const users     = await seedUsers();
  const alliances = await seedAlliances(users);
  await seedCities(users);
  await seedUnits(users);
  await seedHeroes(users);
  await seedDragons(users);
  await seedShips(users);
  await seedResearch(users);
  await seedMines(users);
  await seedBeasts();
  await seedTournaments(users);
  await seedCapitalWar(users, alliances);
  await seedCombatReports(users);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ SEED COMPLETE — World is alive!');
  console.log('');
  console.log('Test Accounts:');
  RAW_USERS.forEach(u => console.log(`  ${u.username.padEnd(14)} | ${u.email.padEnd(30)} | password: Test1234!`));
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
