import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import netcodeService from '../services/netcode.service.js';

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId || decoded.id;

      if (!socket.userId) {
        return next(new Error('Authentication error'));
      }
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId}`);

    // Join personal room
    socket.join(`user_${socket.userId}`);

    // Join alliance chat
    socket.on('join_alliance', (allianceId) => {
      socket.join(`alliance_${allianceId}`);
      logger.info(`User ${socket.userId} joined alliance chat ${allianceId}`);
    });

    // Leave alliance chat
    socket.on('leave_alliance', (allianceId) => {
      socket.leave(`alliance_${allianceId}`);
    });

    // Join global chat
    socket.on('join_global', () => {
      socket.join('global');
    });

    // Multiplayer room create/join/ready/input
    socket.on('room:create', ({ roomId, tickRateHz }) => {
      if (!roomId) return;
      const room = netcodeService.joinRoom(roomId, socket.userId, tickRateHz || 60);
      socket.join(`room_${roomId}`);
      io.to(`room_${roomId}`).emit('room:state', {
        roomId,
        tickRateHz: room.tickRateHz,
        players: Array.from(room.players.values()),
      });
    });

    socket.on('room:join', ({ roomId }) => {
      if (!roomId) return;
      const room = netcodeService.joinRoom(roomId, socket.userId, 60);
      socket.join(`room_${roomId}`);
      io.to(`room_${roomId}`).emit('room:state', {
        roomId,
        tickRateHz: room.tickRateHz,
        players: Array.from(room.players.values()),
      });
    });

    socket.on('room:ready', ({ roomId, ready }) => {
      if (!roomId) return;
      netcodeService.setReady(roomId, socket.userId, ready);
    });

    socket.on('room:input', ({ roomId, input }) => {
      if (!roomId || !input) return;
      netcodeService.pushInput(roomId, socket.userId, input);
    });

    // Real-time march updates
    socket.on('march_update', (data) => {
      // Broadcast to target player
      io.to(`user_${data.target_id}`).emit('incoming_attack', data);
    });

    // Resource updates
    socket.on('resource_update', (data) => {
      socket.emit('resources_updated', data);
    });

    socket.on('disconnect', () => {
      for (const room of netcodeService.rooms.keys()) {
        netcodeService.leaveRoom(room, socket.userId);
      }
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });

  netcodeService.start(io);

  return io;
};
