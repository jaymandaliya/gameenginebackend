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
