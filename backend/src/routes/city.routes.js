import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as cityController from '../controllers/city.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/',                      cityController.getCity);
router.get('/map',                   cityController.getCitiesInArea);
router.get('/resources',             cityController.getCityResources);
router.post('/building/upgrade',     cityController.upgradeBuilding);
router.post('/building/collect',     cityController.collectBuildingUpgrade);
router.post('/building/speedup',     cityController.applySpeedup);

export default router;
