import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as researchController from '../controllers/research.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/',            researchController.getResearch);
router.post('/start',      researchController.startResearch);
router.post('/speedup',    researchController.speedupResearch);
router.post('/cancel',     researchController.cancelResearch);

export default router;
