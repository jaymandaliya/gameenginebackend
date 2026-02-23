import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as multiplayerController from '../controllers/multiplayer.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', multiplayerController.getSessions);
router.post('/', multiplayerController.createSession);
router.post('/:id/join', multiplayerController.joinSession);
router.delete('/:id', multiplayerController.deleteSession);

export default router;
