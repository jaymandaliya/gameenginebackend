import * as openaiService from '../services/openai.service.js';

const safeJson = async (prompt, fallback) => {
  try {
    const generated = await openaiService.generateCode(prompt, 'json');
    const raw = generated?.code || generated;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed;
  } catch {
    return fallback;
  }
};

export const compileShader = async (req, res) => {
  const { graph = {}, style = 'pbr' } = req.body;
  const fallback = {
    style,
    vertex: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragment: 'varying vec2 vUv; void main(){ gl_FragColor = vec4(vUv, 1.0, 1.0); }',
    uniforms: {
      uTime: { type: 'float', value: 0 },
    },
  };

  const result = await safeJson(
    `Compile this shader graph JSON to GLSL JSON with vertex, fragment, uniforms. Graph: ${JSON.stringify(graph)} Style: ${style}`,
    fallback
  );

  res.json({ success: true, data: result });
};

export const generateProceduralMap = async (req, res) => {
  const { genre = 'action', theme = 'forest', size = 'medium', difficulty = 'normal' } = req.body;
  const fallback = {
    heightmap: Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => Math.random())),
    objectPlacements: [
      { type: 'player_spawn', position: { x: 1, y: 0, z: 1 } },
      { type: 'enemy_spawn', position: { x: 10, y: 0, z: 10 } },
    ],
    spawnPoints: [{ x: 1, y: 0, z: 1 }],
  };

  const result = await safeJson(
    `Generate procedural map JSON with heightmap[][], objectPlacements[], spawnPoints[] for genre=${genre}, theme=${theme}, size=${size}, difficulty=${difficulty}`,
    fallback
  );

  res.json({ success: true, data: result });
};

export const generateQuestline = async (req, res) => {
  const { prompt = 'A beginner quest in village' } = req.body;
  const fallback = {
    quests: [
      {
        id: `quest_${Date.now()}`,
        title: 'Village Trouble',
        description: 'Help villagers by collecting herbs and defeating scouts.',
        objectives: [
          { type: 'collect', target: 'herb', required: 5 },
          { type: 'defeat', target: 'goblin_scout', required: 3 },
        ],
        rewards: [{ type: 'currency', id: 'gold', amount: 100 }],
      },
    ],
  };

  const result = await safeJson(
    `Generate questline JSON for: ${prompt}. Must include quests[] with title, description, objectives, rewards.`,
    fallback
  );

  res.json({ success: true, data: result });
};

export const generateNPCBrain = async (req, res) => {
  const { npcName = 'Guard', context = 'Town gate' } = req.body;
  const fallback = {
    npcName,
    personality: { aggressive: 20, passive: 60, intelligence: 55, empathy: 45 },
    goals: ['Guard the gate', 'Warn player if danger nearby'],
    behaviorGraph: {
      conditions: ['enemy_near', 'player_has_pass'],
      actions: ['attack_enemy', 'allow_entry', 'deny_entry'],
    },
  };

  const result = await safeJson(
    `Generate NPC behavior graph JSON for ${npcName} in ${context} with personality, goals, conditions, actions.`,
    fallback
  );

  res.json({ success: true, data: result });
};

export const getNetcodeConfig = async (req, res) => {
  const { mode = 'competitive' } = req.query;
  const config = mode === 'competitive'
    ? { tickRateHz: 128, rollback: true, lagCompensationMs: 200 }
    : { tickRateHz: 60, rollback: true, lagCompensationMs: 120 };

  res.json({ success: true, data: config });
};
