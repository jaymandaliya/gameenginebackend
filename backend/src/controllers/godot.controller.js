/**
 * GodotController
 *
 * Exposes the Godot Asset Library + engine info to the React Native app.
 *
 * Routes:
 *   GET /api/godot/assets              — search asset library
 *   GET /api/godot/assets/:id          — get asset detail + download URL
 *   GET /api/godot/categories          — list all asset categories
 *   GET /api/godot/collections         — curated collections (sprites, sounds, etc.)
 *   GET /api/godot/engine/info         — installed Godot version + capabilities
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { GodotAssetLibrary } from '../services/GodotAssetLibrary.js';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

// ─────────────────────────────────────────────────────────────────────────────

export const searchAssets = async (req, res) => {
  try {
    const {
      q:             query        = '',
      category                   = '',
      godot_version              = '4',
      page                       = 0,
      max_results                = 20,
      sort                       = 'rating',
      free_only: freeOnly        = 'true',
    } = req.query;

    const result = await GodotAssetLibrary.search({
      query,
      category,
      godot_version,
      page:        parseInt(page),
      max_results: parseInt(max_results),
      sort,
      freeOnly:    freeOnly !== 'false',
    });

    res.json(result);
  } catch (error) {
    logger.error('[GodotController] searchAssets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAsset = async (req, res) => {
  try {
    const result = await GodotAssetLibrary.getAsset(req.params.id);
    res.json(result);
  } catch (error) {
    logger.error('[GodotController] getAsset:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const result = await GodotAssetLibrary.getCategories();
    res.json(result);
  } catch (error) {
    logger.error('[GodotController] getCategories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCuratedCollections = async (req, res) => {
  try {
    const result = await GodotAssetLibrary.getCuratedCollections();
    res.json(result);
  } catch (error) {
    logger.error('[GodotController] getCuratedCollections:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEngineInfo = async (req, res) => {
  try {
    const godotPath = process.env.GODOT_PATH || 'godot';
    let version = process.env.GODOT_VERSION || 'unknown';
    let available = false;

    try {
      const { stdout } = await execAsync(`"${godotPath}" --version`, { timeout: 5000 });
      version   = stdout.trim().split('\n')[0];
      available = true;
    } catch {
      available = false;
    }

    res.json({
      success: true,
      engine: {
        name:      'Godot Engine',
        version,
        available,
        path:      godotPath,
        license:   'MIT (Free & Open Source)',
        website:   'https://godotengine.org',
        exportPlatforms: available
          ? ['android', 'ios', 'web', 'windows', 'mac', 'linux']
          : [],
        features: [
          '2D rendering (CanvasItem)',
          '3D rendering (Vulkan / GL Compatibility)',
          'Physics (2D + 3D)',
          'Animation system',
          'Particle systems',
          'Audio engine',
          'Visual scripting (GDScript)',
          'Multiplayer (ENet / WebSocket)',
          'GDExtension (C++ / Rust bindings)',
        ],
      },
    });
  } catch (error) {
    logger.error('[GodotController] getEngineInfo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
