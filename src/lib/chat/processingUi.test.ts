import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('processing status UI', () => {
  it('keeps a live footer on the last assistant turn while loading', () => {
    const src = readSrc('../../components/MessageBox.tsx');
    expect(src).toMatch(/ProcessingStatus/);
    expect(src).not.toMatch(/streaming-caret/);
  });

  it('does not duplicate the processing status above the composer', () => {
    const src = readSrc('../../components/Chat.tsx');
    expect(src).not.toMatch(/ProcessingStatus/);
  });

  it('does not render the wrote-answer chip in the process panel', () => {
    const src = readSrc('../../components/AgentProcessPanel.tsx');
    expect(src).toMatch(/visibleProcessSteps/);
  });

  it('styles a visible spinner status without a blinking caret', () => {
    const css = readSrc('../../app/globals.css');
    expect(css).toMatch(/\.processing-status\s*\{/);
    expect(css).toMatch(/\.processing-status-spinner/);
    expect(css).not.toMatch(/streaming-caret/);
    const titleStart = css.indexOf('.processing-status-title {');
    expect(titleStart).toBeGreaterThanOrEqual(0);
    const titleRule = css.slice(
      css.indexOf('{', titleStart) + 1,
      css.indexOf('}', css.indexOf('{', titleStart)),
    );
    expect(titleRule).not.toMatch(/font-weight:\s*([5-9]00|bold)/);
  });
});
