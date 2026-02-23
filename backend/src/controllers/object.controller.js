import GameObject from '../models/GameObject.model.js';
import Scene from '../models/Scene.model.js';
import logger from '../utils/logger.js';

const normalizeObjectResponse = (obj) => {
  const raw = obj.toObject ? obj.toObject() : obj;

  const fallbackTransform2d = {
    position: {
      x: raw.position?.x ?? 0,
      y: raw.position?.y ?? 0,
    },
    rotation: raw.rotation ?? 0,
    scale: {
      x: raw.scale?.x ?? 1,
      y: raw.scale?.y ?? 1,
    },
  };

  return {
    ...raw,
    id: raw._id || raw.id,
    transform2d: raw.transform2d || fallbackTransform2d,
  };
};

export const getObjects = async (req, res, next) => {
  try {
    const { sceneId } = req.query;
    const objects = await GameObject.find(sceneId ? { sceneId } : {});
    res.json({ success: true, data: objects.map(normalizeObjectResponse) });
  } catch (error) {
    next(error);
  }
};

export const createObject = async (req, res, next) => {
  try {
    const object = await GameObject.create(req.body);
    
    if (req.body.sceneId) {
      await Scene.findByIdAndUpdate(req.body.sceneId, {
        $push: { objects: object._id }
      });
    }
    
    logger.info(`GameObject created: ${object._id}`);
    res.status(201).json({ success: true, data: normalizeObjectResponse(object) });
  } catch (error) {
    next(error);
  }
};

export const updateObject = async (req, res, next) => {
  try {
    const object = await GameObject.findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body, updatedAt: new Date() } },
      { new: true }
    );
    
    if (!object) {
      return res.status(404).json({ success: false, error: 'Object not found' });
    }
    
    res.json({ success: true, data: normalizeObjectResponse(object) });
  } catch (error) {
    next(error);
  }
};

export const deleteObject = async (req, res, next) => {
  try {
    const object = await GameObject.findByIdAndDelete(req.params.id);
    
    if (!object) {
      return res.status(404).json({ success: false, error: 'Object not found' });
    }
    
    if (object.sceneId) {
      await Scene.findByIdAndUpdate(object.sceneId, {
        $pull: { objects: object._id }
      });
    }
    
    res.json({ success: true, message: 'Object deleted' });
  } catch (error) {
    next(error);
  }
};
