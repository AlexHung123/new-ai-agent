---
title: Classified information
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [classification, policy]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 4.1, 9.1, 10.2, 11.1, 12.1, 15.1-15.2, 20.1
confidence: high
contested: false
---

# Classified information

**Classified information** “refers to the categories of information classified in accordance with the Security Regulations” (G3 s.4.1(i)). G3 does **not** reprint the SR grades or their damage tests. Do not import TOP SECRET / SECRET wording, room levels, or SR clause numbers from other booklets. G3 names **RESTRICTED**, **CONFIDENTIAL**, **CONFIDENTIAL or above**, **higher than CONFIDENTIAL**, and **RESTRICTED or above**, and defers the categories themselves to SR (authorised by [[security-bureau|Security Bureau]], G3 s.2.3.1). Electronic messages, data, and documents in whatever form shall bear the **same classification as the paper equivalent** and be protected accordingly; the same applies to interim material produced in processing (G3 s.10.2(b)).

The control table that actually drives encryption, MFA, wireless, and email is [[compare-classification-controls]]. System tier (Tier 1/2/3) is a different fork: [[classified-protection]].

## Labelling (G3 s.10.2(a))

- Users given access to classified information on information systems shall be alerted to the type(s) they are accessing or going to access.
- The Subject field of a classified email shall include the classification category.
- Removable media storing classified information shall have clearly legible identification and conspicuous classification markings on labels fixed firmly to them and on their protective containers (keys stored on removable media and not used for backup need not have classification marked on a fixed label).

## Encryption at rest and in transit

**At rest.** All stored information classified as **RESTRICTED or above** shall be encrypted irrespective of the storage media (G3 s.10.2(b)). If a system mixes RESTRICTED and unclassified data, encryption may be at field, database, file, or disk-storage level. Network devices and proprietary appliances that cannot encrypt configurations, rule sets, or logs: complementary access control plus **Head of B/D** approval. Electronic messaging containing classified information shall be encrypted during transmission **or** storage (G3 s.15.2(b)). Sample end-user instructions restate: all stored classified information shall be encrypted (G3 Appendix A).

**In transit.** Information **higher than CONFIDENTIAL** shall be transmitted only when encrypted and inside an **isolated wired LAN** approved by the Government Security Officer with [[dpo|DPO]] technical endorsement (G3 s.15.2(a)). CONFIDENTIAL/RESTRICTED **should** be encrypted on any communication network and **shall** be encrypted on an **un-trusted** network (Internet; public telecommunication line such as leased line or dial-up; wireless; Metro Ethernet). A trusted network is physically secured, protected from tampering, and run under a defined configuration policy. Key lengths: [[encryption]].

## Email path (G3 s.15.2(b))

Email of classified information shall travel only on an information system **approved by the Government Security Officer**. For internal CONFIDENTIAL exchange: Confidential Mail System (CMS), Confidential Messaging Application (CMSG), Mobile Confidential Mail Service (MCMS), and approved sub-systems of Centrally Managed Messaging Platform (CMMP). Internet email, even if signed or encrypted, shall not be assumed equivalent to CMS or CMMP.

## Access, wireless, personal data, integrity checking

- Access without appropriate authentication shall not be allowed. **Multi-factor authentication shall** be used for an information system that stores information classified as **CONFIDENTIAL or above** (G3 s.11.1(c)).
- Wireless: treat as un-trusted; **higher than CONFIDENTIAL not allowed**; CONFIDENTIAL only on a designated device with Head of B/D approval (wireless keyboards: DITSO confirmation of industry standards instead); RESTRICTED allowed with sufficient authentication and encryption. Table: [[wireless-security]].
- **All personal data should be classified as RESTRICTED or above.** Higher classification may be required depending on nature, sensitivity, and harm. B/Ds shall comply with the Personal Data (Privacy) Ordinance, especially Data Protection Principle 4 (G3 s.20.1(d)).
- Access to classified information **higher than RESTRICTED** is restricted to **civil servants who have undergone appropriate integrity checks**. Consult the departmental personnel section about Integrity Checking Instructions. For staff other than civil servants, background verification commensurate with business needs, classification, and risk (G3 s.9.1(d)). Need-to-know doubts: consult [[dso|DSO]].

[[information-owner|Information Owners]] determine data classifications, authorised usage, and corresponding security requirements (G3 s.5.3.2).

## Related

[[compare-classification-controls]] · [[encryption]] · [[classified-protection]] · [[wireless-security]] · [[dso]] · [[security-bureau]] · [[06-assets]] · [[08-cryptography]]
