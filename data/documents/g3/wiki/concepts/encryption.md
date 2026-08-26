---
title: Encryption
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [encryption]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 10.2, 12.1, 15.2
confidence: high
contested: false
---

# Encryption

B/Ds shall ensure proper and effective use of cryptography to protect confidentiality, authenticity, and integrity of information (G3 s.12). B/Ds shall comply with government security requirements on encryption of classified data (G3 s.12.1(a)). Grade-by-grade storage, transit, wireless, and email path: [[compare-classification-controls]]. Algorithms and key lengths below are as G3 states them; do not invent others.

## At rest (G3 s.10.2(b))

All stored information classified as **RESTRICTED or above** shall be encrypted irrespective of the storage media. Encryption may be at field, database, file, or disk-storage level. Users should encrypt the file rather than relying on an application’s password-protection feature alone (G3 s.12.1(a)). Network devices / proprietary appliances that cannot encrypt configurations, rule sets, or logs: complementary access control and **Head of B/D** approval.

User passwords used for authentication or administration should be hashed or encrypted in storage. Hashing: at least SHA-2 or equivalent; **SM3** may be used subject to operational needs; **SHA-1 shall not** be used unless for legacy systems. If encryption (not hashing) is used, symmetric keys used for encryption or decryption shall be kept secret (G3 s.12.1(a)).

## In transit (G3 s.15.2(a))

- **Higher than CONFIDENTIAL:** transmit only when **encrypted and inside an isolated wired LAN** approved by the Government Security Officer at [[security-bureau|Security Bureau]] with [[dpo|DPO]] technical endorsement. Isolated LAN: single controlled environment, no connection to any other network (other government networks, Internet, remote access).
- **CONFIDENTIAL / RESTRICTED:** should be encrypted on any communication network; **shall** be encrypted on an **un-trusted** network (Internet; public telecommunication line such as leased line or dial-up; wireless; Metro Ethernet).
- Electronic messaging containing classified information shall be encrypted during transmission or storage (G3 s.15.2(b)).

## Key lengths (G3 s.12.1(b))

For information classified **CONFIDENTIAL or above**:

| Class | Floor (G3 text) |
| --- | --- |
| Symmetric | At least **128-bit AES** or equivalent; **SM4** may meet the requirement subject to operational needs |
| Asymmetric | At least **2048-bit RSA**; alternatively **ECC at least 224-bit** or equivalent; **SM2** subject to operational needs |

For **RESTRICTED** information, the above key lengths **should** also be adopted. B/Ds should plan to upgrade existing RESTRICTED systems to those lengths and review the plan regularly.

## Keys separate from ciphertext

For keys used to process **CONFIDENTIAL or above**, they **shall** be stored **separately** from the corresponding encrypted information (smart cards, tokens, disks, etc.). Do not distribute the decryption key along with the encrypted file. Cryptographic keys should never be transported together with the data or media containing encrypted data. Key management (generation, storage, recovery, backup, transfer, retirement, logging) should be documented; master keys in an HSM or TPM; recovery passwords with at least two levels of independent access control (G3 s.12.1(b)).

## Related

[[classified-information]] · [[compare-classification-controls]] · [[wireless-security]] · [[password-management]] · [[security-bureau]] · [[08-cryptography]]
