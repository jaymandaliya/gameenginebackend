import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './config/database.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initializeSocket } from './sockets/game.socket.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import sceneRoutes from './routes/scene.routes.js';
import objectRoutes from './routes/object.routes.js';
import assetRoutes from './routes/asset.routes.js';
import prefabRoutes from './routes/prefab.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import aiRoutes from './routes/ai.routes.js';
import allianceRoutes from './routes/alliance.routes.js';
import combatRoutes from './routes/combat.routes.js';
import chatRoutes from './routes/chat.routes.js';
import eventRoutes from './routes/event.routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  const mockMode = process.env.MOCK_AI_MODE === 'true';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '2.0.0',
    features: {
      ai: process.env.ENABLE_AI_GENERATION === 'true',
      mockAI: mockMode,
      '2d': process.env.ENABLE_2D_MODE !== 'false',
      '3d': process.env.ENABLE_3D_MODE !== 'false',
      multiplayer: process.env.ENABLE_MULTIPLAYER === 'true'
    }
  });
});

// API Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/scenes', sceneRoutes);
apiRouter.use('/objects', objectRoutes);
apiRouter.use('/assets', assetRoutes);
apiRouter.use('/prefabs', prefabRoutes);
apiRouter.use('/resources', resourceRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/alliances', allianceRoutes);
apiRouter.use('/combat', combatRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/events', eventRoutes);

app.use('/api/v1', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    
    httpServer.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🎮 COMPLETE 2D/3D GAME ENGINE with AI INTEGRATION');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`🚀 Server running: http://localhost:${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api/v1`);
      console.log(`🔍 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('📋 Available Routes:');
      console.log('  🔐 /api/v1/auth - Authentication');
      console.log('  📁 /api/v1/projects - Projects (2D/3D)');
      console.log('  🎬 /api/v1/scenes - Scenes');
      console.log('  🎯 /api/v1/objects - Game Objects');
      console.log('  🎨 /api/v1/assets - Assets');
      console.log('  🏰 /api/v1/prefabs - Prefabs');
      console.log('  💰 /api/v1/resources - Resources');
      console.log('  🤖 /api/v1/ai - AI Services (NEW!)');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('🤖 AI Features:');
      const mockMode = process.env.MOCK_AI_MODE === 'true';
      console.log(`  Mode: ${mockMode ? '🔶 MOCK (no API keys needed)' : '✅ LIVE (using real AI)'}`);
      console.log('  - Parse natural language commands');
      console.log('  - Generate sprites & images');
      console.log('  - Generate 3D model previews');
      console.log('  - Generate game code');
      console.log('  - Generate NPC dialogue');
      console.log('  - Enhance prompts');
      console.log('  - Upscale images');
      console.log('  - Remove backgrounds');
      console.log('  - Generate textures');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      
      logger.info('Server started successfully');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;