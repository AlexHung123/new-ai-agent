# Wiki Schema — Baseline IT Security Policy [S17]

## Domain

Hong Kong *Baseline IT Security Policy* [S17]: the government-wide **top-level mandatory** IT security specification for all bureaux and departments. Issued by the Digital Policy Office. The source is an English PDF conversion (MinerU) of **version 8.2 (April 2025)**. The wiki is the compiled, readable, interlinked form of that source.

S17 is **not** a volume of the Government Regulations. Security Regulations remain Volume 5. S17 sets the mandatory minimum; IT Security Guidelines [G3] set the implementation standard B/Ds shall comply with; practice guides sit under G3; departmental IT security policies adapt the stack locally. This wiki does **not** wikilink into those other wikis, and it does **not** import G3-only clocks, Appendix C extras, or product tables.

## Conventions

- File names: lowercase English kebab-case, no spaces (`password-management.md`).
- Every wiki page starts with YAML frontmatter (below).
- Use `[[wikilinks]]` (Obsidian). Minimum **2 outbound links** per page.
- Link by slug only: `[[ditso]]`, `[[classified-protection]]`, `[[07-access-control]]`. Obsidian resolves across folders.
- Display text: `[[ditso|DITSO]]`.
- When updating a page, bump `updated`.
- Every new page must be listed in `index.md` under the correct section.
- Every action is appended to `log.md` as `## [YYYY-MM-DD] action | subject`.
- Cite the booklet as `S17 s.N`. On multi-source pages, append `^[MinerU_markdown_S17_EN_2090718517630623744.md]` after claims that need provenance.
- Reconstruct readable English. Never paste OCR-glued headings or MinerU image placeholders.
- If the source is unreadable at a critical point, write `(source unclear; verify against printed S17)` and keep the nearest section number.
- This wiki does **not** wikilink into the G3, DITSP, CSR, SPR, or RMM wikis. Point to those instruments by name in prose.

## Frontmatter

```yaml
---
title: English title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | chapter | source | query | synthesis
tags: []          # only tags from the taxonomy below
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 11.2, 15.2   # optional; section range or list
confidence: high | medium | low
contested: false
---
```

## Tag taxonomy

Add a tag here **before** using it on a page.

- Structure: `chapter`, `definition`
- People / orgs: `authority`, `role`, `department`, `committee`
- Policy: `policy`, `guideline`, `classification`, `cia`, `iso`, `principle`
- Controls: `access-control`, `password`, `logging`, `encryption`, `physical`, `least-privilege`
- Operations: `backup`, `patch`, `malware`, `vulnerability`, `threat`, `change`
- Network: `network`, `internet`, `email`, `wireless`, `remote`, `iot`
- Delivery: `outsourcing`, `cloud`, `development`, `security-by-design`
- Assurance: `risk-assessment`, `audit`, `incident`, `continuity`, `compliance`
- Meta: `comparison`, `procedure`

## Page thresholds

- **Create** a page when a term is a named office/committee (DITSO, ISMC, GIRO), a defined control family, a system tier, or a section-level topic.
- **Don't create** a page for a CCGO URL, a product name (Lotus Notes, CMMP), a practice-guide title, or a passing mention.
- **Split** when a page exceeds ~200 lines.
- Chapter hubs stay short; detail goes to concept/entity pages. S17 is compact: do **not** split access control, operations, or communications unless a later ingest actually overflows.

## Reserved slugs

Do not invent competing slugs for these. Link to them.

### Chapters

| Slug | Topic | S17 |
| --- | --- | --- |
| `00-introduction` | Purpose, scope, ISO mapping, document stack, definitions | 1–4, 21 |
| `01-organisation` | Government ISMF and departmental roles | 5 |
| `02-principles` | Core security principles | 6 |
| `03-management` | Checks and balances; classified protection | 7 |
| `04-policies` | Departmental IT security policy | 8 |
| `05-human-resource` | Employment lifecycle, training, integrity checking | 9 |
| `06-assets` | Inventory, classification, media, erasure | 10 |
| `07-access-control` | Least privilege, user access, passwords, mobile, IoT | 11 |
| `08-cryptography` | Cryptographic key lifecycle | 12 |
| `09-physical` | Secure areas and equipment | 13 |
| `10-operations` | Least functionality, malware, backup, logging, vulnerability, threat | 14 |
| `11-communications` | Network protection, wireless, Internet, classified transmission | 15 |
| `12-development` | Security in SDLC, test data | 16 |
| `13-outsourcing` | External providers, residual ownership, cloud | 17 |
| `14-incident` | Detection, response plan, reporting, non-disclosure | 18 |
| `15-continuity` | Disaster recovery and resilience | 19 |
| `16-compliance` | Legal, PDPO, SRA, audit | 20 |

### Entities

| Slug | Name |
| --- | --- |
| `dpo` | Digital Policy Office |
| `ismc` | Information Security Management Committee |
| `itswg` | IT Security Working Group |
| `giro` | Government Information Security Incident Response Office |
| `govcert` | GovCERT.HK |
| `ditso` | Departmental IT Security Officer |
| `dso` | Departmental Security Officer |
| `isirt` | Departmental Information Security Incident Response Team |
| `information-owner` | Information Owner |
| `security-bureau` | Security Bureau |

### Concepts

| Slug | Name |
| --- | --- |
| `information-security` | CIA triad; shall / should / may; ISO 27001/27002 overlay |
| `classified-information` | SR categories; encryption at rest and in transit |
| `classified-protection` | Tier 1 / 2 / 3 information systems |
| `least-privilege` | Minimum access when assigning resources and privileges |
| `segregation-of-duties` | Split of security functions; Security vs System Administrator |
| `password-management` | Strict password policy; sharing; encryption in transit |
| `encryption` | Storage, transit, key lifecycle |
| `malware` | Anti-malware on LAN, PCs, mobile, remote; user duties |
| `patch-management` | Risk-based schedule; Internet-facing stringent |
| `vulnerability-management` | Identify, evaluate, mitigate, track |
| `wireless-security` | Document, monitor, control; authentication and encryption |
| `outsourcing-security` | Provider compliance; audit rights; public-cloud floor |
| `incident-handling` | Detect, report immediately, plan, non-disclosure |
| `security-risk-assessment` | Two-year cycle; pre-rollout; PIA |
| `disaster-recovery` | DR plans with security measures; resilience |
| `security-by-design` | Security throughout SDLC |

### Comparisons

| Slug | Content |
| --- | --- |
| `compare-roles` | ISMC / ITSWG / GIRO / GovCERT vs DITSO / DSO / ISIRT / Information Owner |
| `compare-shall-should-may` | Mandatory / best practice / desirable |
| `compare-tiers` | Tier 1 vs 2 vs 3 as S17 defines them |
| `compare-documents` | SR / S17 / G3 / practice guides / departmental policy |
| `compare-classification-controls` | Encryption, wireless, email path by SR grade as S17 states them |

## Operations

**Ingest.** Read the source (never edit it). Update the source summary, chapter hub, every reserved entity/concept the source materially changes, then `index.md` and `log.md`. One S17 ingest can touch 15+ pages.

**Query.** Read `index.md` first, then only the needed pages. Cite wiki pages in the answer. File substantial answers under `queries/`.

**Lint.** Check orphans, broken `[[wikilinks]]`, index completeness, frontmatter, contested pages, pages over 200 lines, tags not in this taxonomy.

## Update policy

1. Later S17 revisions generally supersede earlier text in the same section. This compilation is **v8.2 (April 2025)**. Treat product names (Lotus Notes mail in s.21, CMMP) as a 2025 snapshot.
2. If two live clauses conflict, keep both, date them, set `contested: true`, and list the other slug under `contradictions`.
3. Security Regulations outrank S17 colour where they are stricter; S17 cannot waive SR. G3 elaborates S17 and cannot waive S17. Record the overlay rather than collapsing it. Do **not** copy G3 Appendix C, password tables, or the 60-minute GIRO clock into this wiki.
4. Specimen diagrams (document-relationship diagram, government ISMF, departmental org chart) are images; describe the readable caption and roles, do not invent missing boxes.
5. Footnote bodies (caption footnote on the departmental org chart; “mode of use” footnote at s.15.1.9) are **not** in this conversion. Do not guess them.
6. General Circular No. 6/2024 is a normative reference and overlays ss.5.2 and 20.2 per the v8.2 amendment note. Cite the circular; do not reconstruct the circular’s full text.

## Source map (`MinerU_markdown_S17_EN_2090718517630623744.md`)

Approximate 1-indexed line ranges:

| Block | Lines |
| --- | --- |
| Title / amendment history / TOC | 1–112 |
| s.1 Purpose | 114–129 |
| s.2 Scope | 131–203 |
| s.3 Normative references | 205–217 |
| s.4 Definitions and conventions | 219–263 |
| s.5 Organisation | 265–535 |
| s.6 Core principles | 537–575 |
| s.7 Management responsibilities | 577–596 |
| s.8 IT security policies | 598–609 |
| s.9 Human resource security | 611–633 |
| s.10 Asset management | 635–662 |
| s.11 Access control | 663–724 |
| s.12 Cryptography | 726–731 |
| s.13 Physical and environmental | 733–764 |
| s.14 Operations security | 765–841 |
| s.15 Communications security | 843–886 |
| s.16 System acquisition, development and maintenance | 887–911 |
| s.17 Outsourcing security | 913–935 |
| s.18 Security incident management | 937–955 |
| s.19 Business continuity | 956–965 |
| s.20 Compliance | 967–987 |
| s.21 Contact | 989–998 |

Known conversion defects: s.5 heading printed without the number “5.”; s.9 heading printed without the number “9.”; definition of Tier 1 wraps as “Tier 1 Information A related set… Systems”; Figures (document stack, government ISMF, departmental org) are images; footnote bodies missing (org-chart footnote 1; s.15.1.9 “mode of use” footnote 2); Lotus Notes still listed as a contact path in s.21.
