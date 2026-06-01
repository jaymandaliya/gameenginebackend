// Meshy.ai Service - Real text-to-3D .glb generation
// API docs: https://docs.meshy.ai/api-text-to-3d
// Get your key: https://www.meshy.ai/api - set MESHY_API_KEY in .env

import axios from 'axios';
import logger from '../utils/logger.js';

const MESHY_BASE_URL = 'https://api.meshy.ai';
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 60; // 3 min max

// Meshy API keys look like: msy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32+ chars)
const isValidMeshyKey = (key) =>
  typeof key === 'string' && key.startsWith('msy_') && key.length >= 20;

const getMeshyClient = () => {
  const key = process.env.MESHY_API_KEY;
  if (!key || !isValidMeshyKey(key)) return null;
  return axios.create({
    baseURL: MESHY_BASE_URL,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    timeout: 60000,
  });
};

const isMockMode = () => {
  const key = process.env.MESHY_API_KEY;
  if (process.env.MOCK_AI_MODE === 'true') return true;
  if (!key || !isValidMeshyKey(key)) {
    logger.warn(
      '[Meshy] MESHY_API_KEY is missing or invalid. ' +
      'Real Meshy keys start with msy_ and are 32+ characters. ' +
      'Get yours at https://www.meshy.ai/api'
    );
    return true; // treat as mock so we throw a useful error
  }
  return false;
};

// ─── Mock response ────────────────────────────────────────────────────────────
// Calling isMockMode() as the first step in generateTextTo3D will throw when
// the key is invalid so the controller gets a real error – no silent fallback.
const mockGenerate3DModel = (prompt) => ({
  taskId: `mock_task_${Date.now()}`,
  name: prompt.slice(0, 40),
  modelUrl: '',
  thumbnailUrl: '',
  glbUrl: '',
  fbxUrl: '',
  objUrl: '',
  polygons: 10000,
  format: 'glb',
  status: 'SUCCEEDED',
  provider: 'meshy-mock',
  description: `[Mock] 3D model for: ${prompt}. Set MESHY_API_KEY for real .glb generation.`,
});

// ─── Poll task until done ─────────────────────────────────────────────────────
const pollTaskUntilDone = async (client, taskId) => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const response = await client.get(`/openapi/v2/text-to-3d/${taskId}`);
    const task = response.data;

    logger.info(`[Meshy] Task ${taskId} status=${task.status} attempt=${attempt + 1}`);

    if (task.status === 'SUCCEEDED') {
      return task;
    }

    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`Meshy task ${task.status}: ${task.task_error?.message || 'Unknown error'}`);
    }
  }

  throw new Error('Meshy 3D generation timed out after 3 minutes');
};

// ─── Preview pass (fast, lower quality) ──────────────────────────────────────
const createPreviewTask = async (client, prompt) => {
  const response = await client.post('/openapi/v2/text-to-3d', {
    mode: 'preview',
    prompt,
    ai_model: 'meshy-6',
    negative_prompt: 'low quality, blurry, distorted, broken mesh',
    topology: 'triangle',
    target_polycount: 30000,
    should_remesh: true,
  });

  return response.data.result; // taskId
};

// ─── Refine pass (higher quality, needs preview task id) ─────────────────────
const createRefineTask = async (client, previewTaskId) => {
  const response = await client.post('/openapi/v2/text-to-3d', {
    mode: 'refine',
    preview_task_id: previewTaskId,
    enable_pbr: true,
    ai_model: 'latest',
  });

  return response.data.result; // taskId
};

// ─── Main export: text-to-3D ──────────────────────────────────────────────────
export const generateTextTo3D = async (prompt, options = {}) => {
  const { refine = false } = options;

  if (isMockMode()) {
    // Key is missing or invalid – throw so the controller returns a clear error
    // instead of silently falling back to a 2D image.
    const key = process.env.MESHY_API_KEY || '';
    const hint = key
      ? `Current key "${key.slice(0, 6)}…" is invalid (must start with msy_ and be 32+ chars).`
      : 'MESHY_API_KEY is not set.';
    throw new Error(
      `Meshy API key required for 3D generation. ${hint} ` +
      'Get your key at https://www.meshy.ai/api and set MESHY_API_KEY in backend/.env'
    );
  }

  const client = getMeshyClient();
  if (!client) throw new Error('Meshy client unavailable – MESHY_API_KEY not set');

  try {
    logger.info(`[Meshy] Starting text-to-3D preview for: "${prompt}"`);

    // Step 1: preview
    const previewTaskId = await createPreviewTask(client, prompt);
    const previewTask = await pollTaskUntilDone(client, previewTaskId);

    let finalTask = previewTask;

    // Step 2 (optional): refine for higher quality
    if (refine) {
      logger.info(`[Meshy] Starting refine pass for task: ${previewTaskId}`);
      const refineTaskId = await createRefineTask(client, previewTaskId);
      finalTask = await pollTaskUntilDone(client, refineTaskId);
    }

    const urls = finalTask.model_urls || {};

    logger.info(`[Meshy] 3D model done: glb=${urls.glb}`);

    return {
      taskId: finalTask.id,
      name: finalTask.name || prompt.slice(0, 40),
      modelUrl: urls.glb || urls.fbx || urls.obj || '',
      glbUrl: urls.glb || '',
      fbxUrl: urls.fbx || '',
      objUrl: urls.obj || '',
      usdzUrl: urls.usdz || '',
      thumbnailUrl: finalTask.thumbnail_url || '',
      polygons: finalTask.stats?.polygon_count || 10000,
      format: 'glb',
      status: 'SUCCEEDED',
      provider: refine ? 'meshy-refine' : 'meshy-preview',
    };
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || 'Meshy generation failed';
    logger.error(`[Meshy] Error: ${msg}`);
    throw new Error(msg);
  }
};

export default { generateTextTo3D };
