---
title: Overview — IT Security Guidelines [G3] wiki
created: 2026-08-21
updated: 2026-08-21
type: synthesis
tags: [chapter]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
confidence: high
---

# Overview — IT Security Guidelines [G3] wiki

This is the compiled wiki of the Digital Policy Office *IT Security Guidelines* [G3], version 10.2 (April 2025). The raw file is `MinerU_markdown_G3_EN_2090718479378567168.md` (English PDF conversion, ~3,167 lines). You read the wiki; the agent writes it. For any question, start at [[index]], then open only the pages you need.

## One control stack

```
Security Regulations (Vol. 5)
        → Baseline IT Security Policy [S17]     (what is mandatory)
        → IT Security Guidelines [G3]           (implementation standard)
        → Practice guides (ITG InfoStation)
        → Departmental IT security policy
        → system-specific procedures ([[information-owner]])
```

B/Ds shall comply with SR, S17, and G3 (G3 s.2.3). They may customise measures without lowering the security level (G3 s.1). Compare [[compare-documents]].

The fork that decides extra controls is **[[classified-protection|system tier]]** (Tier 1 / 2 / 3). The fork that decides encryption, MFA, wireless, and email path is **[[classified-information|data classification]]** under Security Regulations. See [[compare-tiers]] and [[compare-classification-controls]].

## Who does what

| Actor | Role |
| --- | --- |
| [[ismc\|ISMC]] | Government-wide oversight of IT security policy (since Apr 2000) |
| [[itswg\|ITSWG]] | Executive arm: promulgate, monitor S17 compliance, awareness |
| [[giro\|GIRO]] | Central incident inventory and multi-point coordination |
| [[govcert\|GovCERT.HK]] | Alerts, HKCERT bridge, threat intel, scanning facilities |
| [[dpo\|DPO]] | Issues S17 / G3 / practice guides; core member of the three bodies above |
| [[security-bureau\|Security Bureau]] | Security Regulations; co-trains DITSOs; GSO approvals |
| Head of B/D | Appoints [[ditso\|DITSO]]; endorses system classifications |
| [[ditso\|DITSO]] | D3 (or highest directorate); departmental IT-security executive |
| [[dso\|DSO]] | All aspects of departmental security; may also be DITSO |
| [[isirt\|ISIRT]] Commander | Focal point for incidents; only authority to share incident facts |
| IT Security Management Unit | Reports to DITSO; day-to-day programme |
| [[information-owner\|Information Owner]] | Classification, authorised use, protection requirements |
| Users / vendors / contractors | In the target audience; accountable for their IDs |

Compare [[compare-roles]] and [[compare-shall-should-may]].

## Three structural facts

1. **G3 is the how of S17, mapped to ISO 27001/27002:2022.** Fourteen control areas (ss.7–20) cover the SDLC. Practice guides add emerging-tech colour. Departmental policy adapts, it does not waive. See [[02-principles]] and [[compare-documents]].
2. **Tiered systems plus SR grades.** Every information system is Tier 1, 2, or 3 regardless of funding. The body of G3 is the Tier 1 floor; [[annex-classified-protection|Appendix C]] adds shalls for Tier 2/3. Data grade (RESTRICTED and above) still drives encryption, MFA, wireless, and mail path.
3. **Residual ownership never leaves the B/D.** Outsourcing and cloud split tasks, not accountability (G3 s.17). External providers do not get unsupervised or remote day-to-day production access. See [[outsourcing-security]].

## How to use this wiki

- Ask “who approves / who is accountable?” → [[compare-roles]], then the chapter hub.
- Ask “is this mandatory?” → [[compare-shall-should-may]], then the G3 “shall”. Appendix C may raise a should to a shall for Tier 2/3.
- Ask “how do I protect this data / this system?” → [[classified-information]] and [[classified-protection]].
- Ask “what if something breaks?” → [[14-incident]], [[incident-handling]] (60-minute phone to GIRO).
- This compilation is **April 2025 (v10.2)**. GC 6/2024 (Specified IT Systems, PPIC reports) overlays several clauses. Product names (CMS, CMMP, WPA3, Lotus Notes contact path) are a 2025 snapshot.
- Sentences marked “verify against printed G3” are not settled rules.

Deeper judgement: [[synthesis]]. Source map: [[g3]].
