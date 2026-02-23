import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

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
      socket.userId = decoded.userId;
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
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};
