---
title: Encryption
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [encryption, classification]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 8.6.3, 9.1.4, 11.1.9-11.1.10, 17.1, 17.4-17.5, App A SR 370-372
confidence: high
contested: false
---

# Encryption

Classification, not the section heading, decides whether encryption is mandatory. Stored **CONFIDENTIAL or above shall be encrypted** (DITSP s.9.1.4) [A] [U]. Transmission splits on trusted versus un-trusted networks and on grade. The matrix: [[compare-classification-controls]]. Grade definitions: [[classified-information]]. SR extracts: [[annex-security-regulations]].

## Storage (s.9.1.4, s.17.1)

| Grade | Encryption in storage |
| --- | --- |
| TOP SECRET / SECRET | Mandatory |
| CONFIDENTIAL | Mandatory |
| RESTRICTED | Recommended |

CSB shall comply with SR Chapter IX for storage, transmission, processing, and destruction (s.9.1.5). Portable devices that hold classified information follow Appendix B: encrypt; prefer removable media with built-in encryption ([[annex-portable-devices]]).

User passwords used for authentication or administration should be hashed or encrypted in storage (s.17.4). If encryption (not hashing) is used, symmetric keys must be kept secret ([[password-management]]).

## Transit (s.11.1.9–11.1.10, s.17.1, s.19.1.2)

**CONFIDENTIAL / RESTRICTED** shall be encrypted when transmitted over an **un-trusted** communication network (s.11.1.9). The CSB departmental network **is** un-trusted (s.19.1.2). Examples of un-trusted: general-purpose LAN, Internet, leased line, public telecom, dial-up, third-party-managed, wireless, Metro Ethernet.

**TOP SECRET / SECRET** shall be transmitted only under encryption **and inside an isolated LAN** approved by the [[government-security-officer]] subject to [[ogcio]] technical endorsement (s.11.1.10). An isolated LAN has no connection to any other network — other government networks, Internet, or remote access (s.19.1.2). Transmission of TOP SECRET/SECRET over an un-trusted network is **prohibited**.

On a trusted network, encryption is mandatory for TOP SECRET/SECRET (and only inside that isolated LAN); recommended for CONFIDENTIAL and RESTRICTED (s.17.1). Email path is a separate column: CMS for CONFIDENTIAL; GCN-with-encryption or PKI for RESTRICTED; GSO-approved system for TOP SECRET/SECRET.

Wireless is un-trusted. VPN on top of WLAN if classified data will move; TOP SECRET/SECRET not allowed on wireless at all ([[wireless-security]]).

## Application password-protection is not enough (s.17.4)

A word-processor (or similar) encryption / password-protection feature is for hiding a file from the curious. It is **easily broken** and **not recommended for sensitive information**. External hardware (encryption modem or router) must be configured before use; **do not rely on manufacturer defaults**.

## MD5 (s.17.5)

Hashing (SHA, DSS) and digital signatures protect integrity in transit. Published analysis shows weaknesses in **MD5**. MD5 **should not be used in new systems**; MD5 in existing systems should be replaced by stronger hashing algorithms.

## Keys — SR 370–372 (Appendix A)

A **key** is a code used on classified information for authentication, decryption, or generation of a digital signature (SR 350(c)). Logical access control and the encryption method must meet [[ogcio]] requirements (SR 350(d)).

| SR | Rule |
| --- | --- |
| **370** | A key has the **same classification** as the classified information it is used for. |
| **371** | Keys used for CONFIDENTIAL **or above** must be **stored separately** from the corresponding encrypted information. |
| **372** | Safeguard at all times. Keys on Information Systems must be controlled. Keys issued to an officer (smartcard, floppy, etc.) are in **personal custody**; unattended with reason to believe an unauthorised person had access is treated as **compromise** — report to the Departmental IT Security Officer (in CSB: [[ditso|Division DITSO]]), who replaces the key and advises the Government Security Officer. Officers are personally responsible for costs from loss, damage, or possible compromise. |

Removable media holding a key (and not used for backup) need not carry a classification label (SR 376). An unattended key or authentication device is a listed security breach (SR 383(b); DITSP s.21.2).

## Related

[[classified-information]] · [[compare-classification-controls]] · [[annex-security-regulations]] · [[04-data]]
