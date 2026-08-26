---
title: Overview — CSB Departmental IT Security Policy wiki
created: 2026-08-21
updated: 2026-08-21
type: synthesis
tags: [chapter]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
confidence: high
---

# Overview — CSB Departmental IT Security Policy wiki

This is the compiled wiki of CSB’s *Departmental IT Security Policy and Guidelines*, version 1.2 (July 2008). The raw file is `MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md` (English PDF conversion, ~2,716 lines). You read the wiki; the agent writes it. For any question, start at [[index]], then open only the pages you need.

## One control stack

```
Security Regulations (Vol. 5) + S17 / G3 / G51 / G54
        → CSB Information Security Management Framework
        → DITSP Part II policy  → Part III guidelines
        → system-specific policy and procedures ([[information-system-owner]])
```

The fork that decides almost everything is **[[classified-information|classification]]**. Physical rooms, encryption, email path, wireless, and audit trail all branch on TOP SECRET / SECRET / CONFIDENTIAL / RESTRICTED. See [[compare-classification-controls]].

## Who does what

| Actor | Role |
| --- | --- |
| [[dso|Departmental Security Officer]] | Overall security executive; endorses DITSP; serious-incident lead |
| [[ditso|Division DITSO]] | One per CSB division site; policy lead; two-year SRA/audit; most day-to-day approvals |
| [[itmu-security-team]] | Central technical advice; urgent safeguards with DITSO / DSO |
| [[information-system-owner]] | Classification, system policy/procedures, residual ownership even if outsourced |
| IT Staff | Implement and operate the safeguards |
| Users | Accountable for their IDs; prevent unauthorised access |
| [[isirt]] | Focal point for incidents (DSO + ITMU + three Division ISIRTs) |
| [[giro]] | Government-wide incident recording / coordination |
| [[ogcio]] | S17, G3, G50, G51, G54, CIG, CMS technical endorsement |
| [[government-security-officer]] | Isolated LAN / CMS approval; physical standards |

Role tags on policy statements: **[M]** management, **[A]** administrator, **[U]** user. All CSB staff must still read the whole of Part II (DITSP Part II intro). Compare [[compare-roles]] and [[compare-shall-should-may]].

## Three structural facts

1. **Part II is “shall”; Part III is “how”. ** Eight areas are paired (ss.6–13 ↔ ss.14–21). Policy is the standard; guidelines deploy it. See [[compare-policy-guidelines]].
2. **The CSB departmental network is un-trusted.** It is a general-purpose LAN, so CONFIDENTIAL / RESTRICTED in transit must be encrypted (DITSP s.19.1.2). TOP SECRET / SECRET may move only encrypted **inside an isolated LAN** approved by the [[government-security-officer]] with [[ogcio]] technical endorsement.
3. **Outsourcing does not move residual ownership.** Third parties have the same security duties as staff; CSB keeps overall responsibility (DITSP s.14.2). See [[outsourcing-security]].

## How to use this wiki

- Ask “who approves / who is accountable?” → [[compare-roles]], then the chapter hub.
- Ask “is this mandatory?” → [[compare-shall-should-may]], then the Part II statement.
- Ask “how do I protect this data?” → [[classified-information]], [[compare-classification-controls]].
- Ask “what if something breaks?” → [[08-incident]], [[incident-handling]].
- This compilation is **July 2008**. Product names (Windows 2000, Symantec AV, SMS, Lotus Notes, CIG) and CCGO URLs are historical. For a live system, use current OGCIO / Digital Policy Office and Security Bureau texts — not this wiki.
- Sentences marked “verify against printed DITSP” are not settled rules.

Deeper judgement: [[synthesis]]. Source map: [[ditsp]].
