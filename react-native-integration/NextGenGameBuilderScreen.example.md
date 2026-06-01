# NextGenGameBuilderScreen example (React Native)

Copy this into your RN app as `NextGenGameBuilderScreen.tsx`.

```tsx
import React, { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { generateGameBuilder } from './aiGameBuilderApi';

type Props = {
  baseUrl: string;
  authToken: string;
};

export default function NextGenGameBuilderScreen({ baseUrl, authToken }: Props) {
  const [prompt, setPrompt] = useState('Create a mythic Chinese-inspired 3D action RPG with cinematic boss combat.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await generateGameBuilder(baseUrl, authToken, {
        prompt,
        options: {
          mode: 'next-gen-3d',
          nextGen3D: true,
          includeAssets: true,
          includeAudio: true,
          includeCode: true,
          camera: '3D',
          maxCharacters: 3,
          maxEnvironments: 2,
          maxSfx: 4,
        },
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Next-Gen 3D Game Builder</Text>

      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        multiline
        placeholder="Describe the full game you want..."
        style={{
          minHeight: 120,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 12,
          textAlignVertical: 'top',
        }}
      />

      <Button title={loading ? 'Generating...' : 'Generate 3D Game Build'} onPress={handleGenerate} disabled={loading} />

      {loading ? <ActivityIndicator size="large" /> : null}
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

      {result ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '700' }}>Title: {String(result?.blueprint?.title || 'Untitled')}</Text>
          <Text>Genre: {String(result?.blueprint?.genre || '-')}</Text>
          <Text>Mode: {String(result?.meta?.mode || '-')}</Text>
          <Text>3D Models: {String(result?.meta?.generated3DModels || 0)}</Text>
          <Text>Warnings: {String(result?.meta?.warnings || 0)}</Text>

          <Text style={{ fontWeight: '700', marginTop: 8 }}>Model URLs</Text>
          {(result?.generated?.assets?.models3d || []).map((item: any, index: number) => (
            <Text key={String(index)} selectable>
              {String(item?.name || 'asset')}: {String(item?.glbUrl || item?.modelUrl || 'no-url')}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
```
