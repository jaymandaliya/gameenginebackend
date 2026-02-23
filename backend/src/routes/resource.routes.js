import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as resourceController from '../controllers/resource.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', resourceController.getResources);
router.post('/add', resourceController.addResources);
router.post('/spend', resourceController.spendResources);

export default router;
