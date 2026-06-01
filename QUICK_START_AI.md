# ⚡ Quick Start - AI Game Engine

## 🚀 5-Minute Setup

### 1. Extract & Install
```bash
cd backend
npm install
```

### 2. Configure (Choose One)

**Option A: Mock Mode (No API Keys - FREE!)**
```bash
cp .env.example .env
nano .env
```

Set these:
```env
MONGODB_URI=mongodb://localhost:27017/game_engine_ai
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
MOCK_AI_MODE=true
```

**Option B: Real AI Mode**
```env
MONGODB_URI=mongodb://localhost:27017/game_engine_ai
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
OPENAI_API_KEY=sk-your-key
REPLICATE_API_TOKEN=r8_your-token
MOCK_AI_MODE=false
```

### 3. Fix Database
```bash
node cleanup-db.js
```

### 4. Run
```bash
npm run dev
```

## ✅ Test AI Features

### Import Postman
1. Open Postman
2. Import `Complete-AI-Game-Engine-Postman.json`
3. Run **Auth → Register**
4. Test AI endpoints!

### Quick Test
```bash
# Health check
curl http://localhost:3000/health

# AI status
curl http://localhost:3000/api/v1/ai/status

# Register (save token!)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@game.com","username":"test","password":"pass123"}'
```

## 🤖 Try AI Features

```bash
TOKEN="your-token-here"

# Parse command
curl -X POST http://localhost:3000/api/v1/ai/parse-command \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command": "Create a player at 100, 200"}'

# Generate sprite
curl -X POST http://localhost:3000/api/v1/ai/generate-sprite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "knight character", "style": "pixel-art"}'

# Generate code
curl -X POST http://localhost:3000/api/v1/ai/generate-code \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "player movement with arrow keys"}'

# Generate full next-gen 3D game build
curl -X POST http://localhost:3000/api/v1/ai/generate-game-builder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a cinematic 3D action RPG inspired by Chinese mythology",
    "options": {
      "mode": "next-gen-3d",
      "nextGen3D": true,
      "includeAssets": true,
      "includeAudio": true,
      "includeCode": true,
      "camera": "3D"
    }
  }'
```

## 🎯 You're Ready!

**40+ APIs working including:**
- ✅ Authentication
- ✅ Projects (2D/3D)
- ✅ Scenes & Objects
- ✅ 10 AI features

Start building your game! 🚀
