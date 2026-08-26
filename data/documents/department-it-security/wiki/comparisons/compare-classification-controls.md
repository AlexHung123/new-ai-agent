---
title: Compare — classification controls
created: 2026-08-21
updated: 2026-08-21
type: comparison
tags: [comparison, classification, encryption]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 7.1.4, 11.1.9-11.1.10, 11.3.5, 17.1, 19.1.2, 19.6.1.3
confidence: high
contested: false
---

# Compare — classification controls

Ask “what classification?” before “which section?”. Grade definitions and portable-device rules: [[classified-information]]. Crypto and keys: [[encryption]]. SR extracts: [[annex-security-regulations]]. Wireless narrative: [[wireless-security]]. Rooms: [[02-physical]].

The CSB departmental network is **un-trusted** (DITSP s.19.1.2). CONFIDENTIAL and RESTRICTED therefore take the un-trusted-transit row whenever they move on that LAN.

Sources folded here: handling table s.17.1; computer-room levels s.7.1.4; wireless applicability s.19.6.1.3.

| Control | TOP SECRET / SECRET | CONFIDENTIAL | RESTRICTED |
| --- | --- | --- | --- |
| **Storage encryption** (s.9.1.4, s.17.1) | **Mandatory** | **Mandatory** | Recommended |
| **Shared access** (s.17.1) | **Prohibited** unless authorised (persons authorised to see **all** information on the machine — SR 353 / 360) | **Prohibited** unless authorised (same idea) | **Allowed** |
| **Shared-access tracking** (s.17.1) | Audit trail **and** logical access-control software | Audit trail **and** logical access-control software | Recommended |
| **Transit over a trusted network** (s.17.1) | **Mandatory**, and **only inside an isolated LAN** approved by the [[government-security-officer]] with [[ogcio]] technical endorsement (s.11.1.10) | Recommended | Recommended |
| **Transit over an un-trusted network** (s.11.1.9–11.1.10, s.17.1, s.19.1.2) | **Transmission prohibited** | **Mandatory** encryption | **Mandatory** encryption |
| **Email** (s.11.3.5, s.17.1) | Information System approved by the Government Security Officer subject to OGCIO technical endorsement, **and** complying with the isolated-LAN transit rule | **Confidential Mail System (CMS)** | **GCN** with encryption enabled, **or** a system with **PKI** encryption |
| **Processing** (s.17.1; SR in Appendix A) | Only on an Information System complying with **SR 356** | Only on an Information System complying with **SR 363** | Only on an Information System complying with **SR 367** |
| **Computer room** (s.7.1.4, s.17.1) | **Level III** | **Level II** | **Locked room / cabinet** |
| **Wireless** (s.19.6.1.3) | **Not allowed** | Allowed if authentication and transmission encryption meet the CONFIDENTIAL bar; **VPN recommended**; key management and configuration policy required | Allowed if authentication and encryption meet the RESTRICTED bar; **recommend CONFIDENTIAL-level encryption** and similar key/configuration policy |

Unclassified traffic may use wireless with sufficient authentication and encryption (s.19.6.1.3); it is not a Security Regulations grade and is omitted from the three columns.

## How to read the rows

- **Trusted vs un-trusted.** A trusted network is physically secured, protected from tampering, and administered under a defined policy (s.19.1.2, SR Chapter IX FAQ). Un-trusted includes general-purpose LAN, Internet, leased line, public telecom, dial-up, third-party-managed, **wireless**, Metro Ethernet — and **the CSB departmental network**.
- **Isolated LAN.** A LAN in a single controlled environment with **no** connection to any other network, including other government networks, Internet, and remote access (s.19.1.2). TOP SECRET/SECRET does not leave it.
- **Level II / III.** Footnote bodies are missing from this conversion. Cite SR / Security Bureau physical standards; do not reconstruct them here.
- **Logical access control** is also a Part II shall for CONFIDENTIAL-or-above systems (s.8.1.4).
- **Keys** take the same classification as the data (SR 370); CONFIDENTIAL+ keys stored separately (SR 371); personal custody (SR 372) — see [[encryption]].
- Intermediate material produced while processing takes the same grade as the data (s.17.1). Electronic form = paper equivalent.

## Related

[[classified-information]] · [[encryption]] · [[wireless-security]] · [[annex-security-regulations]] · [[04-data]]
