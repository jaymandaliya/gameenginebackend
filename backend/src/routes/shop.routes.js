import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as shopController from '../controllers/shop.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/personal',  shopController.getPersonalShop);
router.get('/alliance',  shopController.getAllianceShop);
router.get('/battle',    shopController.getBattleShop);
router.get('/premium',   shopController.getPremiumShop);
router.get('/hero',      shopController.getHeroShop);
router.post('/buy',      shopController.buyItem);

export default router;
