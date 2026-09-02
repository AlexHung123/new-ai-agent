export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
  speaker?: string | null;
};

export type TranscriptFormatInput = {
  title: string;
  originalFilename: string;
  language?: string | null;
  durationSeconds?: number | null;
  transcribedAt?: Date;
  segments: TranscriptSegment[];
};

/** Format seconds as HH:MM:SS (or MM:SS if under 1 hour). */
export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  return formatTimestamp(seconds);
}

/** Build Markdown transcript for display / download. */
export function buildTranscriptMarkdown(input: TranscriptFormatInput): string {
  const title = (input.title || 'Transcript').trim() || 'Transcript';
  const lang = (input.language || 'unknown').trim() || 'unknown';
  const at = (input.transcribedAt || new Date()).toISOString();
  const duration = formatDuration(input.durationSeconds);
  const source = input.originalFilename || 'audio';

  const lines: string[] = [
    `# ${title}`,
    '',
    `- **Source:** ${source}`,
    `- **Language:** ${lang}`,
    `- **Duration:** ${duration}`,
    `- **Transcribed at:** ${at}`,
    '',
    '## Transcript',
    '',
  ];

  const segments =
    input.segments?.length > 0
      ? input.segments
      : [{ start: 0, end: input.durationSeconds ?? 0, text: '' }];

  for (const seg of segments) {
    const text = (seg.text || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const spk =
      seg.speaker != null && String(seg.speaker).trim()
        ? ` **[${String(seg.speaker).trim()}]**`
        : '';
    lines.push(`- [${formatTimestamp(seg.start)}]${spk} ${text}`);
  }

  if (lines[lines.length - 1] === '') {
    lines.push('_No speech detected._');
  }

  lines.push('');
  return lines.join('\n');
}

export function transcriptDownloadFilename(originalName: string): string {
  const base =
    originalName
      .replace(/[\\/]/g, '_')
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w.\u4e00-\u9fff\-]+/g, '_')
      .slice(0, 180) || 'audio';
  return `${base}.transcript.md`;
}
