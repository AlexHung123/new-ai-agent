import { Converter } from 'opencc-js';
import type { TranscriptSegment } from './transcriptFormat';

type ConvertibleResult = {
  text: string;
  language?: string;
  duration?: number;
  segments: TranscriptSegment[];
};

const toHk = Converter({ from: 'cn', to: 'hk' });
const CJK = /[\u4e00-\u9fff]/;

export function toHkTraditional(text: string): string {
  if (!text) return text;
  return toHk(text);
}

function hasCjk(text: string): boolean {
  return CJK.test(text);
}

export function toHkTraditionalResult<T extends ConvertibleResult>(
  result: T,
): T {
  const needsConvert =
    hasCjk(result.text) || result.segments.some((seg) => hasCjk(seg.text));
  if (!needsConvert) return result;

  return {
    ...result,
    text: toHkTraditional(result.text),
    segments: result.segments.map((seg) => ({
      ...seg,
      text: toHkTraditional(seg.text),
    })),
  };
}
