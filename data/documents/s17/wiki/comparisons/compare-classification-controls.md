---
title: Compare — classification controls
created: 2026-08-22
updated: 2026-08-22
type: comparison
tags: [comparison, classification, encryption]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 9.1, 10.2, 11.1, 11.6, 15.1-15.2, 17.3, 20.1
confidence: high
contested: false
---

# Compare — classification controls

S17 defers the **categories** of classified information to Security Regulations; it does **not** reprint the four grades or their damage tests. S17 names **RESTRICTED**, **CONFIDENTIAL**, **higher than CONFIDENTIAL**, and **RESTRICTED or above**. Data grade (this page) is a different fork from **system tier** ([[compare-tiers]]). Narrative: [[classified-information]], [[encryption]], [[wireless-security]].

Personal data **should** be classified RESTRICTED or above (S17 s.20.1.4). Integrity checking: civil servants accessing classified **higher than RESTRICTED shall** undergo an integrity check stipulated by the Secretary for the Civil Service (S17 s.9.1.4).

S17 does **not** print G3’s MFA-for-CONFIDENTIAL *shall*, key-length table, WPA3 language, or CMS-family mail names. Those cells are left blank on purpose.

## Control table as S17 states it

| Control | Higher than CONFIDENTIAL | CONFIDENTIAL | RESTRICTED | Unclassified |
| --- | --- | --- | --- | --- |
| **Stored encryption** | **Shall** encrypt **all classified** information in storage, irrespective of media (s.10.2.2). | Same *shall* (classified). | Same *shall* (classified). | Protect from unintentional disclosure (s.20.1.3 *should*). No at-rest encryption *shall*. |
| **Transit** | Transmit **only when encrypted and inside an isolated LAN** approved by the Government Security Officer ([[security-bureau]]) with [[dpo\|DPO]] technical endorsement (s.15.2.1). | **Should** encrypt on any network; **shall** encrypt on an **un-trusted** network (s.15.2.2). | Same *should* / un-trusted *shall* as CONFIDENTIAL. | Not an SR-grade *shall*. External systems assumed insecure (s.6). |
| **Wireless** | No grade-by-grade table in S17. Wireless connected to the government internal network **shall** be documented, monitored, and controlled, with authentication and encryption (ss.15.1.7–15.1.8). Wireless without protection is the s.6 example of classified-in-transit risk. | Same. | Same. | Same network *shalls* if connected to the internal net. |
| **Email** | Classified email **shall** travel only on an information system **approved by the Government Security Officer** subject to DPO technical endorsement (s.15.2.3). S17 does not name the product. | Same GSO-approved-system rule for classified email. | Same. | Recording, retention, and destruction of email messages and logs (s.15.2.4); protect internal address lists (s.15.2.5). |
| **Public cloud** | RESTRICTED **or above shall not** be stored in or processed by public cloud services (s.17.3.1). | Same prohibition. | Same prohibition. | Public cloud not prohibited by this clause; shared-responsibility agreement still *shall* before signing (s.17.3.2). |
| **Privately-owned IoT** | Classified information **shall not** be stored or processed in privately-owned IoT devices (s.11.6.2). | Same. | Same. | IoT security still commensurate with classification (s.11.6.1); mobile requirements apply unless not technically feasible. |
| **Authentication** | Access to classified without appropriate authentication **shall not** be allowed; logical access control on systems containing classified (ss.11.1.3–11.1.4). Authentication commensurate with sensitivity (s.11.4.1). **No MFA *shall* by grade in S17.** | Same. | Same. | Authentication commensurate with sensitivity (s.11.4.1). |

Need-to-know applies to **all classified** (s.9.1.8). Display screens showing classified shall be positioned so unauthorised persons cannot readily view them (s.13.2.5).

## Related

[[classified-information]] · [[encryption]] · [[wireless-security]] · [[security-bureau]] · [[ditso]] · [[compare-tiers]] · [[08-cryptography]] · [[11-communications]]
