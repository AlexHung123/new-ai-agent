/**
 * Supported audio/video extensions for Agent Voice transcribe.
 * Copied from pi-rag transcription allowlist.
 */
export const AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'm4a',
  'mp4',
  'flac',
  'ogg',
  'aac',
  'webm',
  'wma',
  'mkv',
] as const;

export type AudioExtension = (typeof AUDIO_EXTENSIONS)[number];

const EXT_SET = new Set<string>(AUDIO_EXTENSIONS);

const AUDIO_MIME_PREFIXES = ['audio/'] as const;
const AUDIO_MIME_EXACT = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
  'audio/ogg',
  'audio/webm',
  'audio/x-ms-wma',
  'video/mp4',
  'video/webm',
  'video/x-matroska',
  'application/ogg',
]);

export function extensionOf(filename: string): string {
  const base = filename.split(/[/\\]/).pop() || filename;
  const i = base.lastIndexOf('.');
  if (i < 0) return '';
  return base.slice(i + 1).toLowerCase();
}

export function isAudioExtension(ext: string): ext is AudioExtension {
  return EXT_SET.has(ext.toLowerCase());
}

export function isAudioFilename(filename: string): boolean {
  return isAudioExtension(extensionOf(filename));
}

export function isAudioMime(mime?: string | null): boolean {
  if (!mime) return false;
  const m = mime.toLowerCase().trim();
  if (AUDIO_MIME_EXACT.has(m)) return true;
  return AUDIO_MIME_PREFIXES.some((p) => m.startsWith(p));
}

/** True if filename extension or mime indicates an STT upload. */
export function isAudioUpload(filename: string, mime?: string | null): boolean {
  if (isAudioFilename(filename)) return true;
  if (!extensionOf(filename) && isAudioMime(mime)) return true;
  return false;
}

export function audioAcceptAttribute(): string {
  return [
    ...AUDIO_EXTENSIONS.map((e) => `.${e}`),
    'audio/*',
    'video/mp4',
    'video/webm',
  ].join(',');
}

export function displayFilename(filename: string): string {
  const base = (filename.split(/[/\\]/).pop() || '').trim() || 'audio';
  return base.slice(0, 200);
}
