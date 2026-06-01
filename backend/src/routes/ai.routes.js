import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import * as aiController from '../controllers/ai.controller.js';

const router = express.Router();

// Public routes
router.get('/status', aiController.getAIStatus);
router.get('/suggested-commands', aiController.getSuggestedCommands);
router.get('/voices', aiController.getVoices);

// Protected routes with AI rate limiting
router.use(authenticate);
router.use(aiLimiter);

// Text AI
router.post('/parse-command', aiController.parseCommand);
router.post('/generate-game-builder', aiController.generateGameBuilder);
router.post('/generate-code', aiController.generateCode);
router.post('/generate-dialogue', aiController.generateDialogue);
router.post('/generate-voice', aiController.generateVoice);
router.post('/generate-music', aiController.generateMusic);
router.post('/generate-sfx', aiController.generateSfx);
router.post('/enhance-prompt', aiController.enhancePrompt);

// Image AI
router.post('/generate-sprite', aiController.generateSprite);
router.post('/generate-3d-model', aiController.generate3DModel);
router.post('/generate-image', aiController.generateImage);
router.post('/generate-texture', aiController.generateTexture);
router.post('/upscale-image', aiController.upscaleImage);
router.post('/remove-background', aiController.removeBackground);

export default router;
