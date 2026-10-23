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
    title: 'Generate a UML use case diagram as an SVG',
    prompt: `Generate a standalone UML Use Case Diagram as an SVG file (light theme, ~820×590 px) for the requirement [RS-RBS-RDM] Room Details Management from the CSC Room Booking System (RBS) Requirement Specification.

TITLE (top, centered, bold): "Use Case Diagram — Room Details Management"
SUBTITLE: "[RS-RBS-RDM] · RBS Administrator creates & edits room attributes"

ACTOR (left side, stick figure, labeled «actor»): RBS Administrator

SYSTEM BOUNDARY: a rounded rectangle labeled «system» "Room Details Management (RBS)". Place the actor OUTSIDE the boundary (to the left) and the use cases INSIDE. Draw association lines from the actor to every use case, crossing the boundary edge.

USE CASES (inside boundary, as rounded rectangles, light-blue fill #E3F2FD, blue border #1565C0). Each box shows: process ID (bold, small), use-case name (bold), and a 1–2 line description:
1. RS-RBS-RDM-001 — Room Type Configuration
   Define room types: Auditorium, Function Halls, Classrooms, Horseshoe Classrooms, Media & Crisis Management Simulation Training Area, Council Simulation Room, Cubicles, Meeting Rooms, Multi-media Studio, Lactation Rooms, Learning Common Booths.
2. RS-RBS-RDM-002 — Location & Capacity Management
   Floor, adjacent rooms (Combine Room mechanism), open/restricted access; capacity metrics: number of seats, square metres, maximum occupants.
3. RS-RBS-RDM-003 — Timeslot & Signage Configuration
   Scheduling units (30-minute or hourly slots); customise digital signage display messages for booking status, event names, or welcome messages.
4. RS-RBS-RDM-004 — Access Restrictions Management
   Role-based booking permissions (e.g., GGTDS admin group / user role can only book specific room types).

LEGEND (bottom-left): stick figure = Actor (RBS Administrator); rounded rect = Use Case (within RBS).

STYLE: clean, professional; dark text (#263238 / #0D47A1) on white/light background; no heavy shadows.`,
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
