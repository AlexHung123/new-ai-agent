import type { TranscriptSegment } from './transcriptFormat';

export type SttResult = {
  text: string;
  language?: string;
  duration?: number;
  segments: TranscriptSegment[];
};

export function mapLanguageForStt(lang: string): string {
  const l = lang.trim().toLowerCase();
  const aliases: Record<string, string> = {
    cantonese: 'yue',
    'yue-hk': 'yue',
    'zh-yue': 'yue',
    'zh-hk': 'yue',
    mandarin: 'zh',
    chinese: 'zh',
    'zh-cn': 'zh',
    'zh-hans': 'zh',
  };
  return aliases[l] || l;
}

export function stripSenseVoiceTags(text: string): string {
  return (text || '').replace(/<\|[^|]*\|>/g, '').replace(/\s+/g, ' ').trim();
}

export function normalizeSttResponse(
  body: string,
  fallbackLanguage?: string,
): SttResult {
  const trimmed = (body || '').trim();
  if (!trimmed) {
    return { text: '', language: fallbackLanguage, segments: [] };
  }

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    const plain = stripSenseVoiceTags(trimmed);
    return {
      text: plain,
      language: fallbackLanguage,
      segments: plain ? [{ start: 0, end: 0, text: plain }] : [],
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    const plain = stripSenseVoiceTags(trimmed);
    return {
      text: plain,
      language: fallbackLanguage,
      segments: plain ? [{ start: 0, end: 0, text: plain }] : [],
    };
  }

  const obj = json as Record<string, unknown>;
  let text =
    typeof obj.text === 'string'
      ? obj.text
      : typeof obj.transcript === 'string'
        ? obj.transcript
        : '';
  text = stripSenseVoiceTags(text);

  const language =
    (typeof obj.language === 'string' ? obj.language : undefined) ||
    fallbackLanguage;
  const duration =
    typeof obj.duration === 'number'
      ? obj.duration
      : typeof obj.duration_seconds === 'number'
        ? obj.duration_seconds
        : undefined;

  const rawSegs = Array.isArray(obj.segments)
    ? obj.segments
    : Array.isArray(obj.sentence_info)
      ? obj.sentence_info
      : [];
  const segments: TranscriptSegment[] = [];
  for (const s of rawSegs) {
    if (!s || typeof s !== 'object') continue;
    const seg = s as Record<string, unknown>;
    let start =
      typeof seg.start === 'number'
        ? seg.start
        : typeof seg.start_time === 'number'
          ? seg.start_time
          : 0;
    let end =
      typeof seg.end === 'number'
        ? seg.end
        : typeof seg.end_time === 'number'
          ? seg.end_time
          : start;
    if (end > 1000 || start > 1000) {
      start = start / 1000;
      end = end / 1000;
    }
    const segText = stripSenseVoiceTags(
      typeof seg.text === 'string'
        ? seg.text
        : typeof seg.content === 'string'
          ? seg.content
          : '',
    );
    if (!segText) continue;
    const speakerRaw =
      seg.spk ??
      seg.speaker ??
      seg.speaker_id ??
      seg.speaker_label ??
      null;
    const speaker =
      speakerRaw != null && String(speakerRaw).trim()
        ? String(speakerRaw).trim()
        : null;
    segments.push({ start, end, text: segText, speaker });
  }

  if (!segments.length && text) {
    segments.push({ start: 0, end: duration ?? 0, text });
  }

  return {
    text: text || segments.map((item) => item.text).join(' '),
    language,
    duration,
    segments,
  };
}
