import * as openaiService from '../services/openai.service.js';
import * as replicateService from '../services/replicate.service.js';
import * as meshyService from '../services/meshy.service.js';
import * as elevenLabsService from '../services/elevenlabs.service.js';
import logger from '../utils/logger.js';

const shouldLogAIDebug = process.env.AI_DEBUG_LOGS === 'true' || process.env.NODE_ENV !== 'production';

const toPreviewText = (value, maxLength = 3000) => {
  if (value === null || value === undefined) return '';

  let text = '';
  if (typeof value === 'string') {
    text = value;
  } else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = '[unserializable]';
    }
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...(truncated)` : text;
};

const logAIDebug = (label, payload) => {
  if (!shouldLogAIDebug) return;
  logger.info(`[AI][BACKEND] ${label}`, payload);
};

const clampInt = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

// Parse natural language command
export const parseCommand = async (req, res, next) => {
  try {
    const { command } = req.body;

    logAIDebug('parse-command.request', {
      userId: req.user?.id || null,
      commandPreview: toPreviewText(command, 800),
    });
    
    if (!command) {
      return res.status(400).json({ 
        success: false, 
        error: 'Command is required' 
      });
    }

    const result = await openaiService.parseCommand(command);

    logAIDebug('parse-command.response', {
      userId: req.user?.id || null,
      resultType: typeof result,
      resultPreview: toPreviewText(result),
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Generate sprite
export const generateSprite = async (req, res, next) => {
  try {
    const { prompt, style = 'pixel-art' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    let result;
    try {
      result = await replicateService.generateSprite(prompt, style);
    } catch (replicateError) {
      logger.warn('[AI][BACKEND] Replicate sprite failed, falling back to OpenAI image generation', {
        error: replicateError?.message || String(replicateError),
      });

      const fallbackImage = await openaiService.generateImage(
        `${prompt}, ${style}, game sprite, transparent background, clean edges`,
        style,
      );

      result = {
        ...fallbackImage,
        provider: 'openai-fallback',
      };
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Generate real 3D model (.glb) via Meshy.ai ONLY
// No silent image fallback – a clear error is returned when the key is missing/invalid.
export const generate3DModel = async (req, res, next) => {
  try {
    const { description, artStyle = 'realistic', refine = false } = req.body;
    
    if (!description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Description is required' 
      });
    }

    logger.info(`[AI][3D] Meshy request: "${description}" artStyle=${artStyle} refine=${refine}`);

    try {
      const result = await meshyService.generateTextTo3D(description, { artStyle, refine });
      logger.info(`[AI][3D] Meshy succeeded: glb=${result.glbUrl} provider=${result.provider}`);
      return res.json({ success: true, data: result });
    } catch (meshyError) {
      const msg = meshyError?.message || String(meshyError);
      logger.error('[AI][3D] Meshy generation failed', { error: msg });

      // Return the real Meshy error – do NOT fall back to a flat 2D image.
      // A 2D image is not a 3D model and silently misleads the client.
      return res.status(502).json({
        success: false,
        error: msg,
        hint: 'Set a valid MESHY_API_KEY (starts with msy_) in backend/.env. Get yours at https://www.meshy.ai/api',
        provider: 'meshy',
      });
    }
  } catch (error) {
    next(error);
  }
};

// Generate image from text
export const generateImage = async (req, res, next) => {
  try {
    const { prompt, style = 'realistic' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    const result = await openaiService.generateImage(prompt, style);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Generate code
export const generateCode = async (req, res, next) => {
  try {
    const { description, language = 'javascript' } = req.body;

    logAIDebug('generate-code.request', {
      userId: req.user?.id || null,
      language,
      descriptionPreview: toPreviewText(description),
    });
    
    if (!description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Description is required' 
      });
    }

    const result = await openaiService.generateCode(description, language);

    logAIDebug('generate-code.response', {
      userId: req.user?.id || null,
      language,
      resultType: typeof result,
      resultPreview: toPreviewText(result),
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Generate NPC dialogue
export const generateDialogue = async (req, res, next) => {
  try {
    const { character, context } = req.body;
    
    if (!character || !context) {
      return res.status(400).json({ 
        success: false, 
        error: 'Character and context are required' 
      });
    }

    const result = await openaiService.generateDialogue(character, context);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const generateGameBuilder = async (req, res, next) => {
  try {
    const { prompt, options = {} } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const mode = options.mode === 'next-gen-3d' || options.nextGen3D === true ? 'next-gen-3d' : 'standard';
    const isNextGen3D = mode === 'next-gen-3d';
    const fastMode = options.fastMode !== false;
    const refine3D = options.refine3D === true && !fastMode;
    const includeAssets = options.includeAssets !== false;
    const includeAudio = options.includeAudio !== false && !(isNextGen3D && fastMode && options.includeAudio === undefined);
    const includeCode = options.includeCode !== false;
    const maxCharacters = clampInt(options.maxCharacters, 1, 4, 2);
    const maxEnvironments = clampInt(options.maxEnvironments, 1, 3, 1);
    const maxSfx = clampInt(options.maxSfx, 1, 5, 3);
    const max3DAssets = clampInt(options.max3DAssets, 1, 6, fastMode ? 2 : 3);

    const effectiveCharacterLimit = isNextGen3D && fastMode
      ? Math.min(maxCharacters, 2)
      : maxCharacters;
    const effectiveEnvironmentLimit = isNextGen3D && fastMode
      ? Math.min(maxEnvironments, 1)
      : maxEnvironments;

    const blueprint = await openaiService.generateGameBlueprint(prompt.trim(), {
      mode,
      camera: options.camera,
    });
    const generated = {
      assets: {
        characters: [],
        models3d: [],
        backgrounds: [],
        textures: []
      },
      audio: {
        music: null,
        sfx: []
      },
      code: null,
      warnings: []
    };

    const characters = Array.isArray(blueprint.characters) ? blueprint.characters : [];
    const environments = Array.isArray(blueprint.environments) ? blueprint.environments : [];

    if (includeAssets) {
      for (const character of characters.slice(0, effectiveCharacterLimit)) {
        if (isNextGen3D && generated.assets.models3d.length >= max3DAssets) break;
        try {
          if (isNextGen3D) {
            const modelPrompt = character.visualPrompt || `${character.name || 'Hero warrior'}, high-detail realistic 3D character, ${blueprint.artStyle || 'stylized realism'}, cinematic game quality`;
            const model3d = await meshyService.generateTextTo3D(modelPrompt, { refine: refine3D });
            generated.assets.models3d.push({
              type: 'character',
              name: character.name,
              role: character.role,
              ...model3d
            });
          } else {
            const promptForSprite = character.visualPrompt || `${character.name || 'Game character'}, ${blueprint.artStyle || 'pixel-art'} game character`;
            const spriteStyle = character.spriteStyle || 'pixel-art';
            const sprite = await replicateService.generateSprite(promptForSprite, spriteStyle);
            generated.assets.characters.push({
              name: character.name,
              role: character.role,
              ...sprite
            });
          }
        } catch (error) {
          generated.warnings.push(`Character asset failed for ${character.name || 'unknown'}: ${error.message}`);
        }
      }

      for (const environment of environments.slice(0, effectiveEnvironmentLimit)) {
        if (isNextGen3D) {
          if (generated.assets.models3d.length >= max3DAssets) break;
          try {
            const worldModelPrompt = environment.visualPrompt || `${environment.name || 'Mythic battleground'}, realistic 3D environment, high detail terrain, cinematic lighting`;
            const envModel3d = await meshyService.generateTextTo3D(worldModelPrompt, { refine: refine3D });
            generated.assets.models3d.push({
              type: 'environment',
              name: environment.name,
              ...envModel3d
            });
          } catch (error) {
            generated.warnings.push(`Environment model failed for ${environment.name || 'unknown'}: ${error.message}`);
          }
        }

        try {
          const bgPrompt = environment.visualPrompt || `${environment.name || 'game world'} background, ${blueprint.artStyle || 'stylized'}, game environment`;
          const background = await openaiService.generateImage(bgPrompt, blueprint.artStyle || 'realistic');
          generated.assets.backgrounds.push({
            name: environment.name,
            ...background
          });
        } catch (error) {
          generated.warnings.push(`Environment background failed for ${environment.name || 'unknown'}: ${error.message}`);
        }

        try {
          const texturePrompt = environment.texturePrompt || `${environment.name || 'environment'} seamless texture for game level`;
          const texture = await replicateService.generateTexture(texturePrompt, true);
          generated.assets.textures.push({
            name: environment.name,
            ...texture
          });
        } catch (error) {
          generated.warnings.push(`Environment texture failed for ${environment.name || 'unknown'}: ${error.message}`);
        }
      }
    }

    if (includeAudio) {
      try {
        const musicPrompt = blueprint.audio?.musicPrompt || `${blueprint.genre || 'adventure'} game soundtrack`;
        generated.audio.music = await elevenLabsService.generateMusic({
          prompt: musicPrompt,
          genre: blueprint.genre || 'epic',
          duration: 30,
          tempo: 'medium'
        });
      } catch (musicError) {
        generated.warnings.push(`Music generation fallback used: ${musicError.message}`);
        try {
          generated.audio.music = await openaiService.generateMusicTrack({
            prompt: blueprint.audio?.musicPrompt || `${blueprint.genre || 'adventure'} game soundtrack`,
            genre: blueprint.genre || 'epic',
            duration: 30,
            tempo: 'medium'
          });
        } catch (fallbackMusicError) {
          generated.warnings.push(`Music generation failed: ${fallbackMusicError.message}`);
        }
      }

      const sfxItems = Array.isArray(blueprint.audio?.sfx) ? blueprint.audio.sfx.slice(0, maxSfx) : [];
      for (const sfx of sfxItems) {
        try {
          const sound = await elevenLabsService.generateSFX({
            prompt: sfx.prompt || sfx.name || 'game sound effect',
            durationSeconds: 2.0
          });
          generated.audio.sfx.push({ name: sfx.name, ...sound });
        } catch (sfxError) {
          try {
            const fallbackSfx = await openaiService.generateSfxClip({
              prompt: sfx.prompt || sfx.name || 'game sound effect'
            });
            generated.audio.sfx.push({ name: sfx.name, ...fallbackSfx });
            generated.warnings.push(`SFX fallback used for ${sfx.name || 'unnamed'}: ${sfxError.message}`);
          } catch (fallbackSfxError) {
            generated.warnings.push(`SFX generation failed for ${sfx.name || 'unnamed'}: ${fallbackSfxError.message}`);
          }
        }
      }
    }

    if (includeCode) {
      try {
        const codePrompt = isNextGen3D
          ? `Create modern JavaScript/TypeScript-ready game architecture for a high-quality third-person 3D action RPG from this blueprint:\n${JSON.stringify(blueprint)}\n\nInclude:\n- character state machine (idle/run/dodge/light-attack/heavy-attack/parry/hit/death)\n- lock-on targeting system\n- dynamic camera rig (combat, exploration, cinematic transitions)\n- stamina/health/combo combat loop\n- enemy AI behavior tree scaffolding\n- boss multi-phase hooks\n- animation event hooks and VFX trigger stubs\n- clean modular files (camera, combat, abilities, AI, UI, scene bootstrap)\n\nReturn production-ready starter code.`
          : `Create starter JavaScript game code architecture from this blueprint:\n${JSON.stringify(blueprint)}\n\nInclude:\n- scene setup\n- player + enemy behavior scaffolding\n- game loop\n- collision/combat placeholder hooks\n- win/lose condition hooks\n\nReturn production-ready starter code.`;
        generated.code = await openaiService.generateCode(codePrompt, 'javascript');
      } catch (error) {
        generated.warnings.push(`Code generation failed: ${error.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        prompt,
        blueprint,
        generated,
        meta: {
          mode,
          fastMode,
          refine3D,
          includeAssets,
          includeAudio,
          includeCode,
          generatedCharacterAssets: generated.assets.characters.length,
          generated3DModels: generated.assets.models3d.length,
          generatedBackgroundAssets: generated.assets.backgrounds.length,
          generatedTextures: generated.assets.textures.length,
          generatedSfx: generated.audio.sfx.length,
          warnings: generated.warnings.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const generateVoice = async (req, res, next) => {
  try {
    const { text, voice = 'alloy', emotion = 'neutral' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = await openaiService.generateVoiceLine({ text, voice, emotion });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const generateMusic = async (req, res, next) => {
  try {
    const { prompt, genre = 'epic', duration = 30, tempo = 'medium' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    let result;
    // Primary: Replicate MusicGen (real music audio)
    try {
      result = await elevenLabsService.generateMusic({ prompt, genre, duration, tempo });
    } catch (musicGenError) {
      logger.warn('[AI][Music] MusicGen failed, falling back to OpenAI TTS', {
        error: musicGenError?.message || String(musicGenError),
      });
      result = await openaiService.generateMusicTrack({ prompt, genre, duration, tempo });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const generateSfx = async (req, res, next) => {
  try {
    const { prompt, durationSeconds = 2.0 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    let result;
    // Primary: ElevenLabs Sound Generation (real SFX .mp3)
    try {
      result = await elevenLabsService.generateSFX({ prompt, durationSeconds });
    } catch (sfxError) {
      logger.warn('[AI][SFX] ElevenLabs failed, falling back to OpenAI TTS', {
        error: sfxError?.message || String(sfxError),
      });
      result = await openaiService.generateSfxClip({ prompt });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Enhance prompt
export const enhancePrompt = async (req, res, next) => {
  try {
    const { prompt, type = 'image' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    const result = await openaiService.enhancePrompt(prompt, type);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Upscale image
export const upscaleImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image URL is required' 
      });
    }

    const result = await replicateService.upscaleImage(imageUrl);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Remove background
export const removeBackground = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image URL is required' 
      });
    }

    const result = await replicateService.removeBackground(imageUrl);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Generate texture
export const generateTexture = async (req, res, next) => {
  try {
    const { description, seamless = true } = req.body;
    
    if (!description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Description is required' 
      });
    }

    const result = await replicateService.generateTexture(description, seamless);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get AI service status
export const getAIStatus = async (req, res) => {
  const mockMode = process.env.MOCK_AI_MODE === 'true';

  res.json({
    success: true,
    data: {
      mockMode,
      services: {
        openai: {
          enabled: !!process.env.OPENAI_API_KEY && !mockMode,
          features: ['text-generation', 'image-generation', 'code-generation', 'voice-generation', 'prompt-enhancement'],
        },
        replicate: {
          enabled: !!process.env.REPLICATE_API_TOKEN && !mockMode,
          features: ['sprite-pixel-art-xl', 'sprite-sdxl', 'sprite-variation-img2img', '3d-preview-sdxl', 'upscaling-real-esrgan', 'background-removal-rembg', 'texture-sdxl', 'music-musicgen'],
        },
        meshy: {
          enabled: !!process.env.MESHY_API_KEY && !mockMode,
          features: ['text-to-3d-glb', 'text-to-3d-fbx', 'text-to-3d-obj', 'text-to-3d-usdz'],
        },
        elevenlabs: {
          enabled: !!process.env.ELEVENLABS_API_KEY && !mockMode,
          features: ['sfx-sound-generation'],
        },
      },
    },
  });
};

// Get suggested commands
export const getSuggestedCommands = async (req, res) => {
  res.json({
    success: true,
    data: {
      commands: [
        { text: 'Build a complete game from this prompt with characters, scenes, code, and assets', category: 'builder' },
        { text: 'Create a player character sprite', category: 'objects' },
        { text: 'Add a red castle in the center', category: 'objects' },
        { text: 'Generate a forest background', category: 'scenes' },
        { text: 'Create a coin pickup animation', category: 'animations' },
        { text: 'Add physics to the player', category: 'physics' },
        { text: 'Generate enemy AI behavior code', category: 'code' },
        { text: 'Create a health bar UI element', category: 'ui' },
        { text: 'Generate stone texture for walls', category: 'textures' }
      ]
    }
  });
};

export const getVoices = async (req, res) => {
  res.json({
    success: true,
    data: [
      'alloy',
      'ash',
      'coral',
      'echo',
      'sage',
      'verse'
    ]
  });
};
