import User from '../models/User.model.js';
import City from '../models/City.model.js';
import logger from '../utils/logger.js';

// Static shop item definitions
const PERSONAL_SHOP_ITEMS = [
  { id: 'gold_pack_sm',    name: 'Small Gold Pack',     type: 'resource', price: { gold: 0 },  reward: { gold: 50000 },   currency: 'gems', gem_cost: 10 },
  { id: 'food_pack_sm',    name: 'Small Food Pack',     type: 'resource', price: { gold: 0 },  reward: { food: 50000 },   currency: 'gems', gem_cost: 10 },
  { id: 'speedup_1h',      name: '1-Hour Speedup',      type: 'speedup',  price: { gold: 0 },  reward: { speedup_ms: 3600000 }, currency: 'gems', gem_cost: 20 },
  { id: 'speedup_8h',      name: '8-Hour Speedup',      type: 'speedup',  price: { gold: 0 },  reward: { speedup_ms: 28800000 }, currency: 'gems', gem_cost: 80 },
  { id: 'common_shard_x5', name: '5× Common Hero Shard',type: 'shard',    price: { gold: 10000 }, reward: { common_shards: 5 }, currency: 'gold', gem_cost: 0 },
  { id: 'elite_shard_x1',  name: '1× Elite Hero Shard', type: 'shard',    price: { gold: 30000 }, reward: { elite_shards: 1 }, currency: 'gold', gem_cost: 0 },
];

const ALLIANCE_SHOP_ITEMS = [
  { id: 'elite_shard_a',   name: 'Elite Hero Shard',    type: 'shard',    alliance_points: 200, reward: { elite_shards: 5 } },
  { id: 'legendary_shard', name: 'Legendary Hero Shard',type: 'shard',    alliance_points: 1000, reward: { legendary_shards: 1 } },
  { id: 'alliance_buff_atk', name: 'Alliance ATK Buff',  type: 'buff',   alliance_points: 500, reward: { alliance_buff: 'attack_bonus', value: 5, duration_h: 24 } },
  { id: 'war_shield_24h',  name: '24h War Shield',      type: 'shield',   alliance_points: 1500, reward: { shield_ms: 86400000 } },
];

const BATTLE_SHOP_ITEMS = [
  { id: 'war_gear_helmet',  name: 'Battle Helmet',      type: 'equipment', battle_medals: 300,  reward: { item_id: 'iron_helmet' } },
  { id: 'troop_atk_buff',   name: 'Troop ATK Scroll',   type: 'buff',      battle_medals: 150,  reward: { troop_atk_bonus: 0.10, duration_h: 4 } },
  { id: 'battle_speedup',   name: 'Battle Speedup 3h',  type: 'speedup',   battle_medals: 200,  reward: { speedup_ms: 10800000 } },
  { id: 'elite_shard_b',    name: 'Elite Hero Shard',   type: 'shard',     battle_medals: 500,  reward: { elite_shards: 3 }, max_per_week: 10 },
];

const PREMIUM_SHOP_ITEMS = [
  { id: 'builder_pack',     name: 'Extra Builder Slot',  type: 'premium',  gem_cost: 500,   reward: { extra_build_queue: 1 } },
  { id: 'dragon_egg',       name: 'Dragon Egg',          type: 'dragon',   gem_cost: 2000,  reward: { dragon_egg: 1 } },
  { id: 'legendary_hero_chest', name: 'Legendary Hero Chest', type: 'chest', gem_cost: 1000, reward: { legendary_shards: 20 } },
  { id: 'vip_pass_month',   name: '30-Day VIP Pass',     type: 'vip',      gem_cost: 3000,  reward: { vip_days: 30 } },
  { id: 'starter_pack',     name: 'Starter Pack',        type: 'bundle',   gem_cost: 100,   real_price_usd: 0.99,
    reward: { gold: 200000, food: 100000, speedup_ms: 7200000, common_shards: 20 } },
  { id: 'growth_pack',      name: 'Growth Pack',         type: 'bundle',   gem_cost: 800,   real_price_usd: 4.99,
    reward: { gold: 1000000, elite_shards: 10, speedup_ms: 86400000, gems: 200 } },
];

const HERO_SHOP_ITEMS = BATTLE_SHOP_ITEMS.filter(i => i.type === 'shard').map(i => ({ ...i, currency: 'hero_tokens' })).concat([
  { id: 'hero_token_aethon', name: 'Aethon Shards ×5',   type: 'shard', hero_tokens: 50,  reward: { template_id: 'aethon_unbroken', shards: 5 } },
  { id: 'hero_token_lyra',   name: 'Lyra Shards ×5',     type: 'shard', hero_tokens: 50,  reward: { template_id: 'lyra_shadowstep', shards: 5 } },
  { id: 'hero_token_mordan', name: 'Mordan Shards ×5',   type: 'shard', hero_tokens: 30,  reward: { template_id: 'mordan_ironwall', shards: 5 } },
  { id: 'guaranteed_legendary', name: 'Guaranteed Legendary (Pity)', type: 'shard', hero_tokens: 300,
    reward: { legendary_shards: 80, note: 'Guaranteed legendary at 300 tokens' } },
]);

// GET /api/v1/shop/personal
export const getPersonalShop = async (req, res, next) => {
  res.json({ success: true, data: PERSONAL_SHOP_ITEMS, refresh_cost_gems: 50 });
};

// GET /api/v1/shop/alliance
export const getAllianceShop = async (req, res, next) => {
  res.json({ success: true, data: ALLIANCE_SHOP_ITEMS });
};

// GET /api/v1/shop/battle
export const getBattleShop = async (req, res, next) => {
  res.json({ success: true, data: BATTLE_SHOP_ITEMS });
};

// GET /api/v1/shop/premium
export const getPremiumShop = async (req, res, next) => {
  res.json({ success: true, data: PREMIUM_SHOP_ITEMS });
};

// GET /api/v1/shop/hero
export const getHeroShop = async (req, res, next) => {
  res.json({ success: true, data: HERO_SHOP_ITEMS });
};

// POST /api/v1/shop/buy — purchase an item
export const buyItem = async (req, res, next) => {
  try {
    const { shop_type, item_id } = req.body;

    const shopMap = {
      personal: PERSONAL_SHOP_ITEMS,
      alliance: ALLIANCE_SHOP_ITEMS,
      battle:   BATTLE_SHOP_ITEMS,
      premium:  PREMIUM_SHOP_ITEMS,
      hero:     HERO_SHOP_ITEMS,
    };

    const items = shopMap[shop_type];
    if (!items) return res.status(400).json({ success: false, error: 'Invalid shop type' });

    const item = items.find(i => i.id === item_id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found in shop' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const city = await City.findOne({ player_id: req.user.id });

    // Deduct currency
    if (shop_type === 'premium' || item.currency === 'gems') {
      const cost = item.gem_cost || 0;
      if (user.gems < cost) return res.status(400).json({ success: false, error: `Need ${cost} Gems` });
      user.gems -= cost;
    } else if (shop_type === 'alliance') {
      const cost = item.alliance_points || 0;
      if (user.alliance_points < cost) return res.status(400).json({ success: false, error: `Need ${cost} Alliance Points` });
      user.alliance_points -= cost;
    } else if (shop_type === 'battle') {
      const cost = item.battle_medals || 0;
      if (user.battle_medals < cost) return res.status(400).json({ success: false, error: `Need ${cost} Battle Medals` });
      user.battle_medals -= cost;
    } else if (shop_type === 'hero') {
      const cost = item.hero_tokens || 0;
      if (user.hero_tokens < cost) return res.status(400).json({ success: false, error: `Need ${cost} Hero Tokens` });
      user.hero_tokens -= cost;
    } else if (item.currency === 'gold' && city) {
      const cost = item.price?.gold || 0;
      if ((city.resources.gold || 0) < cost) return res.status(400).json({ success: false, error: `Need ${cost} Gold` });
      city.resources.gold -= cost;
      await city.save();
    }

    // Apply resource rewards
    if (city && item.reward) {
      const resourceKeys = ['gold','food','wood','stone','mana','dragon_energy','trade_goods','gems'];
      for (const key of resourceKeys) {
        if (item.reward[key]) city.resources[key] = (city.resources[key] || 0) + item.reward[key];
      }
      if (item.reward.gems) user.gems += item.reward.gems;
      await city.save();
    }

    await user.save();

    logger.info(`Shop purchase: ${shop_type}/${item_id} by player ${req.user.id}`);
    res.json({ success: true, message: `Purchased ${item.name}`, data: { item_id, reward: item.reward } });
  } catch (error) {
    next(error);
  }
};
