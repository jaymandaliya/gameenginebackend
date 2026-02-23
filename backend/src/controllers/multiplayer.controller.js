import MultiplayerSession from '../models/MultiplayerSession.model.js';

const toSession = (session) => ({
  id: session.id,
  hostId: session.hostId,
  hostName: session.hostName,
  gameMode: session.gameMode || session.gameType,
  gameType: session.gameMode || session.gameType,
  maxPlayers: session.maxPlayers,
  players: session.players,
  status: session.status,
  createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : session.createdAt,
  updatedAt: session.updatedAt instanceof Date ? session.updatedAt.toISOString() : session.updatedAt,
});

export const getSessions = async (req, res) => {
  try {
    const sessions = await MultiplayerSession.find({}).sort({ createdAt: -1 }).lean();
    const data = sessions.map(toSession);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
};

export const createSession = async (req, res) => {
  try {
    const hostId = String(req.body.hostId || req.user.id);
    const gameMode = req.body.gameMode || req.body.gameType || 'pvp';
    const hostName = req.body.hostName || req.user.username || req.user.email || 'Host';

    const session = await MultiplayerSession.create({
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      hostId,
      hostName,
      gameMode,
      maxPlayers: 4,
      players: [
        {
          playerId: hostId,
          id: hostId,
          username: hostName,
          ready: false,
          connected: true,
          ping: 20,
        },
      ],
      status: 'waiting',
    });

    res.status(201).json({ success: true, data: toSession(session) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
};

export const joinSession = async (req, res) => {
  try {
    const session = await MultiplayerSession.findOne({ id: req.params.id });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const playerId = String(req.body.playerId || req.user.id);
    const username = req.body.username || req.user.username || req.user.email || 'Player';

    const already = session.players.some((p) => p.playerId === playerId || p.id === playerId);
    if (!already) {
      if (session.players.length >= session.maxPlayers) {
        return res.status(400).json({ success: false, error: 'Session is full' });
      }

      session.players.push({
        playerId,
        id: playerId,
        username,
        ready: false,
        connected: true,
        ping: Math.floor(Math.random() * 60) + 20,
      });

      await session.save();
    }

    res.json({ success: true, data: toSession(session) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to join session' });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const session = await MultiplayerSession.findOne({ id: req.params.id });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (String(session.hostId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only host can delete session' });
    }

    await MultiplayerSession.deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete session' });
  }
};
