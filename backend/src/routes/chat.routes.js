import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as chatController from '../controllers/chat.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/message', chatController.sendMessage);
router.get('/messages', chatController.getMessages);
router.delete('/message/:id', chatController.deleteMessage);
router.post('/message/:id/report', chatController.reportMessage);
router.get('/channels', chatController.getChannels);
router.post('/mute', chatController.muteUser);

export default router;
