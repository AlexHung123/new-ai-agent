---
title: Government Security Officer
created: 2026-08-21
updated: 2026-08-21
type: entity
tags: [authority]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 11.1.10, 11.3.5, 15, 19.1.2, App A
confidence: high
contested: false
---

# Government Security Officer

The Government Security Officer sits in the **Security Bureau**. In DITSP and the Security Regulations extracts in Appendix A, the officer is the government-wide physical-security and classified-systems approver. [[ogcio]] gives the matching **technical endorsement** for isolated LANs and classified mail. DITSP repeats these SR rules; it cannot waive them. See [[classified-information]], [[02-physical]], and [[compare-classification-controls]].

## Isolated LAN and CMS

TOP SECRET / SECRET information shall be transmitted only under encryption and **inside an isolated LAN** approved by the Government Security Officer subject to OGCIO technical endorsement (DITSP s.11.1.10). An isolated LAN is a local area network in a single controlled environment with **no** connection to other networks, including other government networks, the Internet, and remote access (s.19.1.2). Transmission of TOP SECRET / SECRET off that LAN is prohibited (Appendix A, SR 357).

The same dual approval applies to storage of TOP SECRET / SECRET on a networked PC or server hard drive (SR 352(c)–(d)). A TOP SECRET / SECRET **server** on that LAN must also be in a room compliant with Level 3 Security (SR 352(d)). A stand-alone PC holding TOP SECRET / SECRET on its hard drive must be attended or in a physically secure environment the officer has approved (SR 352(b)).

Email of classified information (CONFIDENTIAL or RESTRICTED; TOP SECRET / SECRET also follow s.11.1.10) may be transmitted only on an Information System so approved — the Confidential Mail System (DITSP s.11.3.5; SR 365, 369).

## Physical security and media

Requirements for **physical** access control are specified by the Government Security Officer of the Security Bureau; logical access control and encryption methods are specified by OGCIO (Appendix A, SR 350(d)). CONFIDENTIAL on a server hard drive must be in a room compliant with Level 2 Security, **or** in a location the Government Security Officer considers equivalent or satisfactory (SR 359(d)).

Queries on handling media that contain classified information, or any grading higher than CONFIDENTIAL, may be addressed to the Department or Government Security Officer (DITSP s.15). Compromised cryptographic keys are reported to the Departmental IT Security Officer, who advises the Government Security Officer (SR 372(b)).

## Related

[[ogcio]] · [[classified-information]] · [[encryption]] · [[02-physical]] · [[06-network]]
