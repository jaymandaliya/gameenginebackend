import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as eventController from '../controllers/event.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', eventController.getEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/active', eventController.getActiveEvents);
router.get('/:id', eventController.getEventDetails);
router.post('/:id/join', eventController.joinEvent);
router.get('/:id/rankings', eventController.getEventRankings);
router.post('/:id/claim', eventController.claimRewards);
router.post('/:id/score', eventController.submitScore);
router.get('/capital-war/status', eventController.getCapitalWar);
router.get('/server-war/status', eventController.getServerWar);

// Admin
router.post('/create', eventController.createEvent);

export default router;
