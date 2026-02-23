import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import * as projectController from '../controllers/project.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
