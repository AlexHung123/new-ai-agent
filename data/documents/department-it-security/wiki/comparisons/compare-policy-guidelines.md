---
title: Compare — policy vs guidelines
created: 2026-08-21
updated: 2026-08-21
type: comparison
tags: [comparison, policy, guideline]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 1, Part II intro, 6-13, Part III intro, 14-21
confidence: high
contested: false
---

# Compare — policy vs guidelines

DITSP is one booklet in three parts. Part I is overview ([[00-introduction]]). **Part II is the policy** — “the IT Security Policy that all users in CSB shall observe and follow” (s.1; Part II intro). **Part III is the guidelines** for deploying and enforcing that policy (s.1; Part III intro). Do not quote a guideline as if it repealed a shall.

Verb force and role tags: [[compare-shall-should-may]]. The overlay on SR / S17: [[synthesis]].

## Purpose, language, audience, organisation

| | Part II — policy (ss.6–13) | Part III — guidelines (ss.14–21) |
| --- | --- | --- |
| **Purpose** | Top-level directive statements. Set the **standards** of the security specification for CSB in **non-technical** language. State what must be protected (Part II intro). Adapted from S17 after a CSB security risk assessment. | How to **deploy and enforce** Part II. Developed with reference to G3, G50, G51, G54 (Part III intro). |
| **Language** | Mostly **shall**. Numbered policy statements with role tags. | Mostly **should** / narrative how-to. Tables, DOs/DON’Ts, product snapshots (Windows 2000, SMS, Symantec AV, CIG). |
| **Audience tags** | **[M] [A] [U]** on every statement. Tags are a finding aid. **All staff still read the whole of Part II.** | No [M]/[A]/[U] tags. Split by topic the same way as Part II, then by administrator vs user where needed (e.g. password handling s.16.3.2 vs s.16.3.3). |
| **Organisation** | Eight areas, ss.6–13. | **Identical** eight areas, ss.14–21, “so it can be easily followed” (Part III intro). |
| **Force if they clash** | The **shall** stands until a later DITSP revision or a higher instrument (SR, current S17) supersedes it. | A guideline cannot silently waive Part II. Where they disagree, keep both and mark the detail page `contested`. |

## The eight paired areas

| Area | Part II | Part III | Hub |
| --- | --- | --- | --- |
| Management responsibilities | s.6 | s.14 | [[01-management]], [[01-management-outsourcing]], [[01-management-contingency]] |
| Physical security | s.7 | s.15 | [[02-physical]] |
| Access control security | s.8 | s.16 | [[03-access-control]], [[03-access-control-passwords]], [[03-access-control-logging]] |
| Data security | s.9 | s.17 | [[04-data]], [[04-data-backup]] |
| Application security | s.10 | s.18 | [[05-application]] |
| Network & communication security | s.11 | s.19 | [[06-network]], [[06-network-internet-email]], [[06-network-malware-patch]], [[06-network-wireless-remote]] |
| Security risk assessment & auditing | s.12 | s.20 | [[07-risk-audit]] |
| Security incident management | s.13 | s.21 | [[08-incident]] |

System-specific policy (higher than the booklet) is written by the [[information-system-owner]] and approved by the [[ditso|Division DITSO]]; working-level procedures the Owner may endorse (s.14.1.1).

## Two live tensions — do not collapse

This compilation (v1.2, July 2008) has two places where Part II and Part III **disagree on the same control**. Both are marked `contested` on the detail pages. [[synthesis]] §4.

### 1. Password age (and complexity)

| Text | Rule |
| --- | --- |
| **s.8.6.1** (policy **shall**) | At least **8** characters, letters **and** numbers; change at least every **3 months**; do not re-use |
| **s.16.3.2** (end-user DO) | Change at least every **90 days** |
| **s.16.3.1** (selection DO) | Mix of mixed-case letters, numerals, **and special characters** |
| **s.16.3.4** (Windows 2000 table) | Maximum password age **135 days**; complexity **Disabled** |

See [[password-management]] (`contested: true`).

### 2. Internet path — CIG only vs CIG or departmental gateway

| Text | Rule |
| --- | --- |
| **s.11.2.1** (policy **shall**) | All Internet access from the CSB departmental network **shall** be made through the **Central Internet Gateway (CIG)** |
| **s.19.2.1** (guideline) | All Internet access from the departmental network **must** be made through the **departmental Internet gateway or** the Government CIG |

Do not pick a winner in this wiki. The chapter hub is [[06-network-internet-email]] (contested when that page is written). Direct dial-up to an ISP should not be established; simultaneous broadband + internal network is prohibited except with Division DITSO approval (s.19.2.1).

Everything else in the eight pairs is overlay, not contradiction: Part III supplies tables (classification s.17.1, off-site shuttle s.15.2.2, incident clocks s.21.4) that Part II only states as shalls.

## Related

[[compare-shall-should-may]] · [[password-management]] · [[06-network-internet-email]] · [[synthesis]]
