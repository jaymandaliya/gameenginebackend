import * as openaiService from '../services/openai.service.js';
import * as replicateService from '../services/replicate.service.js';
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

// Generate 3D model preview
export const generate3DModel = async (req, res, next) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Description is required' 
      });
    }

    let result;
    try {
      result = await replicateService.generate3DModelPreview(description);
    } catch (replicateError) {
      logger.warn('[AI][BACKEND] Replicate 3D preview failed, falling back to OpenAI image generation', {
        error: replicateError?.message || String(replicateError),
      });

      const fallbackImage = await openaiService.generateImage(
        `${description}, 3D render, isometric view, game asset, clean background`,
        'realistic',
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
    const { prompt, genre = 'epic', duration = 120, tempo = 'medium' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await openaiService.generateMusicTrack({ prompt, genre, duration, tempo });

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
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await openaiService.generateSfxClip({ prompt });

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
          features: ['text-generation', 'image-generation', 'code-generation']
        },
        replicate: {
          enabled: !!process.env.REPLICATE_API_TOKEN && !mockMode,
          features: ['sprite-generation', '3d-preview', 'upscaling', 'background-removal']
        }
      }
    }
  });
};

// Get suggested commands
export const getSuggestedCommands = async (req, res) => {
  res.json({
    success: true,
    data: {
      commands: [
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
