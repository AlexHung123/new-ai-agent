'use client';

import { useState } from 'react';
import EmptyChatMessageInput from './EmptyChatMessageInput';
import { HTML_SKILL_HINT } from './HtmlSkillHint';

export const WRITING_HINT_SUGGESTIONS = [
  {
    title: 'Write a polite but firm follow-up email',
    prompt:
      'Write a polite but firm follow-up email. Deliver a copy-ready email: a subject line that names the unanswered request, a first paragraph on what was asked and when, a second that states the new time the reply is needed by, and a third that says what is still missing. Keep it polite but firm; leave the colleague’s name and the dates blank.',
  },
  {
    title: 'Write a weekly report example that goes beyond listing tasks',
    prompt:
      'Write a weekly report example that goes beyond listing tasks. Deliver a short report a manager can read in one pass: a one-line status, what changed and why it matters, what is blocked and the decision needed, and the one outcome planned for next week. Use results instead of a task list; leave names, dates, and figures blank.',
  },
  {
    title: 'Create a project meeting-minutes template',
    prompt:
      'Create a project meeting-minutes template. Deliver a copy-ready template: meeting name, date, and attendees; decisions made; action items with an owner and a due date; and open questions. Keep each section to a few lines and leave the names and dates blank.',
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
