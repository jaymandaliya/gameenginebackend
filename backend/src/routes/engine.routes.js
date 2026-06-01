import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import * as engineController from '../controllers/engine.controller.js';
import * as exportController from '../controllers/export.controller.js';

const router = express.Router();

router.use(authenticate);

// ── Existing engine tools (AI-limited) ───────────────────────────────────────
router.use('/shader', aiLimiter);
router.use('/procedural', aiLimiter);
router.use('/quests', aiLimiter);
router.use('/npc', aiLimiter);

router.post('/shader/compile',     engineController.compileShader);
router.post('/procedural/map',     engineController.generateProceduralMap);
router.post('/quests/generate',    engineController.generateQuestline);
router.post('/npc/brain',          engineController.generateNPCBrain);
router.get('/netcode/config',      engineController.getNetcodeConfig);

// ── Export / Build pipeline ───────────────────────────────────────────────────
// POST /api/engine/export        — queue a new build job
// GET  /api/engine/export/:id    — get build status + download URL
// GET  /api/engine/export        — list all builds for the current user
// DELETE /api/engine/export/:id  — cancel / delete a build

router.post('/export',         exportController.createExport);
router.get('/export',          exportController.listExports);
router.get('/export/:buildId', exportController.getExportStatus);
router.delete('/export/:buildId', exportController.deleteExport);

export default router;
