import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as navalController from '../controllers/naval.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/',           navalController.getFleet);
router.get('/stats',      navalController.getShipStats);
router.post('/build',     navalController.buildShips);
router.post('/trade',     navalController.sendTradeRoute);

export default router;
