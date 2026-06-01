import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as tournamentController from '../controllers/tournament.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/:format',             tournamentController.getTournament);
router.get('/:format/rankings',    tournamentController.getRankings);
router.post('/:format/signup',     tournamentController.signUp);
router.post('/:format/battle',     tournamentController.battleOpponent);

export default router;
