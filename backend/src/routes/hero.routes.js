import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as heroController from '../controllers/hero.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/',               heroController.getHeroes);
router.get('/templates',      heroController.getTemplates);
router.post('/shards/add',    heroController.addShards);
router.post('/levelup',       heroController.levelUpHero);
router.post('/starup',        heroController.starUp);
router.post('/equip',         heroController.equipItem);

export default router;
