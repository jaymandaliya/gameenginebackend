const mockAssets = [
  { id: 'asset_1', name: 'Hero', category: 'characters', url: '/assets/hero.png' },
  { id: 'asset_2', name: 'Castle', category: 'buildings', url: '/assets/castle.png' },
  { id: 'asset_3', name: 'Coin', category: 'items', url: '/assets/coin.png' }
];

export const getAssets = async (req, res) => {
  const { category } = req.query;
  const filtered = category ? mockAssets.filter(a => a.category === category) : mockAssets;
  res.json({ success: true, data: filtered });
};

export const uploadAsset = async (req, res) => {
  const asset = { id: `asset_${Date.now()}`, ...req.body };
  mockAssets.push(asset);
  res.json({ success: true, data: asset });
};

export const deleteAsset = async (req, res) => {
  const index = mockAssets.findIndex(a => a.id === req.params.id);
  if (index > -1) mockAssets.splice(index, 1);
  res.json({ success: true });
};
