const prefabs = [
  { id: 'prefab_1', name: 'Castle', type: 'building', icon: '🏰', cost: { gold: 500 } },
  { id: 'prefab_2', name: 'Dragon', type: 'creature', icon: '🐉', cost: { gold: 1000 } },
  { id: 'prefab_3', name: 'Tree', type: 'nature', icon: '🌳', cost: { gold: 50 } }
];

export const getPrefabs = async (req, res) => {
  res.json({ success: true, data: prefabs });
};

export const getPrefab = async (req, res) => {
  const prefab = prefabs.find(p => p.id === req.params.id);
  if (!prefab) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: prefab });
};

export const createPrefab = async (req, res) => {
  const newPrefab = {
    id: `prefab_${Date.now()}`,
    name: req.body.name || 'New Prefab',
    type: req.body.type || 'custom',
    icon: req.body.icon || '📦',
    description: req.body.description || '',
    cost: req.body.cost || { gold: 0 },
    createdAt: new Date().toISOString(),
  };

  prefabs.push(newPrefab);
  res.status(201).json({ success: true, data: newPrefab });
};

export const deletePrefab = async (req, res) => {
  const index = prefabs.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  prefabs.splice(index, 1);
  return res.json({ success: true, message: 'Prefab deleted' });
};
