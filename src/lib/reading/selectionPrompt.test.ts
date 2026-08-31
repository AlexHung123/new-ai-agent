import { describe, expect, it } from 'vitest';
import { formatReaderUserMessage } from './selectionPrompt';

describe('formatReaderUserMessage', () => {
  it('returns the question when there is no selection', () => {
    expect(formatReaderUserMessage('Summarize this')).toBe('Summarize this');
  });

  it('prefixes a quoted page selection', () => {
    const text = formatReaderUserMessage('What does this mean?', {
      quote: 'hello world',
      page: 3,
      fileName: 'paper.pdf',
    });
    expect(text).toContain('Selected text from paper.pdf (page 3):');
    expect(text).toContain('> hello world');
    expect(text).toContain('What does this mean?');
  });

  it('defaults the question when the selection is sent alone', () => {
    const text = formatReaderUserMessage('  ', {
      quote: 'clause 2',
      page: 1,
    });
    expect(text).toContain('Explain this passage.');
  });
});
