import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as scriptController from '../controllers/script.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', scriptController.getScripts);
router.post('/', scriptController.createScript);
router.put('/:id', scriptController.updateScript);
router.delete('/:id', scriptController.deleteScript);

export default router;
