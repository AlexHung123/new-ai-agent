export const HTML_MODE_TURN_PREFIX = `[HTML mode]
This turn must produce one visual HTML explainer page.
Write a short Markdown draft (frontmatter title, then ## panels).
Use flow, sequence, tree, timeline, table, or callout for the shape of the information.
Do not use mermaid. Decision trees use a flow fence, for example:
\`\`\`flow TB
(Start) -> {In stock?}
{In stock?} -> [Use contract]: yes
{In stock?} -> [Get quotes]: no
\`\`\`
Call am_render with that draft. Do not hand-write HTML, CSS, or SVG.
If the tool returns an error, fix the draft and call am_render again (at most twice).
After success, reply in 2–3 sentences and end with a markdown link whose target is the href from the tool result.
Skip the page only if the user asked for plain text.`;

/** Tagged send: put this on the user turn so the model actually runs the skill. */
export const HTML_SKILL_INVOCATION = `[HTML explainer skill]
This turn must produce one visual HTML explainer page.
Call am_render with the Markdown draft. Do not answer in plain text only.`;

export function withHtmlModePrompt(body: string, htmlMode: boolean): string {
  if (!htmlMode) return body;
  return `${HTML_SKILL_INVOCATION}\n\n${body}`;
}
