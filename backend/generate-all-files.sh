#!/bin/bash

# Copy core files from previous backend
cp /home/claude/final-complete-backend/backend/src/config/database.js src/config/
cp /home/claude/final-complete-backend/backend/src/utils/logger.js src/utils/
cp /home/claude/final-complete-backend/backend/src/middleware/errorHandler.js src/middleware/
cp /home/claude/final-complete-backend/backend/src/middleware/rateLimiter.js src/middleware/
cp /home/claude/final-complete-backend/backend/src/middleware/auth.middleware.js src/middleware/

# Copy all models
cp /home/claude/final-complete-backend/backend/src/models/*.js src/models/

# Copy all controllers (except AI which we created)
cp /home/claude/final-complete-backend/backend/src/controllers/auth.controller.js src/controllers/
cp /home/claude/final-complete-backend/backend/src/controllers/project.controller.js src/controllers/
cp /home/claude/final-complete-backend/backend/src/controllers/scene.controller.js src/controllers/
cp /home/claude/final-complete-backend/backend/src/controllers/object.controller.js src/controllers/
cp /home/claude/final-complete-backend/backend/src/controllers/asset.controller.js src/controllers/
cp /home/claude/final-complete-backend/backend/src/controllers/prefab.controller.js src/controllers/
cp /home/claude/final-complete-backend/backend/src/controllers/resource.controller.js src/controllers/

# Copy all routes (we'll add AI route separately)
cp /home/claude/final-complete-backend/backend/src/routes/*.js src/routes/

echo "✅ All base files copied"
