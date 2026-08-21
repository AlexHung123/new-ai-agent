export const TTS_MODELS = [
  {
    id: 'mlx-community/VoxCPM2-4bit',
    label: 'VoxCPM2 (4-bit)',
  },
  {
    id: 'OpenMOSS-Team/MOSS-TTS-v1.5',
    label: 'MOSS-TTS v1.5',
  },
] as const;

export type TtsModelId = (typeof TTS_MODELS)[number]['id'];

export const DEFAULT_TTS_MODEL: TtsModelId = 'mlx-community/VoxCPM2-4bit';

export function isAllowedTtsModel(model: string): model is TtsModelId {
  return TTS_MODELS.some((entry) => entry.id === model);
}
