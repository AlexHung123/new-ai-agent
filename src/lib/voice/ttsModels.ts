export const TTS_MODELS = [
  {
    id: 'mlx-community/VoxCPM2-8bit',
    label: 'VoxCPM2 (8-bit)',
  },
] as const;

export type TtsModelId = (typeof TTS_MODELS)[number]['id'];

export const DEFAULT_TTS_MODEL: TtsModelId = 'mlx-community/VoxCPM2-8bit';

export function isAllowedTtsModel(model: string): model is TtsModelId {
  return TTS_MODELS.some((entry) => entry.id === model);
}
