import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as allianceController from '../controllers/alliance.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', allianceController.getAlliances);
router.post('/create', allianceController.createAlliance);
router.get('/:id', allianceController.getAllianceDetails);
router.post('/:id/join', allianceController.joinAlliance);
router.post('/:id/leave', allianceController.leaveAlliance);
router.put('/:id', allianceController.updateAlliance);
router.post('/:id/buffs', allianceController.purchaseBuffs);
router.get('/:id/members', allianceController.getAllianceMembers);

export default router;
