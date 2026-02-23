import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as prefabController from '../controllers/prefab.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', prefabController.getPrefabs);
router.get('/:id', prefabController.getPrefab);
router.post('/', prefabController.createPrefab);
router.delete('/:id', prefabController.deletePrefab);

export default router;
