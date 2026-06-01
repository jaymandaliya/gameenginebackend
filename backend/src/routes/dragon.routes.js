import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as dragonController from '../controllers/dragon.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/',         dragonController.getDragons);
router.post('/hatch',   dragonController.hatchDragon);
router.post('/levelup', dragonController.levelUpDragon);
router.post('/deploy',  dragonController.deployDragon);
router.post('/recall',  dragonController.recallDragon);
router.post('/heal',    dragonController.healDragon);
router.post('/revive',  dragonController.reviveDragon);

export default router;
