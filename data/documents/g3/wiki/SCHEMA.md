# Wiki Schema — IT Security Guidelines [G3]

## Domain

Hong Kong *IT Security Guidelines* [G3]: the government-wide implementation standard that elaborates Baseline IT Security Policy [S17]. Issued by the Digital Policy Office. The source is an English PDF conversion (MinerU) of **version 10.2 (April 2025)**. The wiki is the compiled, readable, interlinked form of that source.

G3 is **not** a volume of the Government Regulations. Security Regulations remain Volume 5. S17 remains the top-level mandatory policy. G3 sets the implementation standard B/Ds shall comply with; practice guides (Internet gateway, risk management, threat management, SRA & audit, incident handling, security by design, cloud, email, media destruction, mobile, data centre) sit under it. Departmental IT security policies (e.g. CSB DITSP) adapt G3 locally. This wiki does **not** wikilink into those other wikis.

## Conventions

- File names: lowercase English kebab-case, no spaces (`password-management.md`).
- Every wiki page starts with YAML frontmatter (below).
- Use `[[wikilinks]]` (Obsidian). Minimum **2 outbound links** per page.
- Link by slug only: `[[ditso]]`, `[[classified-protection]]`, `[[07-access-control]]`. Obsidian resolves across folders.
- Display text: `[[ditso|DITSO]]`.
- When updating a page, bump `updated`.
- Every new page must be listed in `index.md` under the correct section.
- Every action is appended to `log.md` as `## [YYYY-MM-DD] action | subject`.
- Cite the booklet as `G3 s.N`. On multi-source pages, append `^[MinerU_markdown_G3_EN_2090718479378567168.md]` after claims that need provenance.
- Reconstruct readable English. Never paste OCR-glued headings, HTML entities (`&#x27;`), or MinerU `<eq>` markers.
- If the source is unreadable at a critical point, write `(source unclear; verify against printed G3)` and keep the nearest section number.
- This wiki does **not** wikilink into the S17, DITSP, CSR, or SPR wikis. Point to those instruments by name in prose.

## Frontmatter

```yaml
---
title: English title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | chapter | source | query | synthesis
tags: []          # only tags from the taxonomy below
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 11.4, App C   # optional; section range or list
confidence: high | medium | low
contested: false
---
```

## Tag taxonomy

Add a tag here **before** using it on a page.

- Structure: `chapter`, `appendix`, `definition`
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
- **Don't create** a page for a CCGO URL, a product name (CMS, CMMP, WPA3), a practice-guide title, or a passing mention.
- **Split** when a page exceeds ~200 lines.
- Chapter hubs stay short; detail goes to concept/entity pages and the named splits.

## Reserved slugs

Do not invent competing slugs for these. Link to them.

### Chapters

| Slug | Topic | G3 |
| --- | --- | --- |
| `00-introduction` | Purpose, scope, ISO mapping, document stack, definitions | 1–4, 21 |
| `01-organisation` | Government ISMF and departmental roles | 5 |
| `02-principles` | Core security principles | 6 |
| `03-management` | Checks and balances; classified protection; risk framework | 7 |
| `04-policies` | Departmental IT security policy | 8 |
| `05-human-resource` | Employment lifecycle, training, integrity checking | 9 |
| `06-assets` | Inventory, classification, media, erasure | 10 |
| `07-access-control` | Least privilege, user access, identification | 11.1–11.2 |
| `07-access-control-passwords` | Password policy, selection, handling | 11.3–11.4 |
| `07-access-control-mobile` | Mobile computing, remote access, IoT | 11.5–11.6 |
| `08-cryptography` | Encryption and key management | 12 |
| `09-physical` | Secure areas and equipment | 13 |
| `10-operations` | Least functionality, change, malware, backup | 14.1–14.3, 14.5 |
| `10-operations-logging` | Log collection, retention, analysis | 14.4 |
| `10-operations-vulnerability` | Vulnerability, patch, authorised software, threat | 14.6–14.7 |
| `11-communications` | Network protection, inter-B/D, classified transmission | 15.1(a–c), 15.2(a) |
| `11-communications-wireless` | WLAN threats and controls | 15.1(d–g) |
| `11-communications-internet-email` | Internet, gateway, email, external parties | 15.1(h–j), 15.2(b–d) |
| `12-development` | Security by design, SDLC, test data | 16 |
| `13-outsourcing` | Contracts, residual ownership, cloud | 17 |
| `14-incident` | Monitoring, reporting clocks, response plan | 18 |
| `15-continuity` | BCP, DRP, resilience | 19 |
| `16-compliance` | Legal, IPR, SRA, audit, technical review | 20 |
| `annexes` | Appendices A–D catalogue | Appendices |
| `annex-end-user` | Appendix A: sample end-user instructions | App A |
| `annex-classification` | Appendix B: Tier 2 / Tier 3 assessment | App B |
| `annex-classified-protection` | Appendix C: extra controls for Tier 2 / 3 | App C |
| `annex-compliance-mechanism` | Appendix D: DPO monitoring and audit | App D |

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
| `least-privilege` | Minimum access and type of access |
| `segregation-of-duties` | Split of security functions; compensating logs |
| `password-management` | Strong password policy; selection; handling |
| `encryption` | Storage, transit, key lengths (AES/RSA/ECC/SM) |
| `malware` | Detection, recovery, content filtering |
| `patch-management` | Lifecycle; Internet-facing one-month fix |
| `vulnerability-management` | Identify, evaluate, mitigate, track |
| `wireless-security` | WLAN; WPA3; VPN overlay |
| `outsourcing-security` | Residual B/D ownership; no unsupervised production access |
| `incident-handling` | Detect, report (60 min / 48 h), respond, aftermath |
| `security-risk-assessment` | Two-year cycle; pre-change; on-site |
| `disaster-recovery` | BCP vs DRP; security continuity |
| `security-by-design` | Shift-left; SDLC; program cataloguing |

### Comparisons

| Slug | Content |
| --- | --- |
| `compare-roles` | ISMC / ITSWG / GIRO / GovCERT vs DITSO / DSO / ISIRT / Information Owner |
| `compare-shall-should-may` | Mandatory / best practice / desirable |
| `compare-tiers` | Tier 1 baseline vs Appendix C extras for Tier 2 / 3 |
| `compare-documents` | SR / S17 / G3 / practice guides / departmental policy |
| `compare-classification-controls` | Encryption, MFA, wireless, email path by SR grade |

## Operations

**Ingest.** Read the source (never edit it). Update the source summary, chapter hub, every reserved entity/concept the source materially changes, then `index.md` and `log.md`. One G3 ingest can touch 15+ pages.

**Query.** Read `index.md` first, then only the needed pages. Cite wiki pages in the answer. File substantial answers under `queries/`.

**Lint.** Check orphans, broken `[[wikilinks]]`, index completeness, frontmatter, contested pages, pages over 200 lines, tags not in this taxonomy.

## Update policy

1. Later G3 revisions generally supersede earlier text in the same section. This compilation is **v10.2 (April 2025)**. Treat product names (Lotus Notes mail in s.21, WPA3, CMS/CMMP) as a 2025 snapshot.
2. If two live clauses conflict, keep both, date them, set `contested: true`, and list the other slug under `contradictions`.
3. Government-wide S17 and Security Regulations outrank G3 colour where they are stricter; G3 cannot waive SR. Appendix C **adds** floors for Tier 2/3; it does not relax the body of G3. Record the overlay rather than collapsing it.
4. Specimen diagrams (SDLC chart, document-relationship diagram, government ISMF, departmental org chart) are images; describe the readable caption and roles, do not invent missing boxes.
5. Footnote bodies (`<sup>1</sup>` … `<sup>10</sup>`) are **not** in this conversion. Do not guess them.
6. General Circular No. 6/2024 overlays G3 on Specified IT Systems, PPIC incident reports, and additional pre-rollout tests. Cite the circular; do not reconstruct the circular’s full text.

## Source map (`MinerU_markdown_G3_EN_2090718479378567168.md`)

Approximate 1-indexed line ranges:

| Block | Lines |
| --- | --- |
| Title / amendment history / TOC | 1–254 |
| s.1 Purpose | 255–259 |
| s.2 Scope | 261–339 |
| s.3 Normative references | 341–355 |
| s.4 Definitions and conventions | 357–401 |
| s.5 Organisation | 403–671 |
| s.6 Core principles | 673–741 |
| s.7 Management responsibilities | 743–819 |
| s.8 IT security policies | 821–879 |
| s.9 Human resource security | 881–959 |
| s.10 Asset management | 961–1081 |
| s.11 Access control | 1083–1425 |
| s.12 Cryptography | 1427–1495 |
| s.13 Physical and environmental | 1497–1571 |
| s.14 Operations security | 1573–2081 |
| s.15 Communications security | 2083–2387 |
| s.16 System acquisition, development and maintenance | 2389–2657 |
| s.17 Outsourcing security | 2659–2727 |
| s.18 Security incident management | 2729–2851 |
| s.19 Business continuity | 2853–2885 |
| s.20 Compliance | 2887–2999 |
| s.21 Contact | 3001–3011 |
| Appendix A end-user instructions | 3013–3113 |
| Appendix B classification assessment | 3115–3141 |
| Appendix C classified protection table | 3143–3147 |
| Appendix D compliance monitoring | 3149–3167 |

Known conversion defects: s.8 heading printed without the number “8.”; definition of Tier 1 wraps as “Information A related set…”; HTML entities in tables; `<eq>` in the s.11.4(b) password table; Figures (SDLC, document stack, government ISMF, departmental org) are images; footnote bodies 1–10 missing; Lotus Notes still listed as a contact path in s.21.
