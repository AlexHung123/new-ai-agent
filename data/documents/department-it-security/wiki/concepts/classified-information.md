---
title: Classified information
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [classification, policy]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 4.1, 7.1.4, 9.1, 11.1.9-11.1.10, 17.1, 19.1.2, App A, App B
confidence: high
contested: false
---

# Classified information

Classified information is whatever Security Regulations Chapter III grades (DITSP s.4.1(f)). Four categories, in descending order of damage if disclosed (SR 160–161; [[annex-security-regulations]]):

| Grade | Unauthorised disclosure would |
| --- | --- |
| **TOP SECRET** | Cause **exceptionally grave damage** to HKSAR or the CPG. |
| **SECRET** | Cause **serious injury** to those interests. |
| **CONFIDENTIAL** | Be **prejudicial** to those interests. |
| **RESTRICTED** | Be **undesirable** in the interests of HKSAR. |

RESTRICTED has suffixed forms (ADMIN, APPOINTMENT, MEDICAL, STAFF, TENDER, CONTRACT) (SR 161). Electronic messages, data, and documents take the **same grade as the paper equivalent** and are protected accordingly (DITSP s.17.1). Intermediate material produced while processing is treated the same way.

CSB is responsible for understanding and following SR **Chapter IX** (processing, storage, transmission, destruction) — DITSP summarises it; it does not waive it (s.9.1.5, s.17.1). The control table that actually drives encryption, email, rooms, and wireless is [[compare-classification-controls]].

## Handling table (s.17.1)

DITSP s.17.1 restates Chapter IX as a matrix. Headlines:

- **Storage encryption:** mandatory at CONFIDENTIAL and above; recommended at RESTRICTED (s.9.1.4; s.17.1).
- **Shared access:** prohibited unless authorised at SECRET/TOP SECRET and CONFIDENTIAL; allowed at RESTRICTED. Shared-access tracking (audit trail and logical access control software) is mandatory at CONFIDENTIAL+ (s.8.1.4; s.17.1).
- **Transit:** TOP SECRET/SECRET only encrypted **inside an isolated LAN** approved by the [[government-security-officer]] with [[ogcio]] technical endorsement. CONFIDENTIAL/RESTRICTED **shall** be encrypted on an un-trusted network (s.11.1.9–11.1.10).
- **Email:** CONFIDENTIAL on the Confidential Mail System; RESTRICTED on GCN with encryption enabled or a PKI-encrypted system; TOP SECRET/SECRET on a GSO-approved system that also meets the isolated-LAN rule (s.11.3.5, s.17.1).
- **Rooms:** Level III for TOP SECRET/SECRET; Level II for CONFIDENTIAL; locked room or cabinet for RESTRICTED (s.7.1.4, s.17.1). Footnote bodies for the Level II/III standards are missing from this conversion — cite SR / Security Bureau, do not reconstruct them.

Processing must be on an Information System that complies with SR 356 (TOP SECRET/SECRET), SR 363 (CONFIDENTIAL), or SR 367 (RESTRICTED).

## The CSB departmental network is un-trusted

A trusted network is physically secured, protected from tampering, and run under a defined configuration policy (s.19.1.2, citing SR Chapter IX FAQ). Everything else is un-trusted: general-purpose LAN, Internet, leased line, public telecom, dial-up, third-party-managed, wireless, Metro Ethernet.

**The CSB departmental network is un-trusted** because it is a general-purpose LAN for daily use (s.19.1.2). So CONFIDENTIAL and RESTRICTED moving on it must be encrypted. TOP SECRET/SECRET may not leave an isolated LAN at all. See [[encryption]] and [[06-network]].

## Portable devices (Appendix B)

When notebooks or removable media hold classified information, Appendix B applies (s.17.1; v1.1 addition). Headline duties: classify first; inventory; CSB-issued kit only (not a personal device); authorise each store; keep the minimum; delete when finished; supervise in use and lock to the grade when not; authenticate; **encrypt**. Detail: [[annex-portable-devices]].

Business partners, contractors, and outsourced staff shall be advised to comply with SR when they transmit, process, or store Government data (s.17.1). [[information-system-owner|IS Owners]] set the grade for their systems (s.5.4). Staff handling classified systems shall undergo an integrity check under CSB Circular 17/94, with the type of checking (Appointment / Normal / Extended) matching the sensitivity (s.6.1.15).

Users given access to classified information on Information Systems should be alerted to the type(s) they are accessing (SR 373). The Subject field of a classified email must include the classification (SR 374). Removable media must carry conspicuous classification markings (SR 375).

## Related

[[compare-classification-controls]] · [[annex-security-regulations]] · [[annex-portable-devices]] · [[encryption]] · [[04-data]]
