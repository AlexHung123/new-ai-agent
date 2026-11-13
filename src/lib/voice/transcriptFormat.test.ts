import { describe, expect, it } from 'vitest';
import {
  buildTranscriptMarkdown,
  buildTypoSummaryPrompt,
  extractTranscriptBody,
  resolveTypoSummaryInstruction,
  TYPO_SUMMARY_INSTRUCTION,
} from './transcriptFormat';

const SAMPLE = `# 總體國家安全觀發展進程_VO_moss_v15_0812

- **Source:** 總體國家安全觀發展進程_VO_moss_v15_0812.wav
- **Language:** yue
- **Duration:** 03:35
- **Transcribed at:** 2026-09-02T09:50:16.022Z

## Transcript

- [00:00] **[SPK0]** 自一九七八年起國家制定咗包括中華人民共和國國家安全法
- [00:19] **[SPK0]** 進入咗一個新嘅歷史階段
`;

describe('extractTranscriptBody', () => {
  it('returns only the content below the Transcript heading', () => {
    expect(extractTranscriptBody(SAMPLE)).toBe(
      [
        '- [00:00] **[SPK0]** 自一九七八年起國家制定咗包括中華人民共和國國家安全法',
        '- [00:19] **[SPK0]** 進入咗一個新嘅歷史階段',
      ].join('\n'),
    );
  });

  it('returns the body from markdown produced by buildTranscriptMarkdown', () => {
    const markdown = buildTranscriptMarkdown({
      title: 'meeting',
      originalFilename: 'meeting.wav',
      language: 'yue',
      durationSeconds: 12,
      transcribedAt: new Date('2026-09-02T00:00:00.000Z'),
      segments: [
        { start: 0, end: 12, text: '你好世界', speaker: 'spk0' },
      ],
    });

    expect(extractTranscriptBody(markdown)).toBe(
      '- [00:00] **[spk0]** 你好世界',
    );
  });

  it('returns an empty string when the heading is missing', () => {
    expect(extractTranscriptBody('# Title\n\nno heading here')).toBe('');
  });
});

describe('buildTypoSummaryPrompt', () => {
  it('prefixes the instruction and appends the transcript body', () => {
    expect(buildTypoSummaryPrompt(SAMPLE)).toBe(
      [
        TYPO_SUMMARY_INSTRUCTION,
        '',
        '- [00:00] **[SPK0]** 自一九七八年起國家制定咗包括中華人民共和國國家安全法',
        '- [00:19] **[SPK0]** 進入咗一個新嘅歷史階段',
      ].join('\n'),
    );
  });

  it('returns only the instruction when there is no transcript body', () => {
    expect(buildTypoSummaryPrompt('# Title\n\nno heading')).toBe(
      TYPO_SUMMARY_INSTRUCTION,
    );
  });

  it('uses a configured instruction when one is provided', () => {
    expect(buildTypoSummaryPrompt(SAMPLE, 'Correct the transcript.')).toBe(
      [
        'Correct the transcript.',
        '',
        '- [00:00] **[SPK0]** 自一九七八年起國家制定咗包括中華人民共和國國家安全法',
        '- [00:19] **[SPK0]** 進入咗一個新嘅歷史階段',
      ].join('\n'),
    );
  });
});

describe('resolveTypoSummaryInstruction', () => {
  it('uses the built-in default when config omits the instruction', () => {
    expect(TYPO_SUMMARY_INSTRUCTION).toBe(
      'help me to find out all the typo, mistakes and correct it, and then summarize it',
    );
    expect(resolveTypoSummaryInstruction(undefined)).toBe(
      TYPO_SUMMARY_INSTRUCTION,
    );
    expect(resolveTypoSummaryInstruction({})).toBe(TYPO_SUMMARY_INSTRUCTION);
    expect(
      resolveTypoSummaryInstruction({ typoSummaryInstruction: '   ' }),
    ).toBe(TYPO_SUMMARY_INSTRUCTION);
  });

  it('reads a non-empty voice.typoSummaryInstruction', () => {
    expect(
      resolveTypoSummaryInstruction({
        typoSummaryInstruction: '  Summarize the typos.  ',
      }),
    ).toBe('Summarize the typos.');
  });
});
