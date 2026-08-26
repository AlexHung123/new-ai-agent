# Wiki Schema — CSB Departmental IT Security Policy and Guidelines

## Domain

Civil Service Bureau *Departmental IT Security Policy and Guidelines* (DITSP): the bureau’s own IT security policy (Part II) and implementing guidelines (Part III), sitting on Security Regulations, OGCIO Baseline IT Security Policy [S17], and IT Security Guidelines [G3]. The source is an English PDF conversion (MinerU) of **version 1.2 (July 2008)**. First issue May 2006. The wiki is the compiled, readable, interlinked form of that source.

This is a **departmental** instrument, not a volume of the Government Regulations. Security Regulations remain Volume 5. S17 / G3 remain the government-wide baseline. DITSP adapts them to CSB systems and the CSB Information Security Management Framework.

## Conventions

- File names: lowercase English kebab-case, no spaces (`password-management.md`).
- Every wiki page starts with YAML frontmatter (below).
- Use `[[wikilinks]]` (Obsidian). Minimum **2 outbound links** per page.
- Link by slug only: `[[ditso]]`, `[[classified-information]]`, `[[03-access-control]]`. Obsidian resolves across folders.
- Display text: `[[ditso|Division DITSO]]`.
- When updating a page, bump `updated`.
- Every new page must be listed in `index.md` under the correct section.
- Every action is appended to `log.md` as `## [YYYY-MM-DD] action | subject`.
- Cite the booklet as `DITSP s.N`. On multi-source pages, append `^[MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]` after claims that need provenance.
- Reconstruct readable English. Never paste OCR-glued headings, HTML entities (`&#x27;`), or MinerU `<eq>` markers.
- If the source is unreadable at a critical point, write `(source unclear; verify against printed DITSP)` and keep the nearest section number.
- This wiki does **not** wikilink into the S17, G3, CSR, or SPR wikis. Point to those instruments by name in prose.

## Frontmatter

```yaml
---
title: English title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | chapter | source | query | synthesis
tags: []          # only tags from the taxonomy below
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 8.6, 16.3   # optional; section range or list
confidence: high | medium | low
contested: false
---
```

## Tag taxonomy

Add a tag here **before** using it on a page.

- Structure: `chapter`, `appendix`, `definition`
- People / orgs: `authority`, `role`, `department`
- Policy: `policy`, `guideline`, `classification`, `cia`
- Controls: `access-control`, `password`, `logging`, `encryption`, `physical`
- Operations: `backup`, `outsourcing`, `contingency`, `patch`, `malware`
- Network: `network`, `internet`, `email`, `wireless`, `remote`
- Assurance: `risk-assessment`, `audit`, `incident`
- Integrity: `copyright`, `integrity-check`
- Meta: `comparison`, `procedure`

## Page thresholds

- **Create** a page when a term is a named office/role (DSO, Division DITSO, ISIRT), a defined control family, or a section-level topic.
- **Don't create** a page for a CCGO URL, a Windows Group Policy row, a product name (Symantec, Lotus Notes, SMS), or a passing mention.
- **Split** when a page exceeds ~200 lines.
- Chapter hubs stay short; detail goes to concept/entity pages and the named splits.

## Reserved slugs

Do not invent competing slugs for these. Link to them.

### Chapters

| Slug | Topic | DITSP |
| --- | --- | --- |
| `00-introduction` | Purpose, scope, definitions, CSB framework | 1–5 |
| `01-management` | Management hub: documents, duties, awareness | 6.1, 14.1 |
| `01-management-outsourcing` | Outsourcing, third parties, contracts | 6.2, 14.1.7, 14.2 |
| `01-management-contingency` | Contingency and disaster recovery | 6.3, 14.3 |
| `02-physical` | Environment, equipment, physical access | 7, 15 |
| `03-access-control` | Access, authentication, IDs, privileges | 8.1–8.5, 8.7, 16.1–16.2 |
| `03-access-control-passwords` | Password selection and handling | 8.6, 16.3 |
| `03-access-control-logging` | Logging, audit policy, system monitoring | 8.8, 16.4–16.5 |
| `04-data` | Classified data, encryption, disposal, licensing | 9.1, 17.1, 17.3–17.9 |
| `04-data-backup` | Backup and recovery | 9.2, 17.2 |
| `05-application` | Development, change control, production data | 10, 18 |
| `06-network` | General network protection; classified transmission | 11.1, 19.1 |
| `06-network-internet-email` | Internet gateway, CIG, email, spam | 11.2–11.3, 19.2–19.3 |
| `06-network-malware-patch` | Malicious code; software and patch management | 11.4–11.5, 19.4–19.5 |
| `06-network-wireless-remote` | Wireless, mobile, RFID, Bluetooth, VPN, VoIP, external parties | 11.6, 19.6–19.8 |
| `07-risk-audit` | Security risk assessment and audit | 12, 20 |
| `08-incident` | Monitoring, response, reporting, escalation, aftermath | 13, 21 |
| `annexes` | Appendices A–D catalogue | Appendices |
| `annex-security-regulations` | Appendix A: SR extracts | App A |
| `annex-portable-devices` | Appendix B: portable electronic devices | App B |
| `annex-file-sharing` | Appendix C: file sharing / P2P | App C |
| `annex-copyright` | Appendix D: Copyright Ordinance and software | App D |

### Entities

| Slug | Name |
| --- | --- |
| `dso` | Departmental Security Officer |
| `ditso` | Division IT Security Officer (Division DITSO) |
| `itmu-security-team` | CSB ITMU Security Team |
| `information-system-owner` | Information System Owner |
| `isirt` | CSB Information Security Incident Response Team |
| `giro` | Government Information Security Incident Response Officer |
| `ogcio` | Office of the Government Chief Information Officer |
| `government-security-officer` | Government Security Officer (Security Bureau) |
| `tcd` | Technology Crime Division, HKPF Commercial Crime Bureau |

### Concepts

| Slug | Name |
| --- | --- |
| `information-security` | CIA triad; Information System; shall / should / may |
| `classified-information` | TOP SECRET / SECRET / CONFIDENTIAL / RESTRICTED |
| `least-privilege` | Need-to-know; minimum access |
| `segregation-of-duties` | Split of security functions; compensating logs |
| `password-management` | Selection, handling, Windows settings |
| `encryption` | Storage, transmission, keys |
| `disaster-recovery` | DRP vs BCP; off-site media |
| `outsourcing-security` | Third-party same duties; NDA; SLA; residual CSB ownership |
| `malware` | Virus, worm, Trojan, spyware; hoaxes |
| `patch-management` | Lifecycle; compensating controls |
| `wireless-security` | WLAN, mobile, RFID, Bluetooth |
| `incident-handling` | Detect, report, escalate, aftermath |
| `security-risk-assessment` | Two-year cycle; pre-change; follow-up |
| `copyright-compliance` | Licensed software; SAM; IPD / OGCIO circulars |

### Comparisons

| Slug | Content |
| --- | --- |
| `compare-roles` | DSO / Division DITSO / IS Owner / IT Staff / Users / ISIRT |
| `compare-shall-should-may` | Mandatory / good practice / desirable; [M] [A] [U] tags |
| `compare-policy-guidelines` | Part II policy statements vs Part III how-to |
| `compare-classification-controls` | Physical, crypto, email, wireless by classification |

## Operations

**Ingest.** Read the source (never edit it). Update the source summary, chapter hub, every reserved entity/concept the source materially changes, then `index.md` and `log.md`. One DITSP ingest can touch 15+ pages.

**Query.** Read `index.md` first, then only the needed pages. Cite wiki pages in the answer. File substantial answers under `queries/`.

**Lint.** Check orphans, broken `[[wikilinks]]`, index completeness, frontmatter, contested pages, pages over 200 lines, tags not in this taxonomy.

## Update policy

1. Later DITSP revisions generally supersede earlier text in the same section. This compilation is **v1.2 (July 2008)**. Treat product names, Windows 2000 settings, CCGO URLs, and OGCIO titles as a 2008 snapshot.
2. If two live clauses conflict (notably Part II vs Part III password age, and CIG-only vs CIG-or-departmental-gateway), keep both, date them, set `contested: true`, and list the other slug under `contradictions`.
3. Government-wide S17 / G3 / G51 / G54 and Security Regulations outrank departmental colour where they are stricter; DITSP cannot waive SR. Record the overlay rather than collapsing it.
4. Specimen diagrams (Figures 5.1, 21.1, 21.2) are images; describe the readable caption and roles, do not invent missing boxes.
5. Footnote bodies (`<sup>2</sup>` … `<sup>12</sup>`) are **not** in this conversion. Do not guess them.

## Source map (`MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md`)

Approximate 1-indexed line ranges:

| Block | Lines |
| --- | --- |
| Title / amendment history / TOC | 1–205 |
| Part I ss.1–5 | 207–354 |
| Part II intro + s.6 Management policy | 355–438 |
| s.7 Physical policy | 440–471 |
| s.8 Access-control policy | 473–558 |
| s.9 Data policy | 560–583 |
| s.10 Application policy | 584–611 |
| s.11 Network policy | 612–685 |
| s.12 Risk & audit policy | 687–702 |
| s.13 Incident policy | 704–729 |
| Part III intro + s.14 Management guidelines | 730–858 |
| s.15 Physical guidelines | 860–941 |
| s.16 Access-control guidelines | 944–1192 |
| s.17 Data guidelines | 1194–1400 |
| s.18 Application guidelines | 1402–1436 |
| s.19 Network guidelines | 1438–2183 |
| s.20 Risk & audit guidelines | 2185–2210 |
| s.21 Incident guidelines | 2212–2346 |
| Appendix A SR extracts | 2348–2576 |
| Appendix B portable devices | 2578–2664 |
| Appendix C file sharing | 2666–2690 |
| Appendix D copyright / software | 2692–2716 |

Known conversion defects: Figure 5.1 and Figures 21.1–21.2 are images; footnote bodies missing; title-page “HKSKAR”; HTML entities in tables; `<eq>` markers in the s.17.1 classification table; “Bureau Information,” stray comma in the ISIRT description (DITSP s.21.2).
