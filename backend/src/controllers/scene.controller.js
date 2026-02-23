import Scene from '../models/Scene.model.js';
import Project from '../models/Project.model.js';
import logger from '../utils/logger.js';

export const getScenes = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'projectId query parameter is required' 
      });
    }
    
    // Verify project ownership
    const project = await Project.findOne({ _id: projectId, userId: req.user.id });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const scenes = await Scene.find({ projectId })
      .populate('objects')
      .sort({ createdAt: 1 });
    
    res.json({ success: true, data: scenes });
  } catch (error) {
    next(error);
  }
};

export const getScene = async (req, res, next) => {
  try {
    const scene = await Scene.findById(req.params.id).populate('objects');
    
    if (!scene) {
      return res.status(404).json({ success: false, error: 'Scene not found' });
    }
    
    res.json({ success: true, data: scene });
  } catch (error) {
    next(error);
  }
};

export const createScene = async (req, res, next) => {
  try {
    const { projectId, name, mode, backgroundColor } = req.body;
    
    // Verify project ownership
    const project = await Project.findOne({ _id: projectId, userId: req.user.id });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const scene = await Scene.create({
      name: name || `Scene ${Date.now()}`,
      projectId,
      mode: mode || project.mode,
      backgroundColor: backgroundColor || project.settings?.backgroundColor
    });
    
    // Update project scene count
    await Project.findByIdAndUpdate(projectId, { 
      $inc: { sceneCount: 1 },
      updatedAt: new Date()
    });
    
    logger.info(`Scene created: ${scene._id} for project: ${projectId}`);
    res.status(201).json({ success: true, data: scene });
  } catch (error) {
    next(error);
  }
};

export const updateScene = async (req, res, next) => {
  try {
    const scene = await Scene.findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body, updatedAt: new Date() } },
      { new: true }
    ).populate('objects');
    
    if (!scene) {
      return res.status(404).json({ success: false, error: 'Scene not found' });
    }
    
    res.json({ success: true, data: scene });
  } catch (error) {
    next(error);
  }
};

export const deleteScene = async (req, res, next) => {
  try {
    const scene = await Scene.findByIdAndDelete(req.params.id);
    
    if (!scene) {
      return res.status(404).json({ success: false, error: 'Scene not found' });
    }
    
    // Update project scene count
    await Project.findByIdAndUpdate(scene.projectId, { 
      $inc: { sceneCount: -1 },
      updatedAt: new Date()
    });
    
    res.json({ success: true, message: 'Scene deleted' });
  } catch (error) {
    next(error);
  }
};
