---
title: Classified data, encryption, disposal, and licensing
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, classification, encryption, copyright]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 9.1, 17.1, 17.3-17.9
confidence: medium
contested: false
---

# Classified data, encryption, disposal, and licensing

Part II policy (DITSP s.9.1) and Part III guidelines (ss.17.1, 17.3–17.9). Backup is split to [[04-data-backup]]. Classification is the architecture: ask “what classification?” before “which control?”. Compare [[classified-information]] and [[compare-classification-controls]].

The s.17.1 handling table is reconstructed from a MinerU conversion (`<eq>` markers; footnote bodies 6 and 7 missing). **Confidence medium** on individual cells. Verify against printed DITSP if a live decision turns on a cell.

## Section map

| DITSP | Topic |
| --- | --- |
| 9.1 | Overall confidentiality; CONFIDENTIAL+ encryption; SR Chapter IX |
| 17 intro | Example protections by threat |
| 17.1 | Four SR categories; handling table; portable devices; partners |
| 17.3 | User profiles and database views |
| 17.4 | Data and file encryption |
| 17.5 | Integrity; MD5 |
| 17.6 | SAN / NAS |
| 17.7 | Disposal; SR 377–378 |
| 17.8–17.9 | Licensing; Certificate of Product Patching; SMS for SAM |

## Overall confidentiality (DITSP s.9.1)

Information about Information Systems that may compromise their security shall not be disclosed except on a need-to-know basis and only if authorised by the [[ditso|Division DITSO]] (s.9.1.1). Staff shall not disclose who or which CSB systems suffered computer crime or abuse, or the methods used to exploit vulnerabilities, except to those handling the incident, those responsible for the security of the systems, or authorised investigators (s.9.1.2). Staff shall not disclose to unauthorised persons the nature and location of Information Systems, or the controls in use or how they are implemented (s.9.1.3).

All stored information classified as **CONFIDENTIAL or above** shall be encrypted (s.9.1.4). CSB shall comply with Security Regulations **Chapter IX** on storage, transmission, processing, and destruction of classified information (s.9.1.5). Footnote 5 on s.9.1.4 is not in this conversion.

Section 17's opening table lists example protections (encrypted passwords, ACLs, RAID/hot standby, digital signatures, transaction logs). Restrict access by password or user profiles/views; plan backup (see [[04-data-backup]]); add audit trail, [[encryption]], and network protection.

## Classification handling table (DITSP s.17.1)

Government sensitive data fall under four Security Regulations categories: TOP SECRET, SECRET, CONFIDENTIAL, RESTRICTED (SR Chapter III; document control in Chapter IV; extracts in [[annexes|Appendix A]]). The key Chapter IX rules as reconstructed:

| Requirement | TOP SECRET / SECRET | CONFIDENTIAL | RESTRICTED |
| --- | --- | --- | --- |
| Encryption in storage | Mandatory | Mandatory | Recommended |
| Shared access | Prohibited unless authorised | Prohibited unless authorised | Allowed |
| Shared-access tracking | Audit trail and logical access-control software | Audit trail and logical access-control software | Recommended |
| Encryption in transit on a **trusted** network | Mandatory, and only inside an isolated LAN | Recommended | Recommended |
| Encryption in transit on an **un-trusted** network | Transmission **prohibited** | Mandatory | Mandatory |
| Email | Information System approved by the [[government-security-officer]] with [[ogcio|OGCIO]] technical endorsement, meeting the transmission rule above | Confidential Mail System (CMS) | GCN with encryption enabled, or a system with PKI encryption |
| Processing | Only on a system complying with **SR 356** | **SR 363** | **SR 367** |
| Computer room | Level III | Level II | Locked room / cabinet |

The same rules apply to intermediate material produced in processing. Sensitive data and system disks must be removed when equipment is no longer used. Classified messages, data and documents in whatever form bear the same classification as the paper equivalent.

The **CSB departmental network is un-trusted** (it is a general-purpose LAN). Transit rules for CONFIDENTIAL / RESTRICTED encryption and the isolated-LAN path for TOP SECRET / SECRET live on [[06-network]] (s.19.1.2) — not duplicated here.

When using portable electronic devices (notebooks, removable media) to hold classified information, observe [[annex-portable-devices|Appendix B]] (s.17.1; added at v1.1). CSB shall advise business partners, contractors and outsourced staff to comply with the Security Regulations when transmitting, processing and storing Government-owned data.

## Profiles, encryption, integrity (DITSP ss.17.3–17.5)

Most DBMS products let users be classified so they only see data or perform a limited function, down to selected fields. Logical **views** add granularity. User profiles should be well protected (s.17.3).

Schemes include the application's own encryption, external hardware (modem/router — do not rely on manufacturer defaults), secret-key and public-key encryption. An application's password-protection (e.g. a word processor) hides a file from the curious; it **can be easily broken** and is **not recommended for sensitive information** (s.17.4). Authentication or administration passwords should be hashed or encrypted in storage; symmetric keys and decryption keys must be kept secret.

Integrity: do not use or hold untrustworthy software; time stamps or sequence numbers for completeness; parity checks or control totals against transmission error; cryptographic hashes and digital signatures (private key creates, matching public key verifies). Examples named: SHA and DSS. Papers show weaknesses in **MD5**; MD5 **should not be used in new systems**, and MD5 in existing systems should be replaced by stronger hashing (s.17.5).

## SAN / NAS (DITSP s.17.6)

A SAN is treated as a server hard drive. It is subject to the security requirements of the **highest classification** of data it contains. If attached by network protocol (e.g. Gigabit Ethernet, SCSI over IP) rather than Fibre Channel, transmission follows the same SR rules as the data classification. A NAS is a file-sharing server (NFS/SMB) over TCP/IP, usually with local disk or SAN behind it; it likewise inherits the **highest classification** of data it contains.

Guidance includes: change default passwords; do not plug management interfaces into un-trusted networks; protect management so only authorised staff from specific locations can manage; segment or encrypt management access; strict file-system access control; **zoning** for communication; **LUN masking** to hide LUNs from specific servers; secure any OS connected to the storage network.

## Disposal (DITSP s.17.7)

All classified data must be erased before disks or tapes are reused or disposed of (degauss tapes; overwrite disks, diskettes, cartridges, tapes). Destruction or erasure must comply with the Security Regulations. Users should refer to **SR 377** and **SR 378**. Classified information shall be **completely cleared** from storage media before disposal or re-use; if that is not feasible, the media unit must be **physically destroyed**.

A normal delete only removes the pointer; a general format does **not** prevent recovery. Use tools that **overwrite** the original storage area several times with different patterns. OGCIO Technical Notes pursuant to SR Chapter IX (2008 ITG InfoStation / CCGO) set the technical standard. There is no specific regulation on unclassified disposal; as a privacy good practice, use similar procedures if residual data would cause privacy problems. Physical kit disposal is also on [[02-physical]] (s.15.2.3).

## Licensing and SAM (DITSP ss.17.8–17.9)

Only approved software and hardware with purchased licences may be installed. Unauthorised copying, modification or unlicensed use is prohibited. Copyright of systems or software developed by CSB is owned by the Government. Audit the inventory of software on each server against licence agreements regularly (e.g. yearly). Store licences, manuals and procurement papers securely. See [[copyright-compliance]] and [[annex-copyright]].

When a System is ready for acceptance, the Government IT term contractor issues a **Certificate of Product Patching** listing patches applied and any applicable patches not applied, with reasons. When a manufacturer ceases support, CSB should assess security requirements, information handled, and risk from the obsolete product, then upgrade, migrate, or apply other measures.

Under the Intellectual Property Department *Handbook on Management of Intellectual Property in the Government*, executable files may not be downloaded to a workstation without permission of the Head of CSB (or usually the Intellectual Property Compliance Officer). IPD circular “Compliance with the Copyright Ordinance”, No. IPD/3/2005.

CSB has deployed Microsoft Systems Management Server (**SMS**) to automate software deployment, inventory scanning and metering: packages and patches, unauthorised software, licence coverage, unused licences (s.17.9). 2008 SAM theme page on ITG InfoStation / CCGO.

## Related

[[classified-information]] · [[compare-classification-controls]] · [[encryption]] · [[04-data-backup]] · [[06-network]] · [[annex-portable-devices]] · [[copyright-compliance]] · [[annex-copyright]] · [[government-security-officer]] · [[ogcio]]
