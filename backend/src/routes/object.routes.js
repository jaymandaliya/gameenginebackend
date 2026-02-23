import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as objectController from '../controllers/object.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', objectController.getObjects);
router.post('/', objectController.createObject);
router.put('/:id', objectController.updateObject);
router.delete('/:id', objectController.deleteObject);

export default router;
