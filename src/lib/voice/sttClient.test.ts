import { describe, expect, it } from 'vitest';
import { transcribeFile } from './sttClient';
import type { SttConfig } from './sttConfig';

const mockConfig: SttConfig = {
  baseUrl: 'http://stt.local',
  apiKey: '',
  model: 'sensevoice',
  defaultLanguage: 'yue',
  timeoutMs: 1000,
  spk: true,
  mock: true,
  maxUploadBytes: 1024,
};

describe('transcribeFile mock', () => {
  it('returns Hong Kong traditional Chinese for Cantonese mock transcripts', async () => {
    const result = await transcribeFile('meeting.mp4', mockConfig, {
      language: 'yue',
    });

    expect(result.text).toContain('這是模擬轉寫結果。');
    expect(result.text).not.toContain('这是模拟转写结果。');
    expect(result.segments[0].text).toBe('這是模擬轉寫結果。');
    expect(result.segments[1].text).toBe(
      '會議討論了登錄改版與後端接口分工。',
    );
    expect(result.segments[2].text).toBe(
      'Hello from STT mock. Action items follow next week.',
    );
  });
});
