import Research from '../models/Research.model.js';
import User from '../models/User.model.js';
import City from '../models/City.model.js';
import { RESEARCH_NODES } from '../services/gameData.service.js';
import logger from '../utils/logger.js';

const flatNodes = Object.entries(RESEARCH_NODES).flatMap(([branch, nodes]) =>
  nodes.map(n => ({ ...n, branch }))
);

const findNode = (nodeId) => flatNodes.find(n => n.id === nodeId);

const applyResearchEffect = async (userId, effect, level) => {
  const value = (effect.valuePerLevel || 0) * level;
  const updateKey = `tech_bonuses.${effect.type}`;
  await User.findByIdAndUpdate(userId, { $set: { [updateKey]: value } });
};

// GET /api/v1/research  — get all research progress
export const getResearch = async (req, res, next) => {
  try {
    const research = await Research.find({ player_id: req.user.id });
    const now = new Date();

    // Auto-complete finished research
    for (const r of research) {
      if (r.in_progress && r.finish_at && r.finish_at <= now) {
        r.in_progress = false;
        r.current_level += 1;
        const node = findNode(r.node_id);
        if (node) await applyResearchEffect(req.user.id, node.effect, r.current_level);
        await r.save();
      }
    }

    // Build full tree with progress
    const tree = {};
    for (const [branch, nodes] of Object.entries(RESEARCH_NODES)) {
      tree[branch] = nodes.map(node => {
        const prog = research.find(r => r.node_id === node.id);
        return {
          ...node,
          branch,
          current_level: prog?.current_level || 0,
          in_progress: prog?.in_progress || false,
          finish_at: prog?.finish_at || null,
        };
      });
    }

    res.json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/research/start — start researching a node
export const startResearch = async (req, res, next) => {
  try {
    const { node_id } = req.body;
    const node = findNode(node_id);
    if (!node) return res.status(404).json({ success: false, error: 'Research node not found' });

    // Check for active research in same branch (only 1 at a time)
    const activeInBranch = await Research.findOne({
      player_id: req.user.id,
      branch: node.branch,
      in_progress: true,
    });
    if (activeInBranch) {
      return res.status(400).json({ success: false, error: `Already researching in ${node.branch} branch` });
    }

    let record = await Research.findOne({ player_id: req.user.id, node_id });
    const currentLevel = record?.current_level || 0;

    if (currentLevel >= node.maxLevel) {
      return res.status(400).json({ success: false, error: 'Already at max level' });
    }

    // Check prereqs (simplified — just level check)
    const city = await City.findOne({ player_id: req.user.id });
    if (node.prereq?.building) {
      const b = city?.buildings.find(bld => bld.type === node.prereq.building);
      if (!b || b.level < node.prereq.level) {
        return res.status(400).json({ success: false, error: `Requires ${node.prereq.building} level ${node.prereq.level}` });
      }
    }

    // Research cost (gold: baseTime * 10)
    const researchCost = { gold: node.baseTime * 10 * Math.pow(1.5, currentLevel) };
    if (!city || (city.resources.gold || 0) < researchCost.gold) {
      return res.status(400).json({ success: false, error: `Insufficient gold. Need ${Math.floor(researchCost.gold)}` });
    }

    city.resources.gold -= Math.floor(researchCost.gold);
    await city.save();

    // Time = baseTime * timeMultiplier^currentLevel (seconds → ms)
    const timeMs = node.baseTime * Math.pow(node.timeMultiplier, currentLevel) * 1000;
    const finishAt = new Date(Date.now() + timeMs);

    if (!record) {
      record = await Research.create({
        player_id: req.user.id,
        node_id,
        branch: node.branch,
        in_progress: true,
        start_at: new Date(),
        finish_at: finishAt,
      });
    } else {
      record.in_progress = true;
      record.start_at = new Date();
      record.finish_at = finishAt;
      await record.save();
    }

    logger.info(`Research started: ${node_id} Lv${currentLevel + 1} for player ${req.user.id}`);

    res.json({
      success: true,
      message: `Researching ${node.id} to level ${currentLevel + 1}`,
      data: { node_id, current_level: currentLevel, finish_at: finishAt, cost: researchCost },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/research/speedup
export const speedupResearch = async (req, res, next) => {
  try {
    const { node_id, speedup_ms } = req.body;
    const record = await Research.findOne({ player_id: req.user.id, node_id, in_progress: true });
    if (!record) return res.status(404).json({ success: false, error: 'No active research on this node' });

    const newFinishAt = new Date(record.finish_at.getTime() - speedup_ms);
    record.finish_at = newFinishAt < new Date() ? new Date() : newFinishAt;
    record.speedup_applied_ms += speedup_ms;
    await record.save();

    res.json({ success: true, data: { node_id, new_finish_at: record.finish_at } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/research/cancel
export const cancelResearch = async (req, res, next) => {
  try {
    const { node_id } = req.body;
    const record = await Research.findOne({ player_id: req.user.id, node_id, in_progress: true });
    if (!record) return res.status(404).json({ success: false, error: 'No active research on this node' });

    // 80% refund
    const node = findNode(node_id);
    const refundGold = Math.floor(node.baseTime * 10 * Math.pow(1.5, record.current_level) * 0.8);

    const city = await City.findOne({ player_id: req.user.id });
    if (city) {
      city.resources.gold += refundGold;
      await city.save();
    }

    record.in_progress = false;
    record.finish_at = null;
    record.start_at = null;
    await record.save();

    res.json({ success: true, message: 'Research cancelled', data: { refund_gold: refundGold } });
  } catch (error) {
    next(error);
  }
};
