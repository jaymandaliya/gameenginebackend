import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as magicController from '../controllers/magic.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/factions',   magicController.getFactions);
router.post('/faction',   magicController.chooseFaction);
router.get('/spells',     magicController.getSpells);
router.post('/cast',      magicController.castSpell);
router.get('/active',     magicController.getActiveSpells);

export default router;
