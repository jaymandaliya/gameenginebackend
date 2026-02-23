import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as assetController from '../controllers/asset.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', assetController.getAssets);
router.post('/upload', assetController.uploadAsset);
router.delete('/:id', assetController.deleteAsset);

export default router;
