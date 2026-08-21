import { afterEach, describe, expect, it } from 'vitest';
import {
  buildVoxcpmSpeechBody,
  encodeAudioDataUri,
  getTtsConfig,
  parseSpeechFields,
  parseSpeechFormData,
  synthesizeSpeech,
} from './speechRequest';

const wavBytes = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);

describe('encodeAudioDataUri', () => {
  it('encodes raw audio bytes as a data URI', () => {
    expect(encodeAudioDataUri(wavBytes, 'audio/wav')).toBe(
      `data:audio/wav;base64,${Buffer.from(wavBytes).toString('base64')}`,
    );
  });
});

describe('getTtsConfig', () => {
  const originalUrl = process.env.TTS_BASE_URL;
  const originalModel = process.env.TTS_MODEL;
  const originalTokens = process.env.TTS_MAX_TOKENS;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.TTS_BASE_URL;
    else process.env.TTS_BASE_URL = originalUrl;
    if (originalModel === undefined) delete process.env.TTS_MODEL;
    else process.env.TTS_MODEL = originalModel;
    if (originalTokens === undefined) delete process.env.TTS_MAX_TOKENS;
    else process.env.TTS_MAX_TOKENS = originalTokens;
  });

  it('defaults to the VoxCPM2 server on 8020', () => {
    delete process.env.TTS_BASE_URL;
    delete process.env.TTS_MODEL;
    delete process.env.TTS_MAX_TOKENS;

    expect(getTtsConfig({})).toEqual({
      baseUrl: 'http://192.168.1.56:8020',
      model: 'mlx-community/VoxCPM2-4bit',
      maxTokens: 2000,
    });
  });

  it('reads override env values', () => {
    expect(
      getTtsConfig({
        TTS_BASE_URL: 'http://tts.local:9000/',
        TTS_MODEL: 'custom-model',
        TTS_MAX_TOKENS: '512',
      }),
    ).toEqual({
      baseUrl: 'http://tts.local:9000',
      model: 'custom-model',
      maxTokens: 512,
    });
  });
});

describe('parseSpeechFields', () => {
  it('rejects missing input or reference audio', () => {
    expect(parseSpeechFields({}).error).toMatch(/input/i);
    expect(
      parseSpeechFields({ input: 'hello', refText: 'transcript' }).error,
    ).toMatch(/ref_audio/i);
  });

  it('accepts a cloning request without a reference transcript', () => {
    const result = parseSpeechFields({
      input: '你好，歡迎使用粵語語音合成。',
      file: { bytes: wavBytes, mimeType: 'audio/wav', name: 'ref.wav' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.refText).toBe('');
    }
  });

  it('rejects non-audio uploads', () => {
    const result = parseSpeechFields({
      input: 'hello',
      refText: 'transcript',
      file: { bytes: wavBytes, mimeType: 'image/png', name: 'ref.png' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it('accepts a complete cloning request', () => {
    const result = parseSpeechFields({
      input: '  你好，歡迎使用粵語語音合成。  ',
      refText: '  在2014年4月15日  ',
      file: { bytes: wavBytes, mimeType: 'audio/wav', name: 'ref.wav' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.input).toBe('你好，歡迎使用粵語語音合成。');
      expect(result.data.refText).toBe('在2014年4月15日');
      expect(result.data.refAudioBytes).toEqual(wavBytes);
    }
  });

  it('accepts an allowlisted TTS model', () => {
    const result = parseSpeechFields({
      input: '你好',
      model: 'OpenMOSS-Team/MOSS-TTS-v1.5',
      file: { bytes: wavBytes, mimeType: 'audio/wav', name: 'ref.wav' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.model).toBe('OpenMOSS-Team/MOSS-TTS-v1.5');
    }
  });

  it('rejects a TTS model that is not on the allowlist', () => {
    const result = parseSpeechFields({
      input: '你好',
      model: 'unknown-tts-model',
      file: { bytes: wavBytes, mimeType: 'audio/wav', name: 'ref.wav' },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/model/i);
  });
});

describe('parseSpeechFormData', () => {
  it('reads multipart fields used by the voice studio', async () => {
    const form = new FormData();
    form.set('input', '你好，歡迎使用粵語語音合成。');
    form.set(
      'ref_text',
      '在2014年4月15日国家主席习近平首次提出了总体国家安全观标志着国家安全工作进入了一个新的历史',
    );
    form.set(
      'ref_audio',
      new File([wavBytes], 'ref_0812_24k.wav', { type: 'audio/wav' }),
    );

    const result = await parseSpeechFormData(form);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.input).toBe('你好，歡迎使用粵語語音合成。');
    expect(result.data.refAudioMimeType).toBe('audio/wav');
  });

  it('reads the selected TTS model from multipart fields', async () => {
    const form = new FormData();
    form.set('input', '你好');
    form.set('model', 'OpenMOSS-Team/MOSS-TTS-v1.5');
    form.set(
      'ref_audio',
      new File([wavBytes], 'ref.wav', { type: 'audio/wav' }),
    );

    const result = await parseSpeechFormData(form);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.model).toBe('OpenMOSS-Team/MOSS-TTS-v1.5');
  });
});

describe('buildVoxcpmSpeechBody', () => {
  it('builds the OpenAI-style VoxCPM2 payload with a data URI', () => {
    const parsed = parseSpeechFields({
      input: '你好，歡迎使用粵語語音合成。',
      refText:
        '在2014年4月15日国家主席习近平首次提出了总体国家安全观标志着国家安全工作进入了一个新的历史',
      file: { bytes: wavBytes, mimeType: 'audio/wav', name: 'ref.wav' },
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(
      buildVoxcpmSpeechBody(parsed.data, {
        baseUrl: 'http://192.168.1.56:8020',
        model: 'mlx-community/VoxCPM2-4bit',
        maxTokens: 2000,
      }),
    ).toEqual({
      model: 'mlx-community/VoxCPM2-4bit',
      input: '你好，歡迎使用粵語語音合成。',
      ref_audio: encodeAudioDataUri(wavBytes, 'audio/wav'),
      ref_text:
        '在2014年4月15日国家主席习近平首次提出了总体国家安全观标志着国家安全工作进入了一个新的历史',
      response_format: 'wav',
      max_tokens: 2000,
    });
  });

  it('omits ref_text from the payload when the transcript is empty', () => {
    const parsed = parseSpeechFields({
      input: '你好，歡迎使用粵語語音合成。',
      file: { bytes: wavBytes, mimeType: 'audio/wav', name: 'ref.wav' },
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(
      buildVoxcpmSpeechBody(parsed.data, {
        baseUrl: 'http://192.168.1.56:8020',
        model: 'mlx-community/VoxCPM2-4bit',
        maxTokens: 2000,
      }),
    ).toEqual({
      model: 'mlx-community/VoxCPM2-4bit',
      input: '你好，歡迎使用粵語語音合成。',
      ref_audio: encodeAudioDataUri(wavBytes, 'audio/wav'),
      response_format: 'wav',
      max_tokens: 2000,
    });
  });
});

describe('synthesizeSpeech', () => {
  it('posts JSON to /v1/audio/speech and returns the wav bytes', async () => {
    const audio = new Uint8Array([1, 2, 3, 9]);
    const calls: Array<{ url: string; init: RequestInit }> = [];

    const result = await synthesizeSpeech(
      {
        input: '你好',
        refText: '參考文本',
        refAudioBytes: wavBytes,
        refAudioMimeType: 'audio/wav',
      },
      {
        env: {
          TTS_BASE_URL: 'http://192.168.1.56:8020',
        },
        fetchImpl: async (url, init) => {
          calls.push({ url: String(url), init: init ?? {} });
          return new Response(audio, {
            status: 200,
            headers: { 'Content-Type': 'audio/wav' },
          });
        },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contentType).toBe('audio/wav');
    expect(result.audio).toEqual(audio);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://192.168.1.56:8020/v1/audio/speech');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({
      model: 'mlx-community/VoxCPM2-4bit',
      input: '你好',
      ref_text: '參考文本',
      response_format: 'wav',
    });
  });

  it('forwards the selected allowlisted model in the TTS payload', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];

    const result = await synthesizeSpeech(
      {
        input: '你好',
        refText: '',
        refAudioBytes: wavBytes,
        refAudioMimeType: 'audio/wav',
        model: 'OpenMOSS-Team/MOSS-TTS-v1.5',
      },
      {
        env: {
          TTS_BASE_URL: 'http://192.168.1.56:8020',
          TTS_MODEL: 'mlx-community/VoxCPM2-4bit',
        },
        fetchImpl: async (url, init) => {
          calls.push({ url: String(url), init: init ?? {} });
          return new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: { 'Content-Type': 'audio/wav' },
          });
        },
      },
    );

    expect(result.ok).toBe(true);
    expect(JSON.parse(String(calls[0].init.body)).model).toBe(
      'OpenMOSS-Team/MOSS-TTS-v1.5',
    );
  });

  it('surfaces FastAPI detail from a failed TTS response', async () => {
    const result = await synthesizeSpeech(
      {
        input: '你好',
        refText: '',
        refAudioBytes: wavBytes,
        refAudioMimeType: 'audio/wav',
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              detail:
                'Reference audio file not found: data:audio/wav;base64,UklGRg==',
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          ),
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.error).toBe(
      'Reference audio file not found: data:audio/wav;base64,UklGRg==',
    );
  });

  it('returns 502 when the TTS server cannot be reached', async () => {
    const result = await synthesizeSpeech(
      {
        input: '你好',
        refText: '參考文本',
        refAudioBytes: wavBytes,
        refAudioMimeType: 'audio/wav',
      },
      {
        fetchImpl: async () => {
          throw new Error('connect ECONNREFUSED 192.168.1.56:8020');
        },
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(502);
    expect(result.error).toMatch(/voice server/i);
  });
});
