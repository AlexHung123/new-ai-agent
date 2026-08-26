---
title: Classified information
created: 2026-08-22
updated: 2026-08-22
type: concept
tags: [classification, encryption, policy]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 4.1, 9.1.4, 9.1.8, 10.2, 10.3, 11.1, 15.2, 17.3.1, 20.1
confidence: high
contested: false
---

# Classified information

“Classified information” refers to the categories of information classified in accordance with the Security Regulations (S17 s.4.1(i)). S17 does **not** reprint the four grades or their damage tests. It names **RESTRICTED**, **CONFIDENTIAL**, **higher than CONFIDENTIAL**, and **RESTRICTED or above**. Data grade (this page) is a different fork from **system tier** ([[classified-protection]]). Control table: [[compare-classification-controls]].

## Need-to-know and integrity checking

The “need to know” principle **shall** be applied to all classified information, which should be provided only to persons who require it for the efficient discharge of their work and who have authorised access. No staff shall publish, make private copies of, or communicate to unauthorised persons any classified document or information obtained in official capacity, unless required to do so in the interest of the Government. If in doubt, consult the [[dso|DSO]] (S17 s.9.1.8).

Civil servants authorised to access classified information **higher than RESTRICTED shall** undergo an integrity check as stipulated by the Secretary for the Civil Service. For other staff, appropriate background verification checks **should** be carried out commensurate with business requirements, classification, and perceived risks (S17 s.9.1.4).

## Encryption and handling

**All classified information shall be encrypted in storage irrespective of the storage media** (S17 s.10.2.2). B/Ds shall comply with government classification, labelling, and handling requirements (s.10.2.1). Use and transportation of storage media containing classified information shall be managed; media shall be protected against unauthorised access, misuse, or physical damage; classified information shall be completely cleared or destroyed before disposal or re-use (ss.10.3.1–10.3.3). See [[encryption]] and [[06-assets]].

Access to systems containing classified information shall be restricted by logical access control; access without appropriate authentication shall not be allowed (S17 ss.11.1.3–11.1.4). Classified information **shall not** be stored or processed in privately-owned IoT devices (s.11.6.2). Display screens showing classified information shall be positioned so unauthorised persons cannot readily view them (s.13.2.5).

## Transit, email, cloud

| Path | S17 rule |
| --- | --- |
| Higher than CONFIDENTIAL in transit | Only under encryption **and** inside an isolated LAN approved by the Government Security Officer with [[dpo\|DPO]] technical endorsement (s.15.2.1) |
| CONFIDENTIAL / RESTRICTED in transit | **Shall** encrypt on an un-trusted network; **should** encrypt on any network as far as practicable (s.15.2.2) |
| Classified email | Only on an information system approved by the Government Security Officer subject to DPO technical endorsement (s.15.2.3) |
| External parties | Agreement on secure transfer of classified **shall** be established and documented (s.15.2.6) |
| Public cloud | Information classified **RESTRICTED or above shall not** be stored in or processed by public cloud services (s.17.3.1) |

Wireless without protection is named as the example of why classified in transit needs measures (S17 s.6). See [[wireless-security]] and [[11-communications]].

## Personal data and unclassified

Personal Data (Privacy) Ordinance (Cap. 486) **shall** be observed when handling personal data. All personal data **should** be classified as **RESTRICTED or above**. A higher classification **may** be required depending on nature, sensitivity, and harm (S17 s.20.1.4). Information without any security classification **should** also be protected from unintentional disclosure (s.20.1.3).

## Related

[[compare-classification-controls]] · [[encryption]] · [[classified-protection]] · [[dso]] · [[security-bureau]] · [[outsourcing-security]] · [[06-assets]] · [[11-communications]]
