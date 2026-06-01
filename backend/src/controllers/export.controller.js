/**
 * ExportController
 *
 * Handles game export / build requests.
 * Queues a BuildWorker job and tracks progress via MongoDB.
 *
 * Routes:
 *   POST   /api/engine/export         — create a build job
 *   GET    /api/engine/export         — list user's builds
 *   GET    /api/engine/export/:buildId — get build status
 *   DELETE /api/engine/export/:buildId — cancel/delete build
 */

import { v4 as uuid } from 'uuid';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { BuildWorker } from '../services/build/BuildWorker.js';

// ── In-memory build store (swap for MongoDB model in production) ──────────────
// For production, replace this with a Mongoose Build model.
const builds = new Map();

// ─────────────────────────────────────────────────────────────────────────────

export const createExport = async (req, res) => {
  try {
    const { projectData, platform } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!projectData || !platform) {
      return res.status(400).json({ success: false, error: 'projectData and platform are required' });
    }

    const validPlatforms = ['android', 'ios', 'web', 'windows', 'mac'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ success: false, error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` });
    }

    const buildId = uuid();
    const build = {
      id:          buildId,
      projectId:   projectData.project?.id,
      userId:      String(userId),
      platform,
      status:      'queued',
      progress:    0,
      message:     'Build queued',
      downloadUrl: null,
      errorMessage: null,
      startedAt:   new Date().toISOString(),
      completedAt: null,
    };

    builds.set(buildId, build);

    // Kick off build in background (non-blocking)
    const worker = new BuildWorker(req.io);
    setImmediate(async () => {
      build.status   = 'building';
      build.progress = 5;

      const result = await worker.run({ buildId, projectData, platform, userId: String(userId) });

      build.status      = result.success ? 'done' : 'failed';
      build.progress    = result.success ? 100 : 0;
      build.downloadUrl = result.downloadUrl || null;
      build.errorMessage = result.error || null;
      build.completedAt = new Date().toISOString();
    });

    res.status(202).json({
      success: true,
      data: {
        buildId,
        status:    'queued',
        platform,
        message:   'Build job queued. Poll GET /api/engine/export/' + buildId + ' for status.',
      },
    });

  } catch (error) {
    logger.error('[ExportController] createExport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export const getExportStatus = async (req, res) => {
  try {
    const { buildId } = req.params;
    const build = builds.get(buildId);

    if (!build) {
      return res.status(404).json({ success: false, error: 'Build not found' });
    }

    // Authorization: only the owner can see their build
    const userId = String(req.user?.id || req.user?._id);
    if (build.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.json({ success: true, data: build });

  } catch (error) {
    logger.error('[ExportController] getExportStatus error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export const listExports = async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id);
    const userBuilds = [...builds.values()]
      .filter(b => b.userId === userId)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    res.json({ success: true, data: userBuilds });

  } catch (error) {
    logger.error('[ExportController] listExports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export const deleteExport = async (req, res) => {
  try {
    const { buildId } = req.params;
    const build = builds.get(buildId);

    if (!build) {
      return res.status(404).json({ success: false, error: 'Build not found' });
    }

    const userId = String(req.user?.id || req.user?._id);
    if (build.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    builds.delete(buildId);
    res.json({ success: true, message: 'Build deleted' });

  } catch (error) {
    logger.error('[ExportController] deleteExport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
