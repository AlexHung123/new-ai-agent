---
title: Communications security — network, wireless, Internet, classified transfer
created: 2026-08-22
updated: 2026-08-22
type: chapter
tags: [chapter, network, wireless, internet, email, encryption]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 15
confidence: high
contested: false
---

# Communications security — network, wireless, Internet, classified transfer

S17 s.15: B/Ds **shall** ensure the security of the information transferred within the Government and with any external parties. Classification path: [[compare-classification-controls]]. Wireless: [[wireless-security]]. Encryption: [[encryption]].

## Section map

| S17 | Topic |
| --- | --- |
| s.15.1.1 | Internal addresses/configs not publicly released without B/D approval |
| s.15.1.2 | Internal networks with connections to other government or public networks shall be protected |
| s.15.1.3 | Configuration and administration reviewed regularly |
| s.15.1.4 | Divide networks into separate domains / security boundaries |
| s.15.1.5 | Inter-B/D or external connections shall not downgrade security |
| s.15.1.6 | No unauthorised (including privately-owned) resources on internal net without [[ditso\|DITSO]] |
| s.15.1.7–15.1.8 | Wireless: document, monitor, control; authentication and encryption |
| s.15.1.9 | Internet access through central or B/D gateway; stand-alone **may** with approval |
| s.15.1.10 | No simultaneous internal + external connection without DITSO |
| s.15.2.1 | Higher than CONFIDENTIAL: encryption **and** GSO-approved isolated LAN |
| s.15.2.2 | CONFIDENTIAL/RESTRICTED: encrypt on un-trusted; should encrypt anywhere |
| s.15.2.3 | Classified email only on GSO-approved system (DPO technical endorsement) |
| s.15.2.4–15.2.5 | Email recording/retention/destruction; protect internal address lists |
| s.15.2.6 | Agreement on secure transfer of classified with external parties |
| s.15.2.7 | Suspicious electronic messages should not be opened or forwarded |

## Network security management (S17 s.15.1)

Internal network addresses, configurations, and related system or network information **shall** be properly maintained and **shall not** be publicly released without the approval of the concerned B/D (s.15.1.1). All internal networks with connections to other government networks or publicly accessible computer networks **shall** be properly protected (s.15.1.2). Proper configuration and administration of information/communication systems is required and **shall** be reviewed regularly (s.15.1.3).

B/Ds **shall** divide their networks into **separate network domains** to create security boundaries and have better control between them (s.15.1.4). Connections made to other networks **shall not** compromise the security of information processed at another, and vice versa. B/Ds **shall** define and implement proper security measures to ensure the security level of the departmental information system being connected with another information system under the control of another B/D or external party is **not downgraded** (s.15.1.5). External systems are assumed insecure: [[02-principles]].

**Unauthorised computer resources including those privately-owned shall not** be connected to the government internal network. If there is an operational necessity, approval from the [[ditso|DITSO]] **shall** be sought. B/Ds **shall** ensure that such usage of computer resources conforms to the same IT security requirements (s.15.1.6).

B/Ds **shall** document, monitor, and control wireless communications with connection to the government internal network (s.15.1.7). Proper authentication and encryption security controls **shall** be employed to protect data communication over wireless communications with connection to the government internal network (s.15.1.8). S17 does **not** print a grade-by-grade wireless table or a WPA3 product floor.

All Internet access **shall** be either through **centrally arranged Internet gateways** or the B/D’s own Internet gateway implemented with secure architecture and proper security measures. In circumstances where this is not feasible or having regard to the mode of use (footnote 2 missing — do not reconstruct), B/Ds **may** consider allowing Internet access through **stand-alone machines**, provided that there is an approval and control mechanism at an appropriate level in the B/Ds (s.15.1.9).

Staff **shall not** connect workstations and mobile devices to an external network by means of a communication device, such as a dial-up modem, wireless interface, or broadband link, if the workstations or mobile devices are **simultaneously connected** to a government internal network, unless with the approval from the DITSO (s.15.1.10).

## Information transfer (S17 s.15.2)

Information classified as **higher than CONFIDENTIAL shall** be transmitted only under encryption **and** inside an **isolated LAN** approved by the Government Security Officer with the technical endorsement of [[dpo|DPO]] (s.15.2.1). See [[security-bureau]].

**CONFIDENTIAL/RESTRICTED** information **shall** be encrypted when transmitted over an **un-trusted** communication network, and **should** be encrypted during transmission in any communication network as far as practicable (s.15.2.2).

Email transmission of classified information **shall** be transmitted only on an information system **approved by the Government Security Officer** subject to the technical endorsement of DPO (s.15.2.3). S17 does not name CMS / CMSG / MCMS / CMMP as the approved path.

Systems administrators **shall** establish and maintain a systematic process for the recording, retention, and destruction of electronic mail messages and accompanying logs (s.15.2.4). Internal email address lists containing entries for authorised users or government sites **shall** be properly maintained and protected from unauthorised access and modification (s.15.2.5).

Agreement on the secure transfer of classified information between B/Ds and external parties **shall** be established and documented (s.15.2.6). Electronic messages from suspicious sources **should not** be opened or forwarded (s.15.2.7).

## Related

[[classified-information]] · [[encryption]] · [[wireless-security]] · [[ditso]] · [[dpo]] · [[security-bureau]] · [[compare-classification-controls]] · [[malware]]
