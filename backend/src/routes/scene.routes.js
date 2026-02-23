import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as sceneController from '../controllers/scene.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', sceneController.getScenes);
router.post('/', sceneController.createScene);
router.get('/:id', sceneController.getScene);
router.put('/:id', sceneController.updateScene);
router.delete('/:id', sceneController.deleteScene);

export default router;
