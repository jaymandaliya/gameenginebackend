import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as capitalWarController from '../controllers/capitalwar.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/',               capitalWarController.getCapitalWar);
router.get('/leaderboard',    capitalWarController.getWarLeaderboard);
router.post('/declare',       capitalWarController.declareWar);
router.post('/march',         capitalWarController.marchToCapital);
router.post('/attack',        capitalWarController.attackCapital);

export default router;
