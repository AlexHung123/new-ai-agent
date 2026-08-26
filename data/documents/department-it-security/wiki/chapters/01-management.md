---
title: Management responsibilities
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, policy, guideline]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 6.1, 14.1
confidence: high
contested: false
---

# Management responsibilities

DITSP ss.6.1 and 14.1 are the management hub: how Part II is read, who writes and circulates the documents, awareness, [[segregation-of-duties]], and [[least-privilege]]. Splits: [[01-management-outsourcing]] (ss.6.2, 14.1.7, 14.2) and [[01-management-contingency]] (ss.6.3, 14.3). Policy versus guidelines: [[compare-policy-guidelines]].

## Section map

| DITSP | Topic | Page |
| --- | --- | --- |
| Part II intro | Non-technical “shall”; **[M] [A] [U]** tags; all staff still read Part II | this page |
| 6.1.1–6.1.4 | Review, adaptive protection, budget, asset inventory | this page |
| 6.1.5–6.1.7 | Segregation, least privilege, CIA (including outsourced systems) | this page |
| 6.1.8–6.1.11 | Awareness; own policy on S17; discipline / contract termination | this page |
| 6.1.12–6.1.15 | Selection, training, new-post briefing; integrity check (CSB Circular 17/94) | this page |
| 14.1.1–14.1.4 | Documents, dissemination, review, urgent advisory | this page |
| 14.1.5–14.1.6 | Segregation (compensating logs); least privilege | this page |
| 14.1.7 | Security requirements in contracts | [[01-management-outsourcing]] |
| 6.2, 14.2 | Outsourcing | [[01-management-outsourcing]] |
| 6.3, 14.3 | Contingency / DR | [[01-management-contingency]] |

## How to read Part II

Part II is adapted from [[ogcio]] Baseline IT Security Policy [S17] after a CSB security risk assessment. Statements are top-level, non-technical standards. Tags mark who is most concerned (DITSP Part II intro):

| Tag | Role |
| --- | --- |
| **[M]** | Management: [[dso]], [[ditso|Division DITSO]], [[information-system-owner|Information System Owners]] |
| **[A]** | Administrator: IT Staff (ITMU, security / network / system administrators, application teams) |
| **[U]** | User: all users of information systems |

Multiple tags may apply to one statement. **All CSB staff shall still read the whole of Part II.** Mandatory / good practice / desirable: [[compare-shall-should-may]]. Who acts: [[compare-roles]].

## Policy — general management (DITSP s.6.1)

Review of information security policies, standards, guidelines, and procedures shall be periodic. Protection shall be responsive to a changing environment and technology. Necessary safeguards and resources shall be in the budget. An inventory of hardware, software, valid warranties, and maintenance agreements shall be kept (s.6.1.1–6.1.4).

[[information-system-owner|IS Owners]] shall apply sufficient [[segregation-of-duties]] so that one person does not execute all security functions of a system, and shall enforce [[least-privilege]] when assigning resources and privileges. They shall ensure confidentiality, integrity, and availability of information and all other security aspects of systems under their control, **including outsourced systems** (s.6.1.5–6.1.7). Outsourcing detail: [[outsourcing-security]].

Information security is every Government staff member’s responsibility. The [[ditso|Division DITSO]] shall educate users on the policy and strengthen awareness; CSB shall promulgate and enforce its own IT security policy, using the Baseline IT Security Policy as the basis (s.6.1.8–6.1.9).

The policy **shall** warn that:

- civil servants who contravene it **may be subject to disciplinary action** under the Public Service (Administration) Order 1997 (CSB Circular 16/85, then on CCGO); the level depends on severity (s.6.1.10);
- non-civil-service contract staff who contravene it **may have their employment contracts terminated**, depending on severity (s.6.1.11).

Staff who use, or have unescorted access to, systems and resources shall be carefully selected, made aware of their duties, and **formally notified** of their authorisation (s.6.1.12). They shall be educated and trained to discharge IT security duties (s.6.1.13). CSB shall advise all staff of those responsibilities on assignment to a new post, and periodically thereafter (s.6.1.14).

Staff handling classified systems or [[classified-information]] **shall undergo an integrity check** under CSB Circular 17/94. The type — Appointment Checking / Normal Checking / Extended Checking — shall match the sensitivity of the information or system (s.6.1.15).

## Documents (DITSP s.14.1.1)

| Document | Who establishes | Who develops | Who endorses / approves |
| --- | --- | --- | --- |
| Departmental IT Security Policy and Guidelines | [[dso]] | [[ditso|Division DITSO]] with technical help from [[itmu-security-team]] | DSO (enforcement) |
| System-specific IT security policy (higher requirements) | [[information-system-owner]] | IS Owner with ITMU and that system’s IT support | **Division DITSO** (must meet DITSP) |
| Working-level procedures for the system | IS Owner | IS Owner (users, passwords, configuration/patching, backup, incident response, and similar) | **IS Owner** (authorised to endorse their own system’s procedures) |

Guidelines development should consult IS Owners and IT support so the text is practical. System-specific policy and procedures should be integrated with the User Manual. IS Owners shall ensure all users have **read and understood** them before access is granted.

## Dissemination (DITSP s.14.1.2)

The Division DITSO shall set channels so every staff member in the division is aware of policy and procedures. CSB **shall** use:

- the **CSB Circulation Folder**, circulated among all staff **every six months**, with a **signature** that the officer has read and understood the policy;
- publication on the **CSB Intranet**;
- **email and internal circular** for security information (for example virus alerts), as necessary or as requested by [[ogcio]];
- **security awareness training** (seminar, workshop, quiz, web-based presentation, and similar).

IS Owners shall document dissemination and acknowledgement of any system-specific policy and procedures in that system’s operation manual.

## Review and urgent advice (DITSP s.14.1.3–14.1.4)

Division DITSO and the ITMU Security Team shall review DITSP regularly. Security risk assessment and audit should run **once every two years** and as necessary ([[07-risk-audit]]). They shall also lead the aftermath of a serious information security incident ([[08-incident]], [[isirt]]). IS Owners review system-specific policy and lead post-incident follow-up for their systems.

ITMU should keep pace with technology and market trends so new threats and fixes are identified in time. On urgent issues (virus outbreaks, intruder attacks) the team **shall** work with the Division DITSO, propose safeguards, and seek the **DSO’s endorsement** for prompt action.

## Segregation and least privilege (DITSP s.14.1.5–14.1.6)

Segregation splits the steps of a critical function so one person cannot subvert it. Where it is not practicable (few staff, technical limits), **compensating controls** should provide an equivalent safeguard — for example logging of critical operations plus random inspection or regular review of the log by senior management.

IS Owners should restrict a user’s access (files, processing, peripherals) and **type** of access (read, write, execute, delete) to the minimum needed to do the job — for users and for technical support staff.

Contract clauses for third parties (NDA, no access until the contract is signed): [[01-management-outsourcing]].

## Related

[[compare-roles]] · [[compare-shall-should-may]] · [[compare-policy-guidelines]] · [[segregation-of-duties]] · [[least-privilege]] · [[01-management-outsourcing]] · [[01-management-contingency]]
