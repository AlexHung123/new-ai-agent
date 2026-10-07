---
name: html-explainer
description: Use when the user wants a visual HTML explainer page, a flow or diagram page.
---

# HTML explainer

Produce one visual HTML explainer page with `am_render`.

Write a short Markdown draft (frontmatter title, then ## panels).
Use flow, sequence, tree, timeline, table, or callout for the shape of the information.
Do not use mermaid. Decision trees use a flow fence, for example:

```flow TB
(Start) -> {In stock?}
{In stock?} -> [Use contract]: yes
{In stock?} -> [Get quotes]: no
```

Call `am_render` with that draft. Do not hand-write HTML, CSS, or SVG.
If the tool returns an error, fix the draft and call `am_render` again (at most twice).
After success, reply in 2–3 sentences and end with a markdown link whose target is the href from the tool result.
