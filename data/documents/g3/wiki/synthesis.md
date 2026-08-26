---
title: Synthesis — what G3 is actually regulating
created: 2026-08-21
updated: 2026-08-21
type: synthesis
tags: [chapter]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
confidence: high
---

# Synthesis — what G3 is actually regulating

G3 is not a second Security Regulations and not a waiver of S17. It is the **government-wide implementation standard**: fourteen ISO-shaped control areas, a three-tier system classification, and a residual-ownership rule that survives outsourcing. The wiki’s job is to make that standard readable against SR, S17, General Circular 6/2024, and departmental overlays — not to replace them.

## 1. Four documents, not one

G3 s.2.3 puts Security Regulations, S17, G3, and practice guides in a stack, then requires each B/D to write its own departmental policy from that stack. S17 is “basic rules which shall be observed as mandatory”; G3 “sets the implementation standard” B/Ds shall comply with (s.2.3.2). ISO/IEC 27001:2022 and 27002:2022 are the shape of the fourteen areas, not a licence to drop SR. GB/T 22239-2019 and General Circular No. 6/2024 are normative references (s.3). A live decision that quotes only G3 is incomplete. See [[compare-documents]].

## 2. Two classification axes

**Data grade** (Security Regulations, via [[classified-information]]) still decides encryption at rest (RESTRICTED+), encryption in transit on un-trusted networks (CONFIDENTIAL/RESTRICTED), isolated wired LAN for anything higher than CONFIDENTIAL, MFA on CONFIDENTIAL+ systems, and whether wireless or CMS-family mail is allowed.

**System tier** ([[classified-protection]]) is the v10 overlay: every information system is Tier 1, 2, or 3 regardless of funding (s.7.2(b)). Classification is fixed at project initiation and endorsed by the Head of B/D or an explicitly delegated directorate officer. Appendix B is the impact worksheet. Appendix C is extra *shalls* for Tier 2/3 (24×7 monitoring and SIEM at Tier 3; annual SRA at Tier 3; privileged-account MFA and six-monthly independent checks at Tier 2). The body of G3 is not relaxed for ordinary systems. See [[compare-tiers]].

## 3. DITSO is a D3 post, not a technician

S17 requires a Departmental IT Security Officer. G3 s.5.2.1 makes that officer **D3 or above**, or the highest directorate if the B/D has none, and sends them to Security Bureau / DPO training. Shared user-IDs, shared passwords, privately owned kit on the internal network, simultaneous LAN-plus-external links, and strong-password exceptions all need explicit DITSO approval. The IT Security Management Unit reports to DITSO; the Information Security Steering Committee should too (and DITSO takes the committee’s job if none is set up). [[dso]] remains the Security-Regulations executive and may be the same person. Compare [[compare-roles]].

## 4. Residual ownership survives outsourcing and cloud

External providers “shall observe” departmental IT security policy (s.17.1(a)). They do **not** get access rights to production systems and data; if maintenance requires it, it is closely supervised. Remote day-to-day management of production by an external provider is strictly prohibited. “Although the development, implementation and/or maintenance of an information system can be outsourced, the overall responsibility of the information system remains under B/Ds” (s.17.1(a); repeated for cloud at s.17.3(a)). NDAs, SLAs, audit rights, data-location awareness, and certified erasure on exit sit in the contract. See [[outsourcing-security]].

## 5. Incident handling is a clock, not a narrative

On becoming aware of an incident, the departmental [[isirt|ISIRT]] reports to the [[giro|GIRO]] Standing Office **within 60 minutes by phone** and files the Preliminary Form **within 48 hours** (s.18.1(b)). Post-incident report within one week of resolution; otherwise first interim at 14 days, then every three months. Only the ISIRT Commander may authorise sharing of incident facts. General Circular 6/2024 adds a parallel track to the Director of Bureau (initial in two calendar days, full in seven) when the Director considers the incident has embarrassed the Government — PPIC for Specified IT Systems, DITSO otherwise. Drills at least every two years, preferably annually; two 7×24 contact points. See [[incident-handling]].

## 6. v10.2 is a 2025 snapshot sitting on GC 6/2024

Version 10.1 renamed OGCIO to DPO. Version 10.2 (April 2025) aligns organisation, development testing, incident reporting, SRA, and Appendices C–D with General Circular No. 6/2024; it also times system classification at project initiation, tightens remote-desktop software *inside* the internal network, and prefers network transfer over physical transport of backup media. Lotus Notes is still printed as a contact path next to CMMP (s.21). Footnote bodies 1–10 and four organisation/SDLC figures are images or missing — do not reconstruct them. For a live system, current S17, current SR, and the live circulars outrank any older departmental overlay (including CSB DITSP v1.2 from 2008).

## Worth asking next

- Current S17 clause numbers versus this G3 v10.2 implementation (S17 is not in this file).
- Whether a given system is Specified under GC 6/2024 (PPIC, extra independent tests).
- Live CMS / CMSG / MCMS / CMMP enrolment versus Internet mail.
- Departmental policy that adapts this G3 (this wiki does not ingest those).
- Practice-guide text behind the ITG InfoStation pointers (risk management, threat management, incident handling, security by design, cloud, pentest).

File those as query pages. Do not guess them into chapter hubs.
