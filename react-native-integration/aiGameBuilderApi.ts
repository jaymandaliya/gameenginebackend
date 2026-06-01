export type GameBuilderMode = 'standard' | 'next-gen-3d';

export interface GenerateGameBuilderPayload {
  prompt: string;
  options?: {
    mode?: GameBuilderMode;
    nextGen3D?: boolean;
    includeAssets?: boolean;
    includeAudio?: boolean;
    includeCode?: boolean;
    maxCharacters?: number;
    maxEnvironments?: number;
    maxSfx?: number;
    camera?: '2D' | '2.5D' | '3D';
  };
}

export interface GenerateGameBuilderResponse {
  success: boolean;
  data: {
    prompt: string;
    blueprint: Record<string, unknown>;
    generated: {
      assets: {
        characters: Array<Record<string, unknown>>;
        models3d: Array<Record<string, unknown>>;
        backgrounds: Array<Record<string, unknown>>;
        textures: Array<Record<string, unknown>>;
      };
      audio: {
        music: Record<string, unknown> | null;
        sfx: Array<Record<string, unknown>>;
      };
      code: Record<string, unknown> | null;
      warnings: string[];
    };
    meta: {
      mode: GameBuilderMode;
      includeAssets: boolean;
      includeAudio: boolean;
      includeCode: boolean;
      generatedCharacterAssets: number;
      generated3DModels: number;
      generatedBackgroundAssets: number;
      generatedTextures: number;
      generatedSfx: number;
      warnings: number;
    };
  };
}

export async function generateGameBuilder(
  baseUrl: string,
  authToken: string,
  payload: GenerateGameBuilderPayload,
): Promise<GenerateGameBuilderResponse> {
  const response = await fetch(`${baseUrl}/api/v1/ai/generate-game-builder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error || 'Failed to generate game build');
  }

  return result as GenerateGameBuilderResponse;
}
