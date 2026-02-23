import Script from '../models/Script.model.js';

export const getScripts = async (req, res, next) => {
  try {
    const { objectId, sceneId } = req.query;
    const filter = {};
    if (objectId) filter.objectId = objectId;
    if (sceneId) filter.sceneId = sceneId;

    const scripts = await Script.find(filter).sort({ updatedAt: -1 });
    return res.json({ success: true, data: scripts });
  } catch (error) {
    return next(error);
  }
};

export const createScript = async (req, res, next) => {
  try {
    const payload = {
      name: req.body.name || `Script ${Date.now()}`,
      objectId: req.body.objectId,
      sceneId: req.body.sceneId,
      nodes: req.body.nodes || [],
      connections: req.body.connections || [],
      variables: req.body.variables || {},
      updatedAt: new Date(),
    };

    const script = await Script.create(payload);
    return res.status(201).json({ success: true, data: script });
  } catch (error) {
    return next(error);
  }
};

export const updateScript = async (req, res, next) => {
  try {
    const script = await Script.findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body, updatedAt: new Date() } },
      { new: true }
    );

    if (!script) {
      return res.status(404).json({ success: false, error: 'Script not found' });
    }

    return res.json({ success: true, data: script });
  } catch (error) {
    return next(error);
  }
};

export const deleteScript = async (req, res, next) => {
  try {
    const deleted = await Script.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Script not found' });
    }

    return res.json({ success: true, message: 'Script deleted' });
  } catch (error) {
    return next(error);
  }
};
