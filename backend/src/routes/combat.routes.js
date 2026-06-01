import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as combatController from '../controllers/combat.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/attack',      combatController.attackPlayer);
router.post('/defend',      combatController.setDefense);
router.get('/reports',      combatController.getCombatReports);
router.get('/active',       combatController.getActiveMarches);
router.post('/march',       combatController.marchTroops);
router.post('/recall',      combatController.recallTroops);
router.get('/formations',   combatController.getFormations);
router.post('/duel',        combatController.startHeroDuel);
router.post('/scout',       combatController.scoutEnemy);
router.get('/history',      combatController.getCombatHistory);

export default router;
