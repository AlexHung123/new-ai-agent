import { describe, expect, it } from 'vitest';
import { HTML_MODE_TURN_PREFIX, withHtmlModePrompt } from './htmlModePrompt';

describe('withHtmlModePrompt', () => {
  it('leaves the user turn unchanged when HTML is off', () => {
    expect(withHtmlModePrompt('[User request]\n幫我總結一下 需要100字', false)).toBe(
      '[User request]\n幫我總結一下 需要100字',
    );
  });

  it('invokes the HTML skill on the user turn when HTML is tagged', () => {
    const out = withHtmlModePrompt(
      '[User request]\nexplain the flow to buy a server',
      true,
    );
    expect(out).toMatch(/\[HTML explainer skill\]/);
    expect(out).toMatch(/Call am_render/);
    expect(out).toMatch(/\[User request\]\nexplain the flow to buy a server/);
  });

  it('tells the skill to use flow fences instead of mermaid', () => {
    expect(HTML_MODE_TURN_PREFIX).toMatch(/```flow TB/);
    expect(HTML_MODE_TURN_PREFIX).toMatch(/mermaid/i);
    expect(HTML_MODE_TURN_PREFIX).toMatch(/\(Start\) -> \{/);
  });
});
