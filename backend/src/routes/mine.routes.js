import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as mineController from '../controllers/mine.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/',                   mineController.getMines);
router.post('/:id/occupy',        mineController.occupyMine);
router.post('/:id/attack',        mineController.attackMineGuards);
router.post('/:id/harvest',       mineController.harvestMine);
router.post('/:id/vacate',        mineController.vacateMine);

export default router;
