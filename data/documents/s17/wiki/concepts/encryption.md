---
title: Encryption
created: 2026-08-22
updated: 2026-08-22
type: concept
tags: [encryption, classification]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 6, 10.2.2, 11.3.3, 12.1, 15.1.8, 15.2
confidence: high
contested: false
---

# Encryption

S17 requires proper and effective use of cryptography to protect confidentiality, authenticity, and integrity (S17 s.12). Security measures **shall** preserve CIA of information while it is processed, in transit, and in storage; wireless without protection is the worked example (S17 s.6). Control table: [[compare-classification-controls]]. Key lifecycle: [[08-cryptography]].

S17 does **not** print algorithm or key-length floors (AES/RSA/ECC/SM). Those live in G3.

## At rest

**All classified information shall be encrypted in storage irrespective of the storage media** (S17 s.10.2.2). See [[classified-information]] and [[06-assets]]. Passwords **shall** always be well protected when held in storage (s.11.3.3).

## In transit

| What | S17 rule |
| --- | --- |
| Passwords on an un-trusted network | **Shall** be encrypted; compensating controls if encryption is not implementable (s.11.3.3) |
| Wireless connected to the government internal network | Proper authentication and encryption **shall** be employed (s.15.1.8) |
| Higher than CONFIDENTIAL | Transmit **only** under encryption **and** inside a GSO-approved isolated LAN with [[dpo\|DPO]] technical endorsement (s.15.2.1) |
| CONFIDENTIAL / RESTRICTED | **Shall** encrypt on an un-trusted communication network; **should** encrypt on any network as far as practicable (s.15.2.2) |

Classified email travels only on a GSO-approved system (s.15.2.3). See [[11-communications]] and [[wireless-security]].

## Key lifecycle (S17 s.12.1.1)

B/Ds **shall** manage cryptographic keys through their whole life cycle, including generating, storing, archiving, retrieving, distributing, retiring, and destroying keys.

Staff are prohibited from capturing decryption keys or other access-control mechanisms which could permit unauthorised access (S17 s.11.4.4).

## Related

[[classified-information]] · [[compare-classification-controls]] · [[08-cryptography]] · [[password-management]] · [[wireless-security]] · [[11-communications]] · [[06-assets]]
