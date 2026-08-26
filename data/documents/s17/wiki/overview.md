---
title: Overview — Baseline IT Security Policy [S17] wiki
created: 2026-08-22
updated: 2026-08-22
type: synthesis
tags: [chapter]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
confidence: high
---

# Overview — Baseline IT Security Policy [S17] wiki

This is the compiled wiki of the Digital Policy Office *Baseline IT Security Policy* [S17], version 8.2 (April 2025). The raw file is `MinerU_markdown_S17_EN_2090718517630623744.md` (English PDF conversion, ~998 lines). You read the wiki; the agent writes it. For any question, start at [[index]], then open only the pages you need.

## One control stack

```
Security Regulations (Vol. 5)
        → Baseline IT Security Policy [S17]     (mandatory minimum)
        → IT Security Guidelines [G3]           (implementation standard)
        → Practice guides (ITG InfoStation)
        → Departmental IT security policy
        → system-specific procedures ([[information-owner]])
```

B/Ds shall comply with the policy requirements in the Security Regulations (SR), S17, and G3, and follow the implementation guidance in the relevant practice guides (S17 s.2.3). Compare [[compare-documents]].

S17 is the **top-level directive**: “basic rules which shall be observed as mandatory while there can still be other desirable measures to enhance security” (S17 s.2.3.2). It is technology-neutral. B/Ds shall apply **enhanced** measures commensurate with the determined risks (S17 s.2.1).

The fork that decides extra system controls is **[[classified-protection|system tier]]** (Tier 1 / 2 / 3). The fork that decides encryption at rest, isolated LAN, and email path is **[[classified-information|data classification]]** under Security Regulations. See [[compare-tiers]] and [[compare-classification-controls]].

## Who does what

| Actor | Role |
| --- | --- |
| [[ismc\|ISMC]] | Government-wide oversight of IT security policy (since Apr 2000) |
| [[itswg\|ITSWG]] | Executive arm: promulgate, **monitor S17 compliance**, awareness |
| [[giro\|GIRO]] | Central incident inventory and multi-point coordination |
| [[govcert\|GovCERT.HK]] | Alerts, HKCERT bridge (since Apr 2015) |
| [[dpo\|DPO]] | Issues S17 / G3 / practice guides; core member of the three bodies above |
| [[security-bureau\|Security Bureau]] | Security Regulations; co-trains DITSOs; GSO approvals |
| Head of B/D | Appoints [[ditso\|DITSO]]; endorses system classifications |
| [[ditso\|DITSO]] | D3 (or highest directorate); departmental IT-security executive |
| [[dso\|DSO]] | All aspects of departmental security; may also be DITSO |
| [[isirt\|ISIRT]] Commander | Focal point for incidents; senior management |
| IT Security Management Unit | Reports to DITSO; day-to-day programme (**shall** establish) |
| [[information-owner\|Information Owner]] | Classification, authorised use, protection requirements |
| Users / vendors / contractors | In the target audience; accountable for their IDs |

Compare [[compare-roles]] and [[compare-shall-should-may]].

## Three structural facts

1. **S17 is the what, mapped to ISO 27001/27002:2022.** Fourteen control areas (ss.7–20) cover the same shape as G3. G3 elaborates the *how*. Practice guides add emerging-tech colour. Departmental policy adapts, it does not waive. See [[02-principles]] and [[compare-documents]].
2. **Tiered systems plus SR grades.** Every information system is Tier 1, 2, or 3 regardless of funding (S17 s.7.2.2). S17 defines the three tiers (s.4.1) and requires Head of B/D (or delegated directorate) endorsement. Extra *how* for Tier 2/3 lives in G3, not in this file.
3. **Residual ownership never leaves the B/D.** External providers shall observe departmental IT security policy (S17 s.17.1.1). Public cloud shall not store or process information classified RESTRICTED or above (S17 s.17.3.1). See [[outsourcing-security]].

## How to use this wiki

- Ask “who approves / who is accountable?” → [[compare-roles]], then the chapter hub.
- Ask “is this mandatory?” → [[compare-shall-should-may]], then the S17 “shall”. G3 may add implementation floors; those are not in this wiki.
- Ask “how do I protect this data / this system?” → [[classified-information]] and [[classified-protection]].
- Ask “what if something breaks?” → [[14-incident]], [[incident-handling]] (report **immediately**; S17 does not print a 60-minute clock).
- This compilation is **April 2025 (v8.2)**. GC 6/2024 overlays ss.5.2 and 20.2. Product names (Lotus Notes contact path, CMMP) are a 2025 snapshot.
- Sentences marked “verify against printed S17” are not settled rules.

Deeper judgement: [[synthesis]]. Source map: [[s17]].
