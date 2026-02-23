let resources = { gold: 1000, wood: 500, food: 750, iron: 200, gems: 50 };

export const getResources = async (req, res) => {
  res.json({ success: true, data: resources });
};

export const addResources = async (req, res) => {
  Object.keys(req.body).forEach(key => {
    if (resources[key] !== undefined) {
      resources[key] += req.body[key] || 0;
    }
  });
  res.json({ success: true, data: resources });
};

export const spendResources = async (req, res) => {
  const hasEnough = Object.keys(req.body).every(key => 
    resources[key] >= (req.body[key] || 0)
  );
  
  if (!hasEnough) {
    return res.status(400).json({ success: false, error: 'Insufficient resources' });
  }
  
  Object.keys(req.body).forEach(key => {
    if (resources[key] !== undefined) {
      resources[key] -= req.body[key] || 0;
    }
  });
  
  res.json({ success: true, data: resources });
};
