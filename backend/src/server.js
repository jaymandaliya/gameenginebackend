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
import scriptRoutes from './routes/script.routes.js';
import engineRoutes from './routes/engine.routes.js';
import godotRoutes from './routes/godot.routes.js';
import multiplayerRoutes from './routes/multiplayer.routes.js';
import allianceRoutes from './routes/alliance.routes.js';
import combatRoutes from './routes/combat.routes.js';
import chatRoutes from './routes/chat.routes.js';
import eventRoutes from './routes/event.routes.js';
// GDD game systems
import cityRoutes from './routes/city.routes.js';
import unitRoutes from './routes/unit.routes.js';
import heroRoutes from './routes/hero.routes.js';
import dragonRoutes from './routes/dragon.routes.js';
import navalRoutes from './routes/naval.routes.js';
import researchRoutes from './routes/research.routes.js';
import mineRoutes from './routes/mine.routes.js';
import beastRoutes from './routes/beast.routes.js';
import tournamentRoutes from './routes/tournament.routes.js';
import capitalWarRoutes from './routes/capitalwar.routes.js';
import shopRoutes from './routes/shop.routes.js';
import magicRoutes from './routes/magic.routes.js';

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
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow WebView to load builds
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Serve exported game builds (APK, HTML5, etc.) as static files
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use('/builds', express.static(join(__dirname, '../public/builds'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

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
apiRouter.use('/scripts', scriptRoutes);
apiRouter.use('/engine', engineRoutes);
apiRouter.use('/godot', godotRoutes);
apiRouter.use('/multiplayer', multiplayerRoutes);
apiRouter.use('/alliances', allianceRoutes);
apiRouter.use('/combat', combatRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/events', eventRoutes);
// GDD game systems
apiRouter.use('/city', cityRoutes);
apiRouter.use('/units', unitRoutes);
apiRouter.use('/heroes', heroRoutes);
apiRouter.use('/dragons', dragonRoutes);
apiRouter.use('/naval', navalRoutes);
apiRouter.use('/research', researchRoutes);
apiRouter.use('/mines', mineRoutes);
apiRouter.use('/beasts', beastRoutes);
apiRouter.use('/tournament', tournamentRoutes);
apiRouter.use('/capitalwar', capitalWarRoutes);
apiRouter.use('/shop', shopRoutes);
apiRouter.use('/magic', magicRoutes);

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
      console.log('  🔐 /api/v1/auth         - Authentication');
      console.log('  📁 /api/v1/projects     - Projects (2D/3D)');
      console.log('  🎬 /api/v1/scenes       - Scenes');
      console.log('  🎯 /api/v1/objects      - Game Objects');
      console.log('  🎨 /api/v1/assets       - Assets');
      console.log('  🏰 /api/v1/prefabs      - Prefabs');
      console.log('  💰 /api/v1/resources    - Resources (Gold/Food/Wood/Stone/Mana/Dragon/Trade)');
      console.log('  🤖 /api/v1/ai           - AI Services');
      console.log('  🗺️  /api/v1/city         - City Management & Building Upgrades');
      console.log('  ⚔️  /api/v1/units        - Unit Training (Archer/Infantry/Cavalry/Siege T1-T5)');
      console.log('  🦸 /api/v1/heroes       - Hero System (Shards/Level/Stars/Equipment)');
      console.log('  🐉 /api/v1/dragons      - Dragon System (Hatch/Level/Deploy/Heal)');
      console.log('  ⚓ /api/v1/naval        - Naval System (Ships/Trade Routes)');
      console.log('  🔬 /api/v1/research     - Tech Tree (Military/Economy/Magic/Naval/Dragon)');
      console.log('  ⛏️  /api/v1/mines        - Mine System (Contested/Harvest)');
      console.log('  🐺 /api/v1/beasts       - Beast Raid System');
      console.log('  🏆 /api/v1/tournament   - Team Tournament (3v3/5v5)');
      console.log('  🏯 /api/v1/capitalwar   - Capital War System');
      console.log('  🛒 /api/v1/shop         - 5 Shops (Personal/Alliance/Battle/Premium/Hero)');
      console.log('  ✨ /api/v1/magic        - Magic System (Factions/Spells)');
      console.log('  🗡️  /api/v1/combat       - Battle System (GDD formula + Duels)');
      console.log('  🤝 /api/v1/alliances    - Alliance System');
      console.log('  💬 /api/v1/chat         - Chat');
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