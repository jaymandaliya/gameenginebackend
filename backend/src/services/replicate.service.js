import Replicate from 'replicate';
import logger from '../utils/logger.js';

const replicate = process.env.REPLICATE_API_TOKEN ? new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
}) : null;

const isMockMode = process.env.MOCK_AI_MODE === 'true' || !process.env.REPLICATE_API_TOKEN;

const toErrorDetails = (error) => {
  if (!error) return 'unknown error';
  if (typeof error === 'string') return error;
  const message = error.message || error.toString?.() || 'unknown error';
  let details = '';
  if (error.response?.data) {
    try {
      details = JSON.stringify(error.response.data);
    } catch {
      details = String(error.response.data);
    }
  }
  return details ? `${message} | response=${details}` : message;
};

// Generate sprite using Stable Diffusion
export const generateSprite = async (prompt, style = 'pixel-art') => {
  try {
    if (isMockMode) {
      throw new Error('Replicate is not configured. Set REPLICATE_API_TOKEN for real sprite generation.');
    }

    const output = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        input: {
          prompt: `${prompt}, ${style}, game sprite, transparent background, clean design, high quality`,
          negative_prompt: 'blurry, low quality, watermark, text, signature',
          width: 512,
          height: 512,
          num_outputs: 1
        }
      }
    );

    logger.info(`Sprite generated: ${prompt}`);
    return {
      url: output[0],
      prompt,
      style,
      model: 'sdxl'
    };
  } catch (error) {
    logger.error(`Replicate sprite generation error: ${toErrorDetails(error)}`);
    throw new Error('Failed to generate sprite');
  }
};

// Generate 3D model preview
export const generate3DModelPreview = async (description) => {
  try {
    if (isMockMode) {
      throw new Error('Replicate is not configured. Set REPLICATE_API_TOKEN for real 3D preview generation.');
    }

    const output = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        input: {
          prompt: `${description}, 3D render, isometric view, game asset, clean background, professional`,
          negative_prompt: 'blurry, low quality, 2D, flat',
          width: 1024,
          height: 1024,
          num_outputs: 1
        }
      }
    );

    logger.info(`3D preview generated: ${description}`);
    return {
      url: output[0],
      description,
      model: 'sdxl-3d'
    };
  } catch (error) {
    logger.error(`Replicate 3D generation error: ${toErrorDetails(error)}`);
    throw new Error('Failed to generate 3D preview');
  }
};

// Upscale image for better quality
export const upscaleImage = async (imageUrl) => {
  try {
    if (isMockMode) {
      throw new Error('Replicate is not configured. Set REPLICATE_API_TOKEN for real image upscaling.');
    }

    const output = await replicate.run(
      'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
      {
        input: {
          image: imageUrl,
          scale: 2,
          face_enhance: false
        }
      }
    );

    logger.info(`Image upscaled: ${imageUrl}`);
    return {
      url: output,
      scale: 2,
      model: 'real-esrgan'
    };
  } catch (error) {
    logger.error(`Replicate upscale error: ${toErrorDetails(error)}`);
    throw new Error('Failed to upscale image');
  }
};

// Remove background from image
export const removeBackground = async (imageUrl) => {
  try {
    if (isMockMode) {
      throw new Error('Replicate is not configured. Set REPLICATE_API_TOKEN for real background removal.');
    }

    const output = await replicate.run(
      'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
      {
        input: {
          image: imageUrl
        }
      }
    );

    logger.info(`Background removed: ${imageUrl}`);
    return {
      url: output,
      model: 'rembg'
    };
  } catch (error) {
    logger.error(`Replicate background removal error: ${toErrorDetails(error)}`);
    throw new Error('Failed to remove background');
  }
};

// Generate texture
export const generateTexture = async (description, seamless = true) => {
  try {
    if (isMockMode) {
      throw new Error('Replicate is not configured. Set REPLICATE_API_TOKEN for real texture generation.');
    }

    const seamlessPrompt = seamless ? ', seamless tileable pattern' : '';
    const output = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        input: {
          prompt: `${description}${seamlessPrompt}, texture, game asset, high detail`,
          negative_prompt: 'objects, people, text, watermark',
          width: 512,
          height: 512,
          num_outputs: 1
        }
      }
    );

    logger.info(`Texture generated: ${description}`);
    return {
      url: output[0],
      description,
      seamless,
      model: 'sdxl'
    };
  } catch (error) {
    logger.error(`Replicate texture generation error: ${toErrorDetails(error)}`);
    throw new Error('Failed to generate texture');
  }
};

export default {
  generateSprite,
  generate3DModelPreview,
  upscaleImage,
  removeBackground,
  generateTexture
};
