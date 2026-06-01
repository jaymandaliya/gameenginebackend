# React Native Integration (Next-Gen 3D Builder)

Use these files inside your React Native app to call:

- `POST /api/v1/ai/generate-game-builder`

with:

```json
{
  "prompt": "Create a mythic 3D action RPG...",
  "options": {
    "mode": "next-gen-3d",
    "nextGen3D": true,
    "includeAssets": true,
    "includeAudio": true,
    "includeCode": true,
    "camera": "3D"
  }
}
```

## Files

- `aiGameBuilderApi.ts` - API client helper
- `NextGenGameBuilderScreen.example.md` - copy-ready screen scaffold for your RN app

## Notes

- This endpoint requires auth token (`Authorization: Bearer <token>`).
- For real 3D `.glb` generation, backend needs valid `MESHY_API_KEY`.
- For media generation, backend should have `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`, and `ELEVENLABS_API_KEY`.
