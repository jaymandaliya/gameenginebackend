import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as unitController from '../controllers/unit.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/',        unitController.getUnits);
router.get('/stats',   unitController.getUnitStats);
router.post('/train',  unitController.trainTroops);
router.post('/heal',   unitController.healTroops);

export default router;
