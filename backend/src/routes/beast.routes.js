import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as beastController from '../controllers/beast.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/',           beastController.getBeasts);
router.get('/data',       beastController.getBeastData);
router.post('/:id/raid',  beastController.raidBeast);

export default router;
