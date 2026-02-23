import OpenAI from 'openai';
import logger from '../utils/logger.js';

const getRuntimeAIConfig = () => {
  const key = process.env.OPENAI_API_KEY;
  const mockByEnv = process.env.MOCK_AI_MODE === 'true';
  const hasKey = Boolean(key && key.trim());
  const isMockMode = mockByEnv || !hasKey;
  const reason = mockByEnv ? 'MOCK_AI_MODE=true' : (!hasKey ? 'OPENAI_API_KEY missing' : 'live');

  return {
    key,
    hasKey,
    isMockMode,
    reason,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
};

const getOpenAIClient = () => {
  const cfg = getRuntimeAIConfig();
  if (!cfg.hasKey) return null;
  return new OpenAI({ apiKey: cfg.key });
};

const toDataUrlFromAudioResponse = async (audioResponse, mimeType = 'audio/mpeg') => {
  const arrayBuffer = await audioResponse.arrayBuffer();
  const base64Audio = Buffer.from(arrayBuffer).toString('base64');
  return `data:${mimeType};base64,${base64Audio}`;
};

const logMode = (feature) => {
  const cfg = getRuntimeAIConfig();
  logger.info(`[AI][SERVICE] ${feature} mode=${cfg.isMockMode ? 'mock' : 'live'} reason=${cfg.reason} model=${cfg.model}`);
  return cfg;
};

const ensureLiveAI = (cfg, featureLabel) => {
  if (cfg.isMockMode) {
    throw new Error(`AI mock mode is enabled (${cfg.reason}). ${featureLabel} requires a valid OPENAI_API_KEY.`);
  }
};

// Parse natural language commands to game actions
export const parseCommand = async (command) => {
  try {
    const cfg = logMode('parseCommand');
    ensureLiveAI(cfg, 'Command parsing');

    const openai = getOpenAIClient();
    if (!openai) throw new Error('OpenAI client unavailable');

    const response = await openai.chat.completions.create({
      model: cfg.model,
      messages: [
        {
          role: 'system',
          content: `You are a game engine AI assistant. Parse natural language commands into structured game actions.
          
Available actions:
- create_object: Create game objects (sprites, shapes, text)
- modify_object: Change object properties
- create_scene: Create new scenes
- add_physics: Add physics to objects
- create_animation: Create animations
- generate_code: Generate game logic code

Respond ONLY with valid JSON in this format:
{
  "action": "action_name",
  "parameters": {...},
  "confidence": 0.0-1.0
}`
        },
        {
          role: 'user',
          content: command
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    logger.info(`Command parsed: ${command} -> ${result.action}`);
    return result;
  } catch (error) {
    logger.error('OpenAI parse command error:', error.message);
    throw new Error('Failed to parse command');
  }
};

// Generate image from text prompt
export const generateImage = async (prompt, style = 'realistic') => {
  try {
    const cfg = logMode('generateImage');
    ensureLiveAI(cfg, 'Image generation');

    const openai = getOpenAIClient();
    if (!openai) throw new Error('OpenAI client unavailable');

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${prompt}. Style: ${style}. Game asset, clean background.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });

    logger.info(`Image generated: ${prompt}`);
    return {
      url: response.data[0].url,
      prompt,
      style,
      model: 'dall-e-3'
    };
  } catch (error) {
    logger.error('OpenAI image generation error:', error.message);
    throw new Error('Failed to generate image');
  }
};

// Generate game code
export const generateCode = async (description, language = 'javascript') => {
  try {
    const cfg = logMode('generateCode');
    ensureLiveAI(cfg, 'Code generation');

    const openai = getOpenAIClient();
    if (!openai) throw new Error('OpenAI client unavailable');

    const wantsJson = String(language).toLowerCase() === 'json';

    const response = await openai.chat.completions.create({
      model: cfg.model,
      messages: [
        {
          role: 'system',
          content: wantsJson
            ? 'You are an expert game designer. Return ONLY strict JSON that satisfies the user request. No markdown, no code fences, no commentary.'
            : `You are an expert game programmer. Generate clean, efficient ${language} code for game logic. Include comments and follow best practices.`
        },
        {
          role: 'user',
          content: description
        }
      ],
      temperature: wantsJson ? 0.2 : 0.7,
      ...(wantsJson ? { response_format: { type: 'json_object' } } : {})
    });

    const code = response.choices[0].message.content;
    logger.info(`Code generated for: ${description}`);
    return {
      code,
      language,
      explanation: wantsJson ? 'Generated JSON response based on description' : 'Generated code based on description'
    };
  } catch (error) {
    logger.error('OpenAI code generation error:', error.message);
    throw new Error('Failed to generate code');
  }
};

// Generate dialogue for NPCs
export const generateDialogue = async (character, context) => {
  try {
    const cfg = logMode('generateDialogue');
    ensureLiveAI(cfg, 'Dialogue generation');

    const openai = getOpenAIClient();
    if (!openai) throw new Error('OpenAI client unavailable');

    const response = await openai.chat.completions.create({
      model: cfg.model,
      messages: [
        {
          role: 'system',
          content: `You are writing dialogue for a game character.
          
Character: ${character.name}
Personality: ${character.personality || 'neutral'}
Role: ${character.role || 'NPC'}

Context: ${context}

Write natural, engaging dialogue that fits the character and context. Keep it concise (1-3 sentences).`
        },
        {
          role: 'user',
          content: 'Generate dialogue for this situation'
        }
      ],
      temperature: 0.8,
      max_tokens: 150
    });

    const dialogue = response.choices[0].message.content;
    logger.info(`Dialogue generated for: ${character.name}`);
    return {
      dialogue,
      emotion: 'neutral',
      character: character.name
    };
  } catch (error) {
    logger.error('OpenAI dialogue generation error:', error.message);
    throw new Error('Failed to generate dialogue');
  }
};

// Enhance user prompt for better AI generation
export const enhancePrompt = async (userPrompt, type = 'image') => {
  try {
    const cfg = logMode('enhancePrompt');
    ensureLiveAI(cfg, 'Prompt enhancement');

    const openai = getOpenAIClient();
    if (!openai) throw new Error('OpenAI client unavailable');

    const response = await openai.chat.completions.create({
      model: cfg.model,
      messages: [
        {
          role: 'system',
          content: `Enhance prompts for ${type} generation. Make them more specific, detailed, and effective.
Add relevant style keywords, technical details, and quality modifiers.
Respond with JSON: {"enhanced": "enhanced prompt", "improvements": ["list", "of", "improvements"]}`
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      original: userPrompt,
      enhanced: result.enhanced,
      improvements: result.improvements
    };
  } catch (error) {
    logger.error('Prompt enhancement error:', error.message);
    throw new Error('Failed to enhance prompt');
  }
};

export const generateVoiceLine = async ({ text, voice = 'alloy', emotion = 'neutral' }) => {
  try {
    const cfg = logMode('generateVoiceLine');
    ensureLiveAI(cfg, 'Voice generation');

    const openai = getOpenAIClient();
    if (!openai) throw new Error('OpenAI client unavailable');

    const speech = await openai.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      voice,
      input: `[${emotion}] ${text}`,
      format: 'mp3',
    });

    return {
      audioUrl: await toDataUrlFromAudioResponse(speech),
      voice,
      emotion,
      text,
      format: 'mp3',
    };
  } catch (error) {
    logger.error('OpenAI voice generation error:', error.message);
    throw new Error(error.message || 'Failed to generate voice line');
  }
};

export const generateMusicTrack = async ({ prompt, genre = 'epic', duration = 120, tempo = 'medium' }) => {
  try {
    const cfg = logMode('generateMusicTrack');
    ensureLiveAI(cfg, 'Music generation');

    const openai = getOpenAIClient();
    if (!openai) throw new Error('OpenAI client unavailable');

    const musicInstruction = `Create an instrumental game music loop. Genre: ${genre}. Tempo: ${tempo}. Target duration: ${duration} seconds. Mood prompt: ${prompt}. No spoken words.`;
    const speech = await openai.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      voice: 'alloy',
      input: musicInstruction,
      format: 'mp3',
    });

    return {
      audioUrl: await toDataUrlFromAudioResponse(speech),
      prompt,
      genre,
      tempo,
      duration,
      format: 'mp3',
      name: `${genre} track`,
    };
  } catch (error) {
    logger.error('OpenAI music generation error:', error.message);
    throw new Error(error.message || 'Failed to generate music track');
  }
};

export const generateSfxClip = async ({ prompt }) => {
  try {
    const cfg = logMode('generateSfxClip');
    ensureLiveAI(cfg, 'SFX generation');

    const openai = getOpenAIClient();
    if (!openai) throw new Error('OpenAI client unavailable');

    const speech = await openai.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      voice: 'echo',
      input: `Generate a short game sound effect: ${prompt}. Keep it concise and impactful.`,
      format: 'mp3',
    });

    return {
      audioUrl: await toDataUrlFromAudioResponse(speech),
      prompt,
      format: 'mp3',
      name: 'AI SFX',
    };
  } catch (error) {
    logger.error('OpenAI SFX generation error:', error.message);
    throw new Error(error.message || 'Failed to generate sound effect');
  }
};

export default {
  parseCommand,
  generateImage,
  generateCode,
  generateDialogue,
  enhancePrompt,
  generateVoiceLine,
  generateMusicTrack,
  generateSfxClip
};
