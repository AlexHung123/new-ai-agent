---
title: Cryptography — key lifecycle
created: 2026-08-22
updated: 2026-08-22
type: chapter
tags: [chapter, encryption]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 12
confidence: high
contested: false
---

# Cryptography — key lifecycle

S17 s.12: B/Ds **shall** ensure proper and effective use of cryptography to protect the confidentiality, authenticity, and integrity of information. What must be encrypted, and when: [[encryption]], [[compare-classification-controls]].

## Cryptographic controls (S17 s.12.1)

B/Ds **shall** manage cryptographic keys through their **whole life cycle**, including generating, storing, archiving, retrieving, distributing, retiring, and destroying keys (s.12.1.1).

S17 does **not** print algorithm or key-length floors (AES/RSA/ECC/SM). Those implementation standards live in G3, not in this file. Do not invent them here.

Password encryption in transit on un-trusted networks: S17 s.11.3.3 ([[password-management]]). Classified at rest: S17 s.10.2.2. Classified in transit: S17 ss.15.2.1–15.2.2 ([[11-communications]]).

## Related

[[encryption]] · [[classified-information]] · [[compare-classification-controls]] · [[password-management]] · [[06-assets]] · [[11-communications]]
