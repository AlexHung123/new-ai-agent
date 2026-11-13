'use client';

import { useState } from 'react';
import EmptyChatMessageInput from './EmptyChatMessageInput';
import { HTML_SKILL_HINT } from './HtmlSkillHint';

export const WRITING_HINT_SUGGESTIONS = [
  {
    title: 'Write a polite but firm follow-up email',
    prompt:
      'Write an email asking a colleague for feedback on my draft. Deliver a copy-ready email: a subject line, a first paragraph on where the item stands now, a second giving the exact time I need their reply by, and a third explaining how to make it easy for them (for example, replying to just a few items). Keep it polite but clear; leave the colleague\'s name and the dates blank.',
  },
  {
    title: 'Write a weekly report example that goes beyond listing tasks',
    prompt:
      'Using fictional administrative work, write a 500-Chinese-character weekly report around training arrangements, materials procurement and next-week preparation. State achievements, problems and next steps. Label it as an example and do not invent performance figures. After writing the template, ask whether I want to add specific information to make a report ready to submit.',
  },
  {
    title: 'Create a project meeting-minutes template',
    prompt:
      'Create a project meeting-minutes template covering a meeting summary, key discussions, trade-offs, decisions and action items. If no transcript is provided, demonstrate the result with a short simulated case labeled “Example.” If text is provided, organize it faithfully without inventing information. List task, owner and deadline for action items, marking missing fields “Not specified.” Use polished Markdown, highlight key conclusions and include an action table. End by inviting the user to provide meeting notes.',
  },
  {
    title: 'Turn materials into easy-to-understand visual notes',
    prompt: `Turn these materials into easy-to-understand visual notes. ${HTML_SKILL_HINT}`,
  },
  {
    title: 'Sample diagrams for each requirement placeholder',
    prompt: `Read the mentioned requirement specification and draw sample diagrams I can paste into Word. Do not rewrite the specification.

Use the file tools. Find every [PLACEHOLDER] in document order. The heading above each one is the requirement id. The sentence immediately before the placeholder names the diagram.

Draw the next four placeholders only. Start at the first [PLACEHOLDER] that does not already have a diagram in this chat. After those four, stop and write: Reply continue for the next four placeholders.

For each diagram:
- Write one caption line: the requirement id, then the diagram name.
- Then put a standalone SVG inline, not inside a code fence, so it renders as a picture. Light theme, about 820 px wide, dark text (#263238 / #0D47A1) on white, no heavy shadows.
- If the sentence says "Use Case Diagram", draw a UML use case diagram. Put the actor outside a rounded system boundary and the use cases inside as rounded rectangles (fill #E3F2FD, border #1565C0). Take the actor from the process text (RBS Administrator, booking user, or an external system). The child requirements under that heading are the use cases. The first placeholder, under User Requirements, is the overview of RBS users, account management, and system configuration.
- If the sentence says "process", draw a simple activity diagram of the steps in the paragraph above the placeholder. Use a start oval, action rectangles, arrows, and an end oval. Add a decision diamond only when that paragraph describes a branch.

If that file is not in the mentioned files, ask me to upload and mention it. Do not invent the section list.`,
  },
] as const;

const HintArrow = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M5 11 11 5M6.5 5H11v4.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WritingHtmlHint = () => {
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const toggleDocuments = () => {
    setDocumentsOpen((open) => !open);
  };

  return (
    <div className="writing-html-hint">
      <div className="writing-hint-categories" aria-label="Writing category">
        <button
          type="button"
          className={`writing-hint-category${documentsOpen ? ' is-selected' : ''}`}
          aria-pressed={documentsOpen}
          onClick={toggleDocuments}
        >
          Documents
        </button>
      </div>
      <EmptyChatMessageInput draft={draft} onDraftChange={setDraft} />
      {documentsOpen ? (
        <ul className="writing-hint-suggestions" aria-label="Writing prompts">
          {WRITING_HINT_SUGGESTIONS.map((item) => (
            <li key={item.title}>
              <button type="button" onClick={() => setDraft(item.prompt)}>
                <span>{item.title}</span>
                <HintArrow />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default WritingHtmlHint;
