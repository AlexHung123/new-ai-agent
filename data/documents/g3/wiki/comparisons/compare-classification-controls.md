---
title: Compare — classification controls
created: 2026-08-21
updated: 2026-08-21
type: comparison
tags: [comparison, classification, encryption]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 9.1, 10.2, 11.1, 12.1, 15.1-15.2
confidence: high
contested: false
---

# Compare — classification controls

G3 defers the **categories** of classified information to Security Regulations; it does **not** reprint the four grades or their damage tests, and it does **not** give Level II/III room standards. Do not import TOP SECRET / SECRET room language from other booklets. G3 names **RESTRICTED**, **CONFIDENTIAL**, **CONFIDENTIAL or above**, **higher than CONFIDENTIAL**, and **RESTRICTED or above**. Data grade (this page) is a different fork from **system tier** ([[compare-tiers]]). Narrative: [[classified-information]], [[encryption]], [[wireless-security]].

Personal data **should** be classified RESTRICTED or above (G3 s.20.1(d)). Integrity checking: access higher than RESTRICTED is restricted to civil servants who have undergone appropriate integrity checks (G3 s.9.1(d)).

## Control table as G3 states it

| Control | Higher than CONFIDENTIAL | CONFIDENTIAL | RESTRICTED | Unclassified |
| --- | --- | --- | --- | --- |
| **Stored encryption** | **Shall** encrypt all stored information classified **RESTRICTED or above**, irrespective of media (s.10.2(b)). Mixed RESTRICTED/unclassified: field, database, file, or disk level. Appliances that cannot encrypt configs/logs: complementary access control + Head of B/D approval. | Same *shall* (C is above R). | **Shall** encrypt at rest. | Protect confidentiality and integrity; no G3 at-rest encryption *shall*. |
| **Transit** | Transmit **only when encrypted and inside an isolated wired LAN** approved by the Government Security Officer ([[security-bureau]]) with [[dpo\|DPO]] technical endorsement. Isolated LAN: no connection to any other network, including other government networks, Internet, remote access (s.15.2(a)). | **Should** encrypt on any network; **shall** encrypt on an **un-trusted** network (Internet; public telecom line e.g. leased/dial-up; wireless; Metro Ethernet) (s.15.2(a)). | Same *should* / un-trusted *shall* as CONFIDENTIAL. | Encrypt with a proven algorithm before transmitting where the network-protection guidance applies (s.15.1(a)); no SR-grade *shall*. |
| **Key lengths** (s.12.1(b)) | **Shall:** AES-128 or equivalent (SM4 subject to operational needs); RSA-2048 or ECC-224 or equivalent (SM2 subject to operational needs). Keys for C+ **shall** be stored separately from ciphertext. | Same *shall* as “C or above”. | The above lengths **should** also be adopted; plan to upgrade existing RESTRICTED systems. | Not specified as a classified-data floor. |
| **MFA** | **Shall** use multi-factor authentication for an information system that stores information classified as **CONFIDENTIAL or above** (s.11.1(c)). | Same *shall*. | Not the C+ MFA *shall*. Need-to-know and authentication still apply. | Authentication commensurate with risk (s.11.4(a)). |
| **Wireless** (s.15.1(g)) | **Not allowed.** Treat all wireless as un-trusted; VPN overlay for classified over WLAN (ss.15.1(b), 15.1(e)). **WPA3 is not sufficient alone.** | Allowed on a **designated device** with **Head of B/D approval**, sufficient authentication and transmission encryption at CONFIDENTIAL level; VPN should be used. Wireless keyboards: no HoBD approval if industry standards are met **and [[ditso\|DITSO]] confirms**. | Allowed with sufficient authentication and transmission encryption at RESTRICTED level; recommend CONFIDENTIAL-level encryption. | Allowed; sufficient authentication and transmission encryption where appropriate. |
| **Email** (s.15.2(b)) | Classified email **shall** travel only on an information system **approved by the Government Security Officer**. | Internal CONFIDENTIAL: **CMS, CMSG, MCMS, and approved CMMP sub-systems**. Internet email, even signed or encrypted, **shall not** be assumed equivalent to CMS/CMMP. | Same GSO-approved-system rule for classified email; electronic messaging containing classified information **shall** be encrypted during transmission or storage. | Formal request for an email account; public email restricted unless unavoidable. |

Trusted vs un-trusted network tests: physically secured area; protected from unauthorised tampering; well-defined IT security policy for configuration and administration. Anything else is un-trusted (G3 s.15.2(a)).

## Related

[[classified-information]] · [[encryption]] · [[wireless-security]] · [[security-bureau]] · [[ditso]] · [[compare-tiers]] · [[08-cryptography]] · [[11-communications]]
