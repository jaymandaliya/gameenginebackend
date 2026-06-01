/**
 * BuildWorker
 *
 * Orchestrates the full export pipeline:
 *   1. Fetch project JSON from MongoDB
 *   2. Write Godot 4 project files to a temp directory
 *   3. Download CDN assets to local temp dir
 *   4. Run Godot headless export
 *   5. Upload artifact to S3
 *   6. Update build record in MongoDB
 *   7. Notify client via Socket.io
 *
 * Runs as a background job triggered by POST /api/engine/export
 *
 * Requires:
 *   - GODOT_PATH env var pointing to Godot 4 headless binary
 *   - AWS S3 credentials (or local FS fallback for dev)
 *   - MongoDB connection (via mongoose)
 */

import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import logger from '../../utils/logger.js';
import {
  generateProjectGodot,
  generateTscn,
  generatePlayerScript,
  generateEnemyScript,
  generateCollectibleScript,
  generateExportPresets,
  visualScriptToGDScript,
} from './GodotConverter.js';

const execAsync = promisify(exec);

// ─────────────────────────────────────────────────────────────────────────────

export class BuildWorker {

  constructor(io) {
    this.io = io;   // Socket.io instance for push notifications
  }

  // ── Main entry point ──────────────────────────────────────────────────────

  async run(buildJob) {
    const { buildId, projectData, platform, userId } = buildJob;

    logger.info(`[BuildWorker] Starting build ${buildId} for platform ${platform}`);
    this.notify(userId, { buildId, status: 'building', progress: 5, message: 'Preparing project files...' });

    const tmpDir = path.join(os.tmpdir(), `build_${buildId}`);

    try {
      // 1. Write Godot project files
      await this.writeGodotProject(tmpDir, projectData, platform);
      this.notify(userId, { buildId, status: 'building', progress: 30, message: 'Downloading assets...' });

      // 2. Download CDN assets to local temp
      await this.downloadAssets(tmpDir, projectData);
      this.notify(userId, { buildId, status: 'building', progress: 50, message: 'Running Godot export...' });

      // 3. Run Godot headless export
      const artifactPath = await this.runGodotExport(tmpDir, platform);
      this.notify(userId, { buildId, status: 'building', progress: 80, message: 'Uploading artifact...' });

      // 4. Upload artifact (S3 or local dev fallback)
      const downloadUrl = await this.uploadArtifact(artifactPath, buildId, platform);
      this.notify(userId, { buildId, status: 'done', progress: 100, downloadUrl, message: 'Build complete!' });

      logger.info(`[BuildWorker] Build ${buildId} complete: ${downloadUrl}`);
      return { success: true, downloadUrl };

    } catch (error) {
      logger.error(`[BuildWorker] Build ${buildId} failed: ${error.message}`);
      this.notify(userId, { buildId, status: 'failed', message: error.message });
      return { success: false, error: error.message };

    } finally {
      // Cleanup temp dir
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  // ── Step 1: Write Godot project files ────────────────────────────────────

  async writeGodotProject(tmpDir, project, platform) {
    const dirs = [
      tmpDir,
      path.join(tmpDir, 'scenes'),
      path.join(tmpDir, 'scripts'),
      path.join(tmpDir, 'assets'),
      path.join(tmpDir, 'build'),
    ];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // project.godot
    const projectGodot = generateProjectGodot(project);
    await fs.writeFile(path.join(tmpDir, 'project.godot'), projectGodot);

    // export_presets.cfg
    const exportPresets = generateExportPresets(platform);
    await fs.writeFile(path.join(tmpDir, 'export_presets.cfg'), exportPresets);

    // icon.svg (minimal)
    await fs.writeFile(path.join(tmpDir, 'icon.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="8" fill="#4a9eff"/><text x="32" y="40" text-anchor="middle" font-size="28">🎮</text></svg>'
    );

    // Generate scene .tscn files
    for (const scene of (project.scenes || [])) {
      const tscn = generateTscn(scene);
      const fileName = sanitizeFileName(scene.name || 'Main') + '.tscn';
      await fs.writeFile(path.join(tmpDir, 'scenes', fileName), tscn);
    }

    // Generate scripts
    for (const scene of (project.scenes || [])) {
      for (const entity of (scene.entities || [])) {
        let script = null;
        if (entity.type === 'player' || entity.type === 'hero') {
          script = generatePlayerScript(entity);
          await fs.writeFile(path.join(tmpDir, 'scripts', `${sanitizeFileName(entity.name || entity.id)}.gd`), script);
        } else if (entity.type === 'enemy' || entity.type === 'monster' || entity.type === 'boss') {
          script = generateEnemyScript(entity);
          await fs.writeFile(path.join(tmpDir, 'scripts', `${sanitizeFileName(entity.name || entity.id)}.gd`), script);
        } else if (entity.type === 'collectible' || entity.type === 'coin' || entity.type === 'gem') {
          script = generateCollectibleScript(entity);
          await fs.writeFile(path.join(tmpDir, 'scripts', `${sanitizeFileName(entity.name || entity.id)}.gd`), script);
        }
      }
    }

    // Compile visual scripts to GDScript
    for (const vs of (project.scripts || [])) {
      const gd = visualScriptToGDScript(vs);
      await fs.writeFile(path.join(tmpDir, 'scripts', `${sanitizeFileName(vs.name || vs.id)}.gd`), gd);
    }
  }

  // ── Step 2: Download assets ───────────────────────────────────────────────

  async downloadAssets(tmpDir, project) {
    const assetsDir = path.join(tmpDir, 'assets');
    const sprites   = project.assets?.sprites || [];
    const audio     = project.assets?.audio   || [];
    const all       = [...sprites, ...audio];

    await Promise.allSettled(
      all.map(async (asset) => {
        if (!asset.url) return;
        try {
          const res  = await axios.get(asset.url, { responseType: 'arraybuffer', timeout: 15000 });
          const ext  = path.extname(new URL(asset.url).pathname) || '.png';
          const file = path.join(assetsDir, sanitizeFileName(asset.id || asset.name) + ext);
          await fs.writeFile(file, Buffer.from(res.data));
        } catch {
          // Non-fatal: engine will fall back to placeholder
          logger.warn(`[BuildWorker] Could not download asset: ${asset.url}`);
        }
      })
    );
  }

  // ── Step 3: Run Godot headless export ─────────────────────────────────────

  async runGodotExport(tmpDir, platform) {
    const godotBin = process.env.GODOT_PATH || 'godot';
    const platformMap = {
      android: 'Android',
      ios:     'iOS',
      web:     'Web',
      windows: 'Windows Desktop',
      mac:     'macOS',
    };
    const godotPlatform = platformMap[platform] || 'Web';

    const extMap = { android: 'apk', ios: 'ipa', web: 'zip', windows: 'exe', mac: 'zip' };
    const ext        = extMap[platform] || 'zip';
    const outputFile = path.join(tmpDir, 'build', `game.${ext}`);

    const cmd = `${godotBin} --headless --path "${tmpDir}" --export-release "${godotPlatform}" "${outputFile}"`;

    logger.info(`[BuildWorker] Running: ${cmd}`);

    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 300000 }); // 5 min timeout
      logger.info('[BuildWorker] Godot stdout:', stdout.slice(0, 500));
      if (stderr) logger.warn('[BuildWorker] Godot stderr:', stderr.slice(0, 500));
    } catch (error) {
      // Godot sometimes exits non-zero even on success — check if file exists
      const exists = await fs.access(outputFile).then(() => true).catch(() => false);
      if (!exists) throw new Error(`Godot export failed: ${error.message}`);
    }

    return outputFile;
  }

  // ── Step 4: Upload artifact ───────────────────────────────────────────────

  async uploadArtifact(artifactPath, buildId, platform) {
    // If S3 is configured, upload there
    if (process.env.AWS_S3_BUCKET) {
      return this.uploadToS3(artifactPath, buildId, platform);
    }

    // Dev fallback: serve from local filesystem via /builds/ static route
    const buildDir = path.join(process.cwd(), 'public', 'builds');
    await fs.mkdir(buildDir, { recursive: true });
    const ext      = path.extname(artifactPath);
    const fileName = `${buildId}${ext}`;
    await fs.copyFile(artifactPath, path.join(buildDir, fileName));
    return `${process.env.API_BASE_URL || 'http://localhost:3000'}/builds/${fileName}`;
  }

  async uploadToS3(artifactPath, buildId, platform) {
    // Dynamic import to avoid requiring AWS SDK if not installed
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

    const fileBuffer = await fs.readFile(artifactPath);
    const ext        = path.extname(artifactPath);
    const key        = `builds/${buildId}${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket:      process.env.AWS_S3_BUCKET,
      Key:         key,
      Body:        fileBuffer,
      ContentType: getMimeType(ext),
    }));

    return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
  }

  // ── Socket.io notification ────────────────────────────────────────────────

  notify(userId, data) {
    if (this.io && userId) {
      this.io.to(`user_${userId}`).emit('build_update', data);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeFileName(name) {
  return (name || 'file').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
}

function getMimeType(ext) {
  const map = { '.apk': 'application/vnd.android.package-archive', '.zip': 'application/zip', '.exe': 'application/octet-stream', '.html': 'text/html' };
  return map[ext] || 'application/octet-stream';
}
