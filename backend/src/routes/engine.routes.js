import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import * as engineController from '../controllers/engine.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(aiLimiter);

router.post('/shader/compile', engineController.compileShader);
router.post('/procedural/map', engineController.generateProceduralMap);
router.post('/quests/generate', engineController.generateQuestline);
router.post('/npc/brain', engineController.generateNPCBrain);
router.get('/netcode/config', engineController.getNetcodeConfig);

export default router;
