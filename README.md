# 🎮🤖 Complete 2D/3D Game Engine with AI Integration

**The Most Complete Game Engine Backend - Now with Full AI Powers!**

## ✨ What's New - AI Integration!

**🤖 11 AI-Powered Features:**
1. **Natural Language Commands** - "Create a player at 100, 200"
2. **Sprite Generation** - AI-generated game sprites
3. **3D Model Previews** - Generate 3D asset previews
4. **Code Generation** - AI writes game logic code
5. **NPC Dialogue** - Generate character dialogue
6. **Prompt Enhancement** - Improve your AI prompts
7. **Texture Generation** - Create seamless textures
8. **Image Upscaling** - 2x quality improvement
9. **Background Removal** - Clean sprite backgrounds
10. **Image Generation** - DALL-E powered images
11. **Prompt-to-Game Builder** - Build complete game blueprints, 3D assets, audio, and starter code

## 📦 Complete Package

**40+ API Endpoints:**
- ✅ 6 Authentication endpoints
- ✅ 5 Project endpoints (2D/3D support)
- ✅ 5 Scene endpoints
- ✅ 4 Object endpoints
- ✅ 3 Asset endpoints
- ✅ 2 Prefab endpoints
- ✅ 3 Resource endpoints
- ✅ **13 AI endpoints** ⭐ NEW!

**Features:**
- ✅ Full 2D game engine support
- ✅ Full 3D game engine support
- ✅ AI-powered content generation
- ✅ MongoDB database
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Security headers
- ✅ Comprehensive logging
- ✅ Mock AI mode (no API keys needed!)
- ✅ Postman collection included

## 🚀 Quick Start

### 1. Install
```bash
cd backend
npm install
```

### 2. Configure
```bash
cp .env.example .env
nano .env
```

**Minimum configuration:**
```env
MONGODB_URI=mongodb://localhost:27017/game_engine_ai
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

**For AI features (optional):**
```env
OPENAI_API_KEY=sk-your-key-here
REPLICATE_API_TOKEN=r8_your-token-here
MOCK_AI_MODE=false
```

**Or use mock mode (no API keys needed):**
```env
MOCK_AI_MODE=true
```

### 3. Fix Database
```bash
node cleanup-db.js
```

### 4. Run
```bash
npm run dev
```

**Server:** `http://localhost:3000`

## 🤖 AI Features - How to Use

### Mock Mode (Default - No Cost!)

Set in `.env`:
```env
MOCK_AI_MODE=true
```

All AI features work with sample data. Perfect for:
- Development
- Testing
- Demo purposes
- No API costs!

### Production Mode (Real AI)

Get API keys:
1. **OpenAI:** https://platform.openai.com/api-keys
2. **Replicate:** https://replicate.com/account/api-tokens

Set in `.env`:
```env
OPENAI_API_KEY=sk-proj-...
REPLICATE_API_TOKEN=r8_...
MOCK_AI_MODE=false
```

## 📬 Test with Postman

1. Import `Complete-AI-Game-Engine-Postman.json`
2. Run **Auth → Register**
3. Test AI features:
   - Parse Command
   - Generate Sprite
   - Generate 3D Model
   - Generate Code
   - And more!

## 🎯 Example AI Requests

### Parse Natural Language Command
```bash
curl -X POST http://localhost:3000/api/v1/ai/parse-command \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command": "Create a dragon enemy at coordinates 500, 300"}'
```

### Generate Sprite
```bash
curl -X POST http://localhost:3000/api/v1/ai/generate-sprite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "medieval knight", "style": "pixel-art"}'
```

### Generate Code
```bash
curl -X POST http://localhost:3000/api/v1/ai/generate-code \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "player jump with spacebar", "language": "javascript"}'
```

### Generate Full Game Build (Standard / Next-Gen 3D)
```bash
curl -X POST http://localhost:3000/api/v1/ai/generate-game-builder \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a mythic 3D action RPG with cinematic boss combat",
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

### Generate NPC Dialogue
```bash
curl -X POST http://localhost:3000/api/v1/ai/generate-dialogue \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"character": {"name": "Merchant", "personality": "friendly"}, "context": "selling items"}'
```

## 📊 All 40+ Endpoints

### 🔐 Authentication (6)
- POST `/auth/register` - Register
- POST `/auth/login` - Login
- GET `/auth/me` - Current user
- PUT `/auth/profile` - Update profile
- POST `/auth/refresh` - Refresh token
- POST `/auth/logout` - Logout

### 📁 Projects (5) - 2D/3D Support
- GET `/projects` - List projects
- POST `/projects` - Create project (2D or 3D)
- GET `/projects/:id` - Get project
- PUT `/projects/:id` - Update project
- DELETE `/projects/:id` - Delete project

### 🎬 Scenes (5)
- GET `/scenes?projectId=xxx` - List scenes
- POST `/scenes` - Create scene
- GET `/scenes/:id` - Get scene
- PUT `/scenes/:id` - Update scene
- DELETE `/scenes/:id` - Delete scene

### 🎯 Objects (4)
- GET `/objects?sceneId=xxx` - List objects
- POST `/objects` - Create object
- PUT `/objects/:id` - Update object
- DELETE `/objects/:id` - Delete object

### 🎨 Assets (3)
- GET `/assets` - List assets
- POST `/assets/upload` - Upload asset
- DELETE `/assets/:id` - Delete asset

### 🏰 Prefabs (2)
- GET `/prefabs` - List prefabs
- GET `/prefabs/:id` - Get prefab

### 💰 Resources (3)
- GET `/resources` - Get resources
- POST `/resources/add` - Add resources
- POST `/resources/spend` - Spend resources

### 🤖 AI Services (13) ⭐ NEW!
- GET `/ai/status` - AI service status
- GET `/ai/suggested-commands` - Command suggestions
- POST `/ai/parse-command` - Parse natural language
- POST `/ai/generate-game-builder` - Generate full game blueprint + assets + code
- POST `/ai/generate-sprite` - Generate sprites
- POST `/ai/generate-3d-model` - Generate 3D previews
- POST `/ai/generate-image` - Generate images
- POST `/ai/generate-code` - Generate code
- POST `/ai/generate-dialogue` - Generate NPC dialogue
- POST `/ai/enhance-prompt` - Enhance prompts
- POST `/ai/generate-texture` - Generate textures
- POST `/ai/upscale-image` - Upscale images
- POST `/ai/remove-background` - Remove backgrounds

## 🎮 2D vs 3D Mode

Projects support both modes:

**2D Project:**
```json
{
  "name": "My 2D Game",
  "mode": "2d"
}
```

## 📱 React Native Integration

Ready-to-use mobile integration files are available in [react-native-integration/README.md](react-native-integration/README.md).

**3D Project:**
```json
{
  "name": "My 3D Game",
  "mode": "3d"
}
```

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting (general + AI-specific)
- Helmet security headers
- CORS configuration
- Input validation
- Comprehensive error handling

## 💰 AI Costs (Production Mode)

**Mock Mode:** FREE (no API calls)

**Production Mode:**
- OpenAI GPT-4: ~$0.03 per request
- OpenAI DALL-E 3: ~$0.04 per image
- Replicate Stable Diffusion: ~$0.002 per image
- Image upscaling: ~$0.005 per image

**Tip:** Use mock mode for development, production mode for live apps.

## 📁 Project Structure

```
complete-ai-game-engine/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   │   └── ai.controller.js ⭐
│   │   ├── routes/
│   │   │   └── ai.routes.js ⭐
│   │   ├── services/
│   │   │   ├── openai.service.js ⭐
│   │   │   └── replicate.service.js ⭐
│   │   ├── middleware/
│   │   └── utils/
│   ├── package.json
│   ├── .env.example
│   └── cleanup-db.js
├── Complete-AI-Game-Engine-Postman.json
└── README.md
```

## 🐛 Troubleshooting

**phoneNumber error:**
```bash
node cleanup-db.js
```

**MongoDB not connecting:**
```bash
sudo systemctl start mongod
```

**AI not working:**
- Check `MOCK_AI_MODE` in .env
- Verify API keys if not in mock mode
- Check `/api/v1/ai/status` endpoint

## 🚢 Ready to Deploy

Everything is configured for:
- Development (mock AI mode)
- Testing (mock AI mode)
- Production (real AI with keys)

## ✨ What Makes This Complete?

1. **Full 2D/3D Support** - Not just 2D, full 3D too!
2. **Real AI Integration** - Not mocks, real OpenAI & Replicate
3. **Mock Mode** - Test without API costs
4. **40+ Endpoints** - Everything you need
5. **Production Ready** - Security, logging, error handling
6. **Postman Collection** - Test immediately
7. **Complete Documentation** - This file!

**This is the most complete game engine backend available!** 🚀

---

**Version 2.0.0** - Now with AI! 🤖
