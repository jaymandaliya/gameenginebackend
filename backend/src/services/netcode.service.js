class NetcodeService {
  constructor() {
    this.rooms = new Map();
    this.tickHandle = null;
  }

  ensureRoom(roomId, tickRateHz = 60) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        tickRateHz,
        frame: 0,
        players: new Map(),
        inputs: new Map(),
        snapshots: [],
      });
    }
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, playerId, tickRateHz = 60) {
    const room = this.ensureRoom(roomId, tickRateHz);
    room.players.set(playerId, {
      id: playerId,
      joinedAt: Date.now(),
      ready: false,
    });
    return room;
  }

  leaveRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players.delete(playerId);
    room.inputs.delete(playerId);

    if (room.players.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  setReady(roomId, playerId, ready) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player) return;
    player.ready = Boolean(ready);
  }

  pushInput(roomId, playerId, input) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.inputs.set(playerId, {
      ...input,
      ts: Date.now(),
    });
  }

  start(io) {
    if (this.tickHandle) return;

    this.tickHandle = setInterval(() => {
      for (const room of this.rooms.values()) {
        room.frame += 1;

        const snapshot = {
          frame: room.frame,
          timestamp: Date.now(),
          players: Array.from(room.players.values()).map(p => ({
            id: p.id,
            ready: p.ready,
          })),
          inputs: Object.fromEntries(room.inputs),
        };

        room.snapshots.push(snapshot);
        if (room.snapshots.length > 240) {
          room.snapshots.shift();
        }

        io.to(`room_${room.id}`).emit('room:tick', {
          frame: room.frame,
          serverTime: snapshot.timestamp,
          state: snapshot,
          authoritative: true,
        });
      }
    }, 1000 / 60);
  }
}

export default new NetcodeService();
