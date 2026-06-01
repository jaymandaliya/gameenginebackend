import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as godotController from '../controllers/godot.controller.js';

const router = express.Router();

// Engine info is public (no auth needed — used on login screen to show capabilities)
router.get('/engine/info', godotController.getEngineInfo);

// Asset library routes require auth
router.use(authenticate);
router.get('/assets',      godotController.searchAssets);
router.get('/assets/:id',  godotController.getAsset);
router.get('/categories',  godotController.getCategories);
router.get('/collections', godotController.getCuratedCollections);

export default router;
