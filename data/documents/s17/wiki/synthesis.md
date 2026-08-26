---
title: Synthesis — what S17 is actually regulating
created: 2026-08-22
updated: 2026-08-22
type: synthesis
tags: [chapter]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
confidence: high
---

# Synthesis — what S17 is actually regulating

S17 is not a second Security Regulations and not a substitute for G3. It is the **government-wide mandatory minimum**: fourteen ISO-shaped control areas, a three-tier system classification, and a residual-ownership rule that survives outsourcing. The wiki’s job is to make that floor readable against SR, G3, General Circular 6/2024, and departmental overlays — not to replace them, and not to import G3’s implementation colour.

## 1. Four documents, not one

S17 s.2.3 puts Security Regulations, S17, G3, and practice guides in a stack, then requires each B/D to write its own departmental policy from that stack. S17 is “a top-level directive statement that sets the **minimum standards** of a security specification for all B/Ds” — basic rules which **shall** be observed as mandatory, with other desirable measures still possible (s.2.3.2). G3 “elaborates on the policy requirements and sets the implementation standard.” ISO/IEC 27001:2022 and 27002:2022 are the shape of the fourteen areas, not a licence to drop SR. GB/T 22239-2019 and General Circular No. 6/2024 are normative references (s.3). A live decision that quotes only S17 is incomplete. See [[compare-documents]].

## 2. Two classification axes

**Data grade** (Security Regulations, via [[classified-information]]) still decides encryption at rest (all classified, s.10.2.2), encryption in transit on un-trusted networks (CONFIDENTIAL/RESTRICTED, s.15.2.2), isolated LAN for anything higher than CONFIDENTIAL (s.15.2.1), and whether classified email may leave a GSO-approved system (s.15.2.3).

**System tier** ([[classified-protection]]) is defined in S17 s.4.1: every information system is Tier 1, 2, or 3 regardless of funding (s.7.2.2). Assessment of **all** systems — including infrastructure facilities and departmental shared IT services — shall be documented and endorsed by the Head of B/D or an explicitly delegated directorate officer. S17 does not reprint G3 Appendix B/C/D; those extra *shalls* live in G3. See [[compare-tiers]].

## 3. DITSO is a D3 post, not a technician

S17 s.5.2.1 requires a Departmental IT Security Officer at **D3 or above**, or the highest directorate if the B/D has none, and sends them to Security Bureau / DPO training. Shared user-IDs, shared passwords, and privately owned kit on the internal network need explicit DITSO approval. The IT Security Management Unit **shall** report to DITSO; the Information Security Steering Committee **should** too (and DITSO takes the committee’s job if none is set up). [[dso]] remains the Security-Regulations executive and may be the same person. Compare [[compare-roles]].

## 4. Residual ownership survives outsourcing and cloud

External providers “shall observe and comply with B/Ds’ departmental IT security policy and other information security requirements issued by the Government” (s.17.1.1). B/Ds shall identify and assess risks, document security measures and service levels, keep audit rights (or receive periodic security-audit reports), and ensure government data is cleared or destroyed on exit (ss.17.1–17.2). **Information classified as RESTRICTED or above shall not be stored in or processed by public cloud services** (s.17.3.1). Shared cloud responsibilities shall be defined before signing (s.17.3.2). See [[outsourcing-security]].

## 5. Incident handling is immediate reporting, not a printed clock

Any observed or suspected security incident **shall** be reported **immediately** to the responsible party and handled according to the incident-handling procedure (s.18.1.5). B/Ds shall have a detection/monitoring mechanism, retain logs for proof and tracing, and establish, document, test, and maintain a security incident response plan that staff shall follow (ss.18.1.1–18.1.4). Staff shall not disclose who was hit or how, except to handlers, system-security staff, or authorised investigators (s.18.1.6). S17 does **not** print G3’s 60-minute GIRO phone / 48-hour form. See [[incident-handling]].

## 6. v8.2 is a 2025 snapshot sitting on GC 6/2024

Version 8.1 renamed OGCIO to DPO. Version 8.2 (April 2025) aligns ss.5.2 and 20.2 with General Circular No. 6/2024 and makes editorial changes. Lotus Notes is still printed as a contact path next to CMMP (s.21). Three organisation/document figures are images; two footnote bodies are missing — do not reconstruct them. For a live system, current G3, current SR, and the live circulars outrank any older departmental overlay.

## Worth asking next

- Current G3 v10.2 implementation of each S17 *shall* (G3 is not in this file).
- Whether a given system is Specified under GC 6/2024 (PPIC, extra independent tests).
- Live CMS / CMSG / MCMS / CMMP enrolment versus Internet mail (S17 only requires a GSO-approved system).
- Departmental policy that adapts this S17 (this wiki does not ingest those).
- Practice-guide text behind the ITG InfoStation pointers.

File those as query pages. Do not guess them into chapter hubs.
