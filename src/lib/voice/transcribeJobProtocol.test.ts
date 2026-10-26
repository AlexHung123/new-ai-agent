import { describe, expect, it } from 'vitest';
import {
  filenameFromHeader,
  markdownFromJobResult,
  readCreatedJob,
  transcribeUploadHeaders,
  validateTranscribeUpload,
} from './transcribeJobProtocol';

describe('transcribe job protocol', () => {
  it('keeps speaker diarization on and names the file', () => {
    expect(
      transcribeUploadHeaders({
        filename: 'meeting.mp4',
        language: 'yue',
        contentType: 'video/mp4',
      }),
    ).toMatchObject({
      'x-filename': 'meeting.mp4',
      'x-language': 'yue',
      'x-spk': 'true',
      'content-type': 'video/mp4',
    });
  });

  it('puts a Chinese filename in an ASCII header and reads it back', () => {
    const name = '香港特別行政區立法會 - 首頁.webm';
    const headers = transcribeUploadHeaders({
      filename: name,
      contentType: 'video/webm',
    });
    expect(() => new Headers(headers)).not.toThrow();
    expect(headers['x-filename']).not.toContain('香');
    expect(filenameFromHeader(headers['x-filename'])).toBe(name);
  });

  it('rejects a fourth-style busy response as a queue message', () => {
    const result = readCreatedJob(429, {
      detail: 'Someone else is transcribing. Try again in a little while.',
    });
    expect(result).toEqual({
      ok: false,
      status: 429,
      error: 'Someone else is transcribing. Try again in a little while.',
    });
  });

  it('accepts a queued job id', () => {
    expect(
      readCreatedJob(200, { id: 'a'.repeat(32), status: 'queued' }),
    ).toEqual({ ok: true, jobId: 'a'.repeat(32), status: 'queued' });
  });

  it('rejects an unsupported upload before it is streamed', () => {
    expect(
      validateTranscribeUpload({
        filename: 'notes.txt',
        contentType: 'text/plain',
        contentLength: 12,
        maxBytes: 100,
      }).ok,
    ).toBe(false);
  });

  it('keeps speaker labels in the finished transcript', () => {
    const { markdown } = markdownFromJobResult({
      filename: 'meeting.mp4',
      language: 'yue',
      transcribedAt: new Date('2026-08-13T00:00:00.000Z'),
      result: {
        language: 'yue',
        duration: 12,
        text: '你好',
        segments: [{ start: 0, end: 12, text: '你好', speaker: 'SPK0' }],
      },
    });
    expect(markdown).toContain('**[SPK0]**');
    expect(markdown).toContain('你好');
  });
});
