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

const logMode = (feature) => {
  const cfg = getRuntimeAIConfig();
  logger.info(`[AI][SERVICE] ${feature} mode=${cfg.isMockMode ? 'mock' : 'live'} reason=${cfg.reason} model=${cfg.model}`);
  return cfg;
};

// Parse natural language commands to game actions
export const parseCommand = async (command) => {
  try {
    const cfg = logMode('parseCommand');

    if (cfg.isMockMode) {
      return {
        action: 'create_object',
        parameters: {
          type: 'sprite',
          name: 'Player',
          position: { x: 100, y: 100 }
        },
        confidence: 0.95
      };
    }

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

    if (cfg.isMockMode) {
      return {
        url: `https://placehold.co/1024x1024/png?text=${encodeURIComponent(prompt)}`,
        prompt,
        style,
        model: 'mock'
      };
    }

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

    if (cfg.isMockMode) {
      return {
        code: `// ${description}\nfunction gameLogic() {\n  console.log('Mock code generated');\n}`,
        language,
        explanation: 'This is mock generated code'
      };
    }

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

    if (cfg.isMockMode) {
      return {
        dialogue: `Hello traveler! I am ${character.name}. Welcome to our realm!`,
        emotion: 'friendly',
        character: character.name
      };
    }

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

    if (cfg.isMockMode) {
      return {
        original: userPrompt,
        enhanced: `${userPrompt}, high quality, detailed, professional game asset`,
        improvements: ['Added quality modifiers', 'Made more specific']
      };
    }

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

export default {
  parseCommand,
  generateImage,
  generateCode,
  generateDialogue,
  enhancePrompt
};
