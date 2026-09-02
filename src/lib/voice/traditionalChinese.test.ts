import { describe, expect, it } from 'vitest';
import {
  toHkTraditional,
  toHkTraditionalResult,
} from './traditionalChinese';

describe('toHkTraditional', () => {
  it('converts simplified Chinese to Hong Kong traditional', () => {
    expect(toHkTraditional('这是模拟转写结果。')).toBe('這是模擬轉寫結果。');
    expect(toHkTraditional('会议讨论了登录改版与后端接口分工。')).toBe(
      '會議討論了登錄改版與後端接口分工。',
    );
  });

  it('leaves English and punctuation unchanged', () => {
    expect(toHkTraditional('Hello from STT mock.')).toBe(
      'Hello from STT mock.',
    );
  });
});

describe('toHkTraditionalResult', () => {
  it('converts transcript text and segments for Cantonese', () => {
    const result = toHkTraditionalResult({
      text: '这是模拟转写结果。',
      language: 'yue',
      duration: 12,
      segments: [
        { start: 0, end: 12, text: '这是模拟转写结果。', speaker: 'spk0' },
      ],
    });

    expect(result.text).toBe('這是模擬轉寫結果。');
    expect(result.segments[0].text).toBe('這是模擬轉寫結果。');
    expect(result.language).toBe('yue');
    expect(result.segments[0].speaker).toBe('spk0');
  });

  it('converts Mandarin and Auto transcripts that contain Chinese', () => {
    expect(
      toHkTraditionalResult({
        text: '登录成功',
        language: 'zh',
        segments: [{ start: 0, end: 1, text: '登录成功' }],
      }).text,
    ).toBe('登錄成功');

    expect(
      toHkTraditionalResult({
        text: '登录成功',
        language: 'auto',
        segments: [{ start: 0, end: 1, text: '登录成功' }],
      }).text,
    ).toBe('登錄成功');
  });

  it('converts Chinese characters even when language is English', () => {
    const result = toHkTraditionalResult({
      text: 'Hello 登录',
      language: 'en',
      segments: [{ start: 0, end: 1, text: 'Hello 登录' }],
    });
    expect(result.text).toBe('Hello 登錄');
  });

  it('does not rewrite English-only transcripts', () => {
    const result = toHkTraditionalResult({
      text: 'Action items follow next week.',
      language: 'en',
      segments: [
        { start: 0, end: 3, text: 'Action items follow next week.' },
      ],
    });
    expect(result).toEqual({
      text: 'Action items follow next week.',
      language: 'en',
      segments: [
        { start: 0, end: 3, text: 'Action items follow next week.' },
      ],
    });
  });
});
