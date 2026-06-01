// ElevenLabs Service - Real SFX generation + Music via Replicate MusicGen
// SFX API: https://elevenlabs.io/docs/api-reference/sound-generation
// Get your key: https://elevenlabs.io/app/settings/api-keys - set ELEVENLABS_API_KEY in .env
// MusicGen runs on Replicate: meta/musicgen - set REPLICATE_API_TOKEN in .env

import axios from 'axios';
import Replicate from 'replicate';
import logger from '../utils/logger.js';

// ─── ElevenLabs client ────────────────────────────────────────────────────────
const getElevenLabsClient = () => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return null;
  return axios.create({
    baseURL: 'https://api.elevenlabs.io/v1',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
    },
    timeout: 60000,
    responseType: 'arraybuffer', // audio bytes back
  });
};

// ─── Replicate client (for MusicGen) ─────────────────────────────────────────
const getReplicateClient = () => {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;
  return new Replicate({ auth: token });
};

const isSFXMock = () =>
  process.env.MOCK_AI_MODE === 'true' || !process.env.ELEVENLABS_API_KEY;

const isMusicMock = () =>
  process.env.MOCK_AI_MODE === 'true' || !process.env.REPLICATE_API_TOKEN;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const bufferToBase64DataUrl = (buffer, mimeType = 'audio/mpeg') => {
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${base64}`;
};

// ─── SFX Generation (ElevenLabs Sound Generation) ────────────────────────────
export const generateSFX = async ({ prompt, durationSeconds = 2.0 }) => {
  if (isSFXMock()) {
    logger.warn('[ElevenLabs] Mock mode – returning placeholder. Set ELEVENLABS_API_KEY for real SFX.');
    return {
      audioUrl: '',
      prompt,
      durationSeconds,
      format: 'mp3',
      name: prompt.slice(0, 40),
      provider: 'elevenlabs-mock',
    };
  }

  const client = getElevenLabsClient();
  if (!client) throw new Error('ElevenLabs client unavailable – ELEVENLABS_API_KEY not set');

  try {
    logger.info(`[ElevenLabs] Generating SFX: "${prompt}"`);

    const response = await client.post('/sound-generation', {
      text: prompt,
      duration_seconds: Math.min(durationSeconds, 22), // ElevenLabs max is 22s
      prompt_influence: 0.3,
    });

    const audioUrl = bufferToBase64DataUrl(response.data, 'audio/mpeg');

    logger.info('[ElevenLabs] SFX generated successfully');

    return {
      audioUrl,
      prompt,
      durationSeconds,
      format: 'mp3',
      name: prompt.slice(0, 40),
      provider: 'elevenlabs',
    };
  } catch (error) {
    const msg = error?.response?.data
      ? Buffer.from(error.response.data).toString()
      : error.message;
    logger.error(`[ElevenLabs] SFX error: ${msg}`);
    throw new Error(`ElevenLabs SFX failed: ${msg}`);
  }
};

// ─── Music Generation (Replicate meta/musicgen) ───────────────────────────────
// Model: https://replicate.com/meta/musicgen
export const generateMusic = async ({ prompt, genre = 'epic', duration = 30, tempo = 'medium' }) => {
  const fullPrompt = `${genre} game music, ${tempo} tempo, ${prompt}, no vocals, loop-friendly`;

  if (isMusicMock()) {
    logger.warn('[MusicGen] Mock mode – returning placeholder. Set REPLICATE_API_TOKEN for real music.');
    return {
      audioUrl: '',
      prompt: fullPrompt,
      genre,
      tempo,
      duration,
      format: 'mp3',
      name: `${genre} track`,
      provider: 'musicgen-mock',
    };
  }

  const replicate = getReplicateClient();
  if (!replicate) throw new Error('Replicate client unavailable – REPLICATE_API_TOKEN not set');

  try {
    logger.info(`[MusicGen] Generating music: "${fullPrompt}" duration=${duration}s`);

    const output = await replicate.run(
      'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb',
      {
        input: {
          prompt: fullPrompt,
          model_version: 'stereo-large',
          duration: Math.min(duration, 30), // free tier max 30s
          temperature: 1,
          top_k: 250,
          top_p: 0,
          classifier_free_guidance: 3,
          output_format: 'mp3',
        },
      },
    );

    // output is a URL to the mp3
    const audioUrl = Array.isArray(output) ? output[0] : output;

    logger.info(`[MusicGen] Music generated: ${audioUrl}`);

    return {
      audioUrl: audioUrl || '',
      prompt: fullPrompt,
      genre,
      tempo,
      duration,
      format: 'mp3',
      name: `${genre} track`,
      provider: 'musicgen-replicate',
    };
  } catch (error) {
    logger.error(`[MusicGen] Error: ${error.message}`);
    throw new Error(`MusicGen failed: ${error.message}`);
  }
};

export default { generateSFX, generateMusic };
