import Ship from '../models/Ship.model.js';
import City from '../models/City.model.js';
import User from '../models/User.model.js';
import { SHIP_STATS } from '../services/gameData.service.js';
import logger from '../utils/logger.js';

const TRADE_ROUTE_DURATION_MS = 6 * 3600 * 1000; // 6 hours

// GET /api/v1/naval/ships  — get player fleet
export const getFleet = async (req, res, next) => {
  try {
    const ships = await Ship.find({ player_id: req.user.id });
    const now = new Date();

    // Auto-complete trade routes
    for (const ship of ships) {
      let changed = false;
      for (const route of ship.trade_routes) {
        if (route.status === 'outbound' && route.arrive_at <= now) {
          route.status = 'returning';
          route.return_at = new Date(Date.now() + TRADE_ROUTE_DURATION_MS);
          changed = true;
        } else if (route.status === 'returning' && route.return_at && route.return_at <= now) {
          // Reward trade goods
          const city = await City.findOne({ player_id: req.user.id });
          if (city) {
            city.resources.trade_goods = (city.resources.trade_goods || 0) + (route.cargo_amount || 500);
            await city.save();
          }
          route.status = 'complete';
          changed = true;
        }
      }
      ship.trade_routes = ship.trade_routes.filter(r => r.status !== 'complete');
      if (changed) await ship.save();
    }

    const fleet = Object.keys(SHIP_STATS).map(type => {
      const owned = ships.find(s => s.ship_type === type);
      return {
        type,
        ...SHIP_STATS[type],
        count: owned?.count || 0,
        active_trade_routes: owned?.trade_routes?.length || 0,
      };
    });

    res.json({ success: true, data: fleet });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/naval/stats — ship stat table
export const getShipStats = async (req, res, next) => {
  res.json({ success: true, data: SHIP_STATS });
};

// POST /api/v1/naval/build — build ships
export const buildShips = async (req, res, next) => {
  try {
    const { ship_type, count } = req.body;
    const shipConfig = SHIP_STATS[ship_type];
    if (!shipConfig) return res.status(400).json({ success: false, error: 'Invalid ship type' });

    const city = await City.findOne({ player_id: req.user.id });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });

    const harbor = city.buildings.find(b => b.type === 'harbor');
    if (!harbor) return res.status(400).json({ success: false, error: 'Harbor required' });
    if (city.city_hall_level < shipConfig.unlockLevel) {
      return res.status(400).json({ success: false, error: `Requires City Hall level ${shipConfig.unlockLevel}` });
    }

    // Ship cost (gold + wood per ship)
    const cost = { gold: 500 * count * harbor.level, wood: 300 * count * harbor.level };
    if (city.resources.gold < cost.gold || city.resources.wood < cost.wood) {
      return res.status(400).json({ success: false, error: 'Insufficient resources to build ships' });
    }

    city.resources.gold -= cost.gold;
    city.resources.wood -= cost.wood;
    await city.save();

    let ship = await Ship.findOne({ player_id: req.user.id, ship_type });
    if (!ship) {
      ship = await Ship.create({ player_id: req.user.id, ship_type, count: 0 });
    }
    ship.count += count;
    await ship.save();

    logger.info(`Built ${count} ${ship_type} for player ${req.user.id}`);
    res.json({ success: true, data: { ship_type, count: ship.count, cost } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/naval/trade  — send trade route
export const sendTradeRoute = async (req, res, next) => {
  try {
    const { destination_player_id, ship_type, cargo_type, cargo_amount } = req.body;

    const ship = await Ship.findOne({ player_id: req.user.id, ship_type });
    if (!ship || ship.count < 1) {
      return res.status(400).json({ success: false, error: 'No ships of this type available' });
    }
    if (ship.trade_routes.length >= 3) {
      return res.status(400).json({ success: false, error: 'Max 3 trade routes active per ship type' });
    }

    const target = await User.findById(destination_player_id);
    if (!target) return res.status(404).json({ success: false, error: 'Target player not found' });

    const arriveAt = new Date(Date.now() + TRADE_ROUTE_DURATION_MS);

    ship.trade_routes.push({
      destination_player_id,
      cargo_type: cargo_type || 'gold',
      cargo_amount: cargo_amount || 500,
      depart_at: new Date(),
      arrive_at: arriveAt,
      status: 'outbound',
    });

    await ship.save();

    res.json({ success: true, message: 'Trade route dispatched', data: { arrive_at: arriveAt, cargo_type, cargo_amount } });
  } catch (error) {
    next(error);
  }
};
